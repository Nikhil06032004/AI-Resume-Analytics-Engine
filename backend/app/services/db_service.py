"""
Database service — structured async CRUD for the resume analyzer.

Collections
───────────
  resumes             analysis documents (structured schema below)
  resume_files.*      GridFS — raw uploaded files (PDF, DOCX, TXT, PNG, JPG)

Analysis document schema
────────────────────────
{
  _id   : ObjectId
  meta  : {
    user_name, filename, file_size_bytes, file_id,
    upload_date, has_ai_insights, has_job_description
  }
  score : { overall, grade, breakdown: {experience, skills, content, ats} }
  features : {
    skills:     { detected, by_category, categories_covered }
    experience: { years, num_jobs, companies, roles, timeline }
    content:    { bullet_points, action_verbs_found, numeric_metrics,
                  avg_sentence_length, sections_found }
    ats:        { keyword_density, section_completeness }
  }
  ai_insights : { summary, career_level, strengths, weaknesses,
                  improvements, ats_tips, project_suggestions,
                  recommended_roles, red_flags, unique_insights } | null
  ai_error    : str | null
  insights    : { strengths, improvements }
}

All public functions degrade gracefully — a MongoDB failure never breaks
an endpoint. Errors are logged to stdout.
"""

from __future__ import annotations

import io
import re
from datetime import datetime
from typing import List, Optional, Tuple

from bson import ObjectId
from bson.errors import InvalidId

from app.core.database import get_gridfs_bucket, resumes_col


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_CONTENT_TYPES: dict[str, str] = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt":  "text/plain",
    "png":  "image/png",
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
}


def _grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"


def _content_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return _CONTENT_TYPES.get(ext, "application/octet-stream")


def _serialize(doc: dict) -> dict:
    """Convert ObjectId → str and make the dict JSON-serialisable."""
    doc["id"] = str(doc.pop("_id"))
    return doc


def _build_document(
    user_name:       str,
    filename:        str,
    file_size_bytes: int,
    file_id:         Optional[str],
    result:          dict,
    job_description: str = "",
) -> dict:
    raw_scores   = result.get("scores",       {})
    raw_features = result.get("features",     {})
    raw_nlp      = result.get("nlp_insights", {})
    raw_ai       = result.get("ai_insights")  or None
    overall      = result.get("overall_score", 0)

    return {
        "meta": {
            "user_name":           user_name.strip() or "Anonymous",
            "filename":            filename,
            "file_size_bytes":     file_size_bytes,
            "file_id":             file_id,           # GridFS ObjectId (str) or null
            "upload_date":         datetime.utcnow(),
            "has_ai_insights":     raw_ai is not None,
            "has_job_description": bool(job_description.strip()),
        },
        "score": {
            "overall": overall,
            "grade":   _grade(overall),
            "breakdown": {
                "experience": raw_scores.get("experience", 0),
                "skills":     raw_scores.get("skills",     0),
                "content":    raw_scores.get("content",    0),
                "ats":        raw_scores.get("ats",        0),
            },
        },
        "features": {
            "skills": {
                "detected":           raw_features.get("skills_detected",          []),
                "by_category":        raw_features.get("skills_by_category",       {}),
                "categories_covered": raw_features.get("skill_categories_covered", 0),
            },
            "experience": {
                "years":     raw_features.get("experience_years", 0),
                "num_jobs":  raw_features.get("num_jobs",         0),
                "companies": raw_features.get("companies",        []),
                "roles":     raw_features.get("roles",            []),
                "timeline":  raw_nlp.get("experience_timeline",   []),
            },
            "content": {
                "bullet_points":       raw_features.get("bullet_points",       0),
                "action_verbs_found":  raw_features.get("action_verbs_found",  0),
                "numeric_metrics":     raw_features.get("numeric_metrics",     0),
                "avg_sentence_length": raw_features.get("avg_sentence_length", 0),
                "sections_found":      raw_features.get("sections_found",      []),
            },
            "ats": {
                "keyword_density":      raw_features.get("keyword_density",      0),
                "section_completeness": raw_features.get("section_completeness", 0),
            },
        },
        "ai_insights": raw_ai,
        "ai_error":    result.get("ai_error"),
        "insights": {
            "strengths":    result.get("strengths",    []),
            "improvements": result.get("improvements", []),
        },
    }


# ---------------------------------------------------------------------------
# Index management
# ---------------------------------------------------------------------------

async def ensure_indexes() -> None:
    """Create required indexes. Idempotent — safe to call on every startup."""
    try:
        col = resumes_col()
        await col.create_index(
            [("meta.upload_date", -1)], name="idx_upload_date"
        )
        await col.create_index(
            [("meta.user_name", 1), ("meta.upload_date", -1)], name="idx_user_history"
        )
        await col.create_index(
            [("score.overall", -1)], name="idx_score"
        )
        print("[DB] Indexes verified.")
    except Exception as exc:
        print(f"[DB] ensure_indexes failed: {exc}")


# ---------------------------------------------------------------------------
# File storage — GridFS
# ---------------------------------------------------------------------------

