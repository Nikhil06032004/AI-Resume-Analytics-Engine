"""
NLP service — spaCy-based entity extraction with noise filtering.
Fully offline and deterministic. No external AI APIs.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional

import spacy
from spacy.language import Language
from spacy.tokens import Doc

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ROLE_KEYWORDS: frozenset[str] = frozenset({
    "engineer", "developer", "manager", "analyst", "designer", "lead",
    "director", "scientist", "consultant", "specialist", "architect",
    "intern", "officer", "coordinator", "administrator", "associate",
    "executive", "president", "vp", "cto", "ceo", "cfo", "coo",
    "head", "principal", "staff",
})

_YEAR_RANGE_RE = re.compile(
    r"((?:19|20)\d{2})\s*(?:[-–—]+|to)\s*((?:19|20)\d{2}|present|current|now)",
    re.IGNORECASE,
)

# Single-word strings that are definitely not real company / role names
_EXACT_NOISE: frozenset[str] = frozenset({
    # Resume section headers
    "education", "experience", "skills", "projects", "certifications",
    "summary", "objective", "profile", "employment", "work", "career",
    "qualifications", "achievements", "awards", "references", "activities",
    "volunteer", "interests", "languages", "publications", "training",
    # Generic academic single words
    "university", "college", "institute", "school", "academy",
    "faculty", "department", "campus",
    # Common spaCy false positives
    "bs", "ms", "phd", "gpa", "api", "llc", "inc", "ltd", "corp",
    "github", "linkedin", "stackoverflow", "indeed", "glassdoor",
    # Single letters / pronouns
    "i", "a", "the", "and", "or", "for", "of", "in", "at", "by",
})

# Phone-number-like patterns: mostly digits with separators
_PHONE_RE   = re.compile(r"^[\d\s\-\(\)\+\.]{7,}$")
# Purely numeric
_NUMERIC_RE = re.compile(r"^\d+$")
# All-caps section header (e.g. "EDUCATION", "EXPERIENCE")
_ALL_CAPS_RE = re.compile(r"^[A-Z]{3,}$")

# ---------------------------------------------------------------------------
# Lazy model loader
# ---------------------------------------------------------------------------

_nlp: Optional[Language] = None


def _get_nlp() -> Language:
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm", disable=["lemmatizer"])
        except OSError:
            raise RuntimeError(
                "spaCy model 'en_core_web_sm' is not installed. "
                "Run: python -m spacy download en_core_web_sm"
            )
    return _nlp


# ---------------------------------------------------------------------------
# Noise filter — applied to all extracted lists
# ---------------------------------------------------------------------------

def _is_noise(text: str) -> bool:
    """Return True when the string is garbage / not a meaningful entity."""
    s = text.strip()

    if len(s) < 3:
        return True

    # Purely numeric (e.g. "2019", "123")
    if _NUMERIC_RE.match(s):
        return True

    # Phone-number-like
    if _PHONE_RE.match(s):
        return True

    # All-caps single token that is a section header (e.g. "EDUCATION")
    if _ALL_CAPS_RE.match(s) and s.lower() in _EXACT_NOISE:
        return True

    # Single word that is an exact noise token
    if len(s.split()) == 1 and s.lower() in _EXACT_NOISE:
        return True

    # Numeric-heavy: > 55 % of characters are digits
    digit_ratio = sum(c.isdigit() for c in s) / len(s)
    if digit_ratio > 0.55:
        return True

    return False


def _clean(items: List[str]) -> List[str]:
    """Deduplicate and filter noise from an entity list."""
    seen: set[str] = set()
    out: List[str] = []
    for item in items:
        s = item.strip()
        if not s or _is_noise(s):
            continue
        key = s.lower()
        if key not in seen:
            seen.add(key)
            out.append(s)
    return out


# ---------------------------------------------------------------------------
# Extractors
# ---------------------------------------------------------------------------

def _extract_organizations(doc: Doc) -> List[str]:
    orgs: List[str] = []
    for ent in doc.ents:
        if ent.label_ == "ORG":
            orgs.append(ent.text.strip())
    return _clean(orgs)


def _extract_dates(doc: Doc) -> List[str]:
    dates = [ent.text.strip() for ent in doc.ents if ent.label_ == "DATE"]
    return _clean(dates)


def _extract_roles_from_chunks(doc: Doc) -> List[str]:
    roles: List[str] = []
    for chunk in doc.noun_chunks:
        tokens_lower = {t.lower_ for t in chunk}
        if not tokens_lower.intersection(ROLE_KEYWORDS):
            continue
        title = chunk.text.strip()
        word_count = len(title.split())
        if 2 <= word_count <= 6:
            roles.append(title)
    return _clean(roles)


# ---------------------------------------------------------------------------
# Public API — Part 1: Entity extraction
# ---------------------------------------------------------------------------

def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Run spaCy and return cleaned, deduplicated entities.

    Returns:
        {
            "organizations": [...],  # real company / employer names
            "dates":         [...],  # date entity strings
            "roles":         [...],  # multi-word job title phrases (2-6 words)
        }
    """
    empty: Dict[str, List[str]] = {"organizations": [], "dates": [], "roles": []}
    if not text or not text.strip():
        return empty

    nlp = _get_nlp()
    doc = nlp(text[: nlp.max_length])

    return {
        "organizations": _extract_organizations(doc),
        "dates":         _extract_dates(doc),
        "roles":         _extract_roles_from_chunks(doc),
    }


