from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, Response

from app.limiter import limiter
from app.services.analyzer import analyze_resume
from app.services.db_service import (
    get_resume_by_id,
    get_resume_file,
    get_resume_history,
    get_resumes_by_user,
    save_resume_analysis,
)
from app.services.parser import extract_text

router = APIRouter()

ALLOWED_EXTENSIONS  = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB
PREVIEW_LENGTH      = 500


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

async def _read_and_parse(file: UploadFile) -> tuple[str, str, bytes]:
    """
    Validate, read, and extract text from an uploaded file.

    Returns:
        (filename, extracted_text, raw_bytes)
    """
    filename  = file.filename or "resume"
    extension = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{extension}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 10 MB size limit.")

    try:
        text = extract_text(file_bytes, filename)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {exc}") from exc

    return filename, text, file_bytes


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/upload")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
) -> JSONResponse:
    """Parse a resume file and return a raw text preview. Does not write to the DB."""
    filename, text, _ = await _read_and_parse(file)
    return JSONResponse(content={
        "filename":    filename,
        "text_length": len(text),
        "preview":     text[:PREVIEW_LENGTH],
    })


@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze_resume_endpoint(
    request:         Request,
    file:            UploadFile    = File(...),
    user_name:       Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
) -> JSONResponse:
    """
    Full pipeline: parse → NLP → score → AI → save file + analysis to MongoDB.

    Rate limit: 10 requests per minute per IP.

    Form fields
    -----------
    file            — resume file (required)
    user_name       — candidate name (optional; stored as "Anonymous" if omitted)
    job_description — job posting text (optional; improves AI feedback relevance)
    """
    filename, text, file_bytes = await _read_and_parse(file)

    try:
        result = analyze_resume(text, job_description=job_description)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc

    name = (user_name or "Anonymous").strip()
    jd   = (job_description or "").strip()

    doc_id: Optional[str] = await save_resume_analysis(
        user_name       = name,
        filename        = filename,
        result          = result,
        file_bytes      = file_bytes,
        job_description = jd,
    )

    return JSONResponse(content={
        "filename":  filename,
        "user_name": name,
        "doc_id":    doc_id,
        **result,
    })


# ---------------------------------------------------------------------------
# File download
# ---------------------------------------------------------------------------

@router.get("/file/{file_id}")
async def download_resume_file(request: Request, file_id: str) -> Response:
    """
    Stream the original uploaded resume file from GridFS.
    file_id comes from meta.file_id in any history record.
    """
    result = await get_resume_file(file_id)
    if result is None:
        raise HTTPException(status_code=404, detail="File not found.")

    data, filename, content_type = result
    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length":      str(len(data)),
        },
    )


# ---------------------------------------------------------------------------
# History endpoints
# ---------------------------------------------------------------------------

@router.get("/history")
async def resume_history(request: Request, limit: int = 20) -> JSONResponse:
    """Most recent analyses — lightweight projection."""
    records = await get_resume_history(limit=min(limit, 100))
    return JSONResponse(content={"count": len(records), "resumes": records})


@router.get("/history/user/{user_name}")
async def user_history(
    request: Request, user_name: str, limit: int = 10
) -> JSONResponse:
    """All analyses for a user name (case-insensitive)."""
    records = await get_resumes_by_user(user_name, limit=min(limit, 50))
    return JSONResponse(content={
        "user_name": user_name,
        "count":     len(records),
        "resumes":   records,
    })


@router.get("/history/{resume_id}")
async def resume_detail(request: Request, resume_id: str) -> JSONResponse:
    """Full analysis document by MongoDB id."""
    doc = await get_resume_by_id(resume_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return JSONResponse(content=doc)