async def save_resume_file(
    file_bytes: bytes,
    filename:   str,
    metadata:   dict,
) -> Optional[str]:
    """
    Upload the raw resume file to GridFS.

    Args:
        file_bytes : raw bytes of the uploaded file
        filename   : original filename with extension (e.g. "nikhil_cv.pdf")
        metadata   : arbitrary key/value pairs stored alongside the file
                     (e.g. user_name, analysis_id, content_type)

    Returns:
        GridFS file id as a string, or None on failure.
    """
    try:
        bucket  = get_gridfs_bucket()
        file_id = await bucket.upload_from_stream(
            filename,
            io.BytesIO(file_bytes),
            metadata={
                **metadata,
                "content_type": _content_type(filename),
                "upload_date":  datetime.utcnow(),
            },
        )
        print(f"[GridFS] Stored '{filename}' → {file_id}")
        return str(file_id)
    except Exception as exc:
        print(f"[GridFS] save_resume_file failed: {exc}")
        return None


async def get_resume_file(
    file_id: str,
) -> Optional[Tuple[bytes, str, str]]:
    """
    Download a stored resume file from GridFS.

    Returns:
        (file_bytes, original_filename, content_type) or None if not found.
    """
    try:
        bucket = get_gridfs_bucket()
        stream = await bucket.open_download_stream(ObjectId(file_id))
        data   = await stream.read()
        fname  = stream.filename or "resume"
        ctype  = _content_type(fname)
        return data, fname, ctype
    except (InvalidId, Exception) as exc:
        print(f"[GridFS] get_resume_file failed: {exc}")
        return None


# ---------------------------------------------------------------------------
# Analysis write
# ---------------------------------------------------------------------------

async def save_resume_analysis(
    user_name:       str,
    filename:        str,
    result:          dict,
    file_bytes:      bytes = b"",
    job_description: str   = "",
) -> Optional[str]:
    """
    Persist the analysis document and the raw file to MongoDB.

    Steps:
      1. Upload the raw file to GridFS (stores it with the original filename).
      2. Build a structured analysis document referencing the GridFS file_id.
      3. Insert the document into the 'resumes' collection.

    Returns the analysis document id, or None on failure.
    """
    try:
        name = user_name.strip() or "Anonymous"

        # 1 — store the raw file
        file_id: Optional[str] = None
        if file_bytes:
            file_id = await save_resume_file(
                file_bytes,
                filename,
                metadata={"user_name": name},
            )

        # 2 — build and insert the analysis document
        doc = _build_document(
            user_name       = name,
            filename        = filename,
            file_size_bytes = len(file_bytes),
            file_id         = file_id,
            result          = result,
            job_description = job_description,
        )
        inserted = await resumes_col().insert_one(doc)
        analysis_id = str(inserted.inserted_id)

        # 3 — back-patch the analysis_id onto the GridFS file metadata
        if file_id:
            try:
                await get_gridfs_bucket().rename(
                    ObjectId(file_id), filename  # rename keeps filename stable
                )
            except Exception:
                pass  # non-critical

        print(
            f"[DB] Saved → analysis={analysis_id}  file={file_id}  "
            f"user={name}  file={filename}"
        )
        return analysis_id

    except Exception as exc:
        print(f"[DB] save_resume_analysis failed: {exc}")
        return None


# ---------------------------------------------------------------------------
# Analysis read — list
# ---------------------------------------------------------------------------

_LIST_PROJECTION = {
    "_id":                      1,
    "meta.user_name":           1,
    "meta.filename":            1,
    "meta.file_size_bytes":     1,
    "meta.file_id":             1,
    "meta.upload_date":         1,
    "meta.has_ai_insights":     1,
    "meta.has_job_description": 1,
    "score.overall":            1,
    "score.grade":              1,
    "ai_insights.career_level": 1,
}


async def get_resume_history(limit: int = 20) -> List[dict]:
    """Return the most recent analyses as lightweight summary objects."""
    try:
        cursor = (
            resumes_col()
            .find({}, _LIST_PROJECTION)
            .sort("meta.upload_date", -1)
            .limit(limit)
        )
        return [_serialize(doc) async for doc in cursor]
    except Exception as exc:
        print(f"[DB] get_resume_history failed: {exc}")
        return []


# ---------------------------------------------------------------------------
# Analysis read — single document
# ---------------------------------------------------------------------------

async def get_resume_by_id(resume_id: str) -> Optional[dict]:
    """Return the full analysis document for a given MongoDB ObjectId string."""
    try:
        doc = await resumes_col().find_one({"_id": ObjectId(resume_id)})
        return _serialize(doc) if doc else None
    except (InvalidId, Exception) as exc:
        print(f"[DB] get_resume_by_id failed: {exc}")
        return None


# ---------------------------------------------------------------------------
# Analysis read — user history
# ---------------------------------------------------------------------------

async def get_resumes_by_user(user_name: str, limit: int = 10) -> List[dict]:
    """Return all analyses for a given user name (case-insensitive)."""
    try:
        pattern = re.compile(
            f"^{re.escape(user_name.strip())}$", re.IGNORECASE
        )
        cursor = (
            resumes_col()
            .find({"meta.user_name": pattern}, _LIST_PROJECTION)
            .sort("meta.upload_date", -1)
            .limit(limit)
        )
        return [_serialize(doc) async for doc in cursor]
    except Exception as exc:
        print(f"[DB] get_resumes_by_user failed: {exc}")
        return []
