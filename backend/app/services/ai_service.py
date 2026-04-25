"""
AI Insights Service — Google AI Studio (Gemini) integration.

Uses the official google-generativeai SDK with gemini-2.0-flash.
Pure enhancement layer — never raises into the scoring pipeline.
Callers MUST wrap in try/except and degrade gracefully.
"""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any, Dict, Optional

try:
    from google import genai
    from google.genai import types as genai_types
    _SDK_AVAILABLE = True
except ImportError:
    _SDK_AVAILABLE = False

# Load API key via pydantic-settings (reads backend/.env automatically).
# Must import after the SDK check to avoid circular imports.
def _get_api_key() -> Optional[str]:
    try:
        from app.config import settings
        return settings.ai_api_key
    except Exception:
        import os
        return os.getenv("AI_API_KEY")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODEL_NAME        = "gemini-2.0-flash"
_TEMPERATURE       = 0.3
_MAX_OUTPUT_TOKENS = 2048
_TEXT_CHAR_LIMIT   = 3000

_VALID_CAREER_LEVELS = frozenset({"fresher", "junior", "mid-level", "senior"})

# Process-lifetime response cache — SHA-256(input) → result dict
_cache: Dict[str, Dict[str, Any]] = {}

# ---------------------------------------------------------------------------
# Output schema defaults  (all keys always present in the return value)
# ---------------------------------------------------------------------------

_EMPTY: Dict[str, Any] = {
    "summary":             None,
    "strengths":           [],
    "weaknesses":          [],
    "improvements":        [],
    "ats_tips":            [],
    "project_suggestions": [],
    "career_level":        None,
    "recommended_roles":   [],
    "red_flags":           [],
    "unique_insights":     [],
}

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

_PROMPT = """\
You are a senior technical recruiter and ATS expert analysing a resume.

RESUME DATA:
- Skills detected: {skills}
- Roles held: {roles}
- Companies: {companies}
- Years of experience: {experience_years}
- Resume text excerpt:
{text}{job_section}

Return ONLY the JSON object below — no markdown fences, no explanation.

{{
  "summary": "2-3 sentence professional profile of this candidate",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific gap 1", "specific gap 2"],
  "improvements": ["concrete action 1", "concrete action 2", "concrete action 3"],
  "ats_tips": ["ATS optimisation tip 1", "ATS tip 2", "ATS tip 3"],
  "project_suggestions": ["project idea 1", "project idea 2"],
  "career_level": "fresher | junior | mid-level | senior",
  "recommended_roles": ["role title 1", "role title 2", "role title 3"],
  "red_flags": [],
  "unique_insights": ["unique observation 1", "unique observation 2"]
}}

RULES:
- Base everything only on the data provided above
- career_level must be exactly one of: fresher, junior, mid-level, senior
- Be specific, not generic — reference actual skills and companies when possible
- Return ONLY the JSON object — nothing else
"""

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _cache_key(text: str, features: dict) -> str:
    payload = json.dumps(
        {"t": text[:500], "f": features},
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(payload.encode()).hexdigest()


def _build_prompt(text: str, features: dict) -> str:
    def _join(v: Any) -> str:
        if isinstance(v, list):
            return ", ".join(str(x) for x in v) if v else "Not specified"
        return str(v) if v else "Not specified"

    job_desc = str(features.get("job_description", "")).strip()
    job_section = (
        f"\n- Target job description:\n{job_desc[:1000]}"
        if job_desc else ""
    )

    return _PROMPT.format(
        skills=_join(features.get("skills")),
        roles=_join(features.get("roles")),
        companies=_join(features.get("companies")),
        experience_years=features.get("experience_years", 0),
        text=text[:_TEXT_CHAR_LIMIT],
        job_section=job_section,
    )


def _parse_response(raw: str) -> Dict[str, Any]:
    """Strip markdown fences, parse JSON, merge with schema defaults."""
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()

    parsed: Dict[str, Any] = {}
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if m:
            try:
                parsed = json.loads(m.group())
            except json.JSONDecodeError:
                pass

    result = dict(_EMPTY)
    for key in _EMPTY:
        if key in parsed:
            result[key] = parsed[key]

    if result["career_level"] not in _VALID_CAREER_LEVELS:
        result["career_level"] = None

    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_ai_insights(text: str, features: dict) -> Dict[str, Any]:
    """
    Generate structured resume insights via Google Gemini (gemini-2.0-flash).

    Args:
        text:     Raw resume text (first 3 000 chars sent to the model).
        features: {
            "skills":           List[str],
            "roles":            List[str],
            "companies":        List[str],
            "experience_years": float,
            "job_description":  str  (optional)
        }

    Returns:
        Dict with all _EMPTY schema keys populated.

    Raises:
        ValueError  — SDK not installed or AI_API_KEY missing.
        Exception   — Gemini API / network errors.
    """
    if not _SDK_AVAILABLE:
        raise ValueError(
            "google-genai SDK not installed. Run: pip install google-genai"
        )

    api_key = _get_api_key()
    if not api_key:
        raise ValueError(
            "AI_API_KEY is not configured. "
            "Add AI_API_KEY=your_key to backend/.env and restart the server."
        )

    key = _cache_key(text, features)
    if key in _cache:
        return _cache[key]

    try:
        client = genai.Client(api_key=api_key)
        prompt   = _build_prompt(text, features)
        response = client.models.generate_content(
            model=_MODEL_NAME,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=_TEMPERATURE,
                max_output_tokens=_MAX_OUTPUT_TOKENS,
            ),
        )
        result = _parse_response(response.text)
    except Exception as exc:
        msg = str(exc)
        # Surface quota / billing errors clearly instead of a generic failure
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            raise RuntimeError(
                "Gemini free-tier quota exhausted. "
                "Wait a minute and try again, or enable billing at "
                "https://ai.google.dev/gemini-api/docs/rate-limits"
            ) from exc
        if "401" in msg or "403" in msg or "API_KEY_INVALID" in msg:
            raise RuntimeError(
                "Invalid or revoked API key. "
                "Generate a new key at https://aistudio.google.com/app/apikey"
            ) from exc
        raise

    _cache[key] = result
    return result