# ---------------------------------------------------------------------------
# Public API — Part 2: Experience timeline
# ---------------------------------------------------------------------------

def _parse_timeline(text: str) -> List[Dict]:
    """
    Find all YYYY–YYYY / YYYY–present spans, return structured list.
    Filters out zero-duration ranges and suspicious ranges (> 40 years).
    """
    timeline: List[Dict] = []
    seen_ranges: set[tuple] = set()

    for start_str, end_str in _YEAR_RANGE_RE.findall(text):
        start = int(start_str)
        end   = 2025 if end_str.lower() in ("present", "current", "now") else int(end_str)

        if end <= start:
            continue
        duration = (end - start) * 12
        if duration <= 0 or duration > 480:   # sanity: skip >40-year spans
            continue

        key = (start, end)
        if key in seen_ranges:
            continue
        seen_ranges.add(key)

        timeline.append({
            "start":           start,
            "end":             end,
            "duration_months": duration,
        })

    # Sort chronologically
    timeline.sort(key=lambda x: x["start"])
    return timeline


def build_experience_timeline(
    entities: Dict[str, List[str]],
    text: str,
) -> Dict:
    """
    Build a structured experience summary from NLP entities + date-range regex.

    num_jobs strategy (avoids inflation):
        Primary: number of distinct date ranges found (1 range ≈ 1 position).
        Secondary: number of companies / roles when no ranges available.
        Never take max of all three — that inflates the count.

    Returns:
        {
            "num_jobs":         int,
            "companies":        [...],
            "roles":            [...],
            "experience_years": float,
            "timeline":         [{"start": int, "end": int, "duration_months": int}, ...]
        }
    """
    companies: List[str] = entities.get("organizations", [])
    roles:     List[str] = entities.get("roles", [])
    timeline              = _parse_timeline(text)

    total_months    = sum(e["duration_months"] for e in timeline)
    experience_years = round(total_months / 12, 1)

    # num_jobs: trust date ranges when present; fall back to entity counts
    if timeline:
        # Each date range = one position; cap by entity count if implausible
        entity_cap = max(len(companies), len(roles), 1)
        num_jobs = min(len(timeline), entity_cap + 2)
    else:
        # No date ranges — use company count, then role count
        num_jobs = len(companies) if companies else (1 if roles else 0)

    return {
        "num_jobs":         num_jobs,
        "companies":        companies,
        "roles":            roles,
        "experience_years": experience_years,
        "timeline":         timeline,
    }
