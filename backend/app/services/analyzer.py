"""
Resume Analysis Engine
Deterministic, feature-based scoring — no AI APIs, no static/random scores.
All scores are derived exclusively from measurable text features.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from app.services.ai_service import generate_ai_insights
from app.services.nlp_service import build_experience_timeline, extract_entities

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ACTION_VERBS: frozenset[str] = frozenset({
    "achieved", "analyzed", "architected", "automated", "built", "collaborated",
    "configured", "created", "decreased", "defined", "delivered", "deployed",
    "designed", "developed", "directed", "drove", "eliminated", "engineered",
    "enhanced", "established", "executed", "generated", "grew", "guided",
    "identified", "implemented", "improved", "increased", "initiated",
    "integrated", "launched", "led", "managed", "mentored", "migrated",
    "modernized", "monitored", "negotiated", "optimized", "orchestrated",
    "oversaw", "planned", "prioritized", "produced", "published", "reduced",
    "refactored", "researched", "resolved", "restructured", "scaled",
    "shipped", "simplified", "spearheaded", "streamlined", "trained",
    "transformed", "upgraded",
})

SKILL_TAXONOMY: Dict[str, List[str]] = {
    "programming": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
        "perl", "bash", "shell",
    ],
    "web": [
        "react", "vue", "angular", "html", "css", "tailwind", "nextjs",
        "nuxt", "django", "flask", "fastapi", "express", "nodejs",
        "graphql", "rest", "api", "webpack", "vite", "sass", "bootstrap",
    ],
    "tools": [
        "git", "docker", "kubernetes", "jenkins", "terraform", "ansible",
        "jira", "confluence", "figma", "postman", "linux", "nginx",
        "apache", "github", "gitlab",
    ],
    "database": [
        "mysql", "postgresql", "mongodb", "redis", "sqlite", "oracle",
        "dynamodb", "cassandra", "elasticsearch", "firebase", "mariadb", "neo4j",
    ],
    "cloud": [
        "aws", "azure", "gcp", "heroku", "vercel", "netlify",
        "s3", "ec2", "lambda", "cloudfront", "rds",
    ],
    "data": [
        "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn",
        "spark", "hadoop", "airflow", "kafka", "tableau", "machine learning",
        "deep learning", "nlp", "data science",
    ],
}

SECTION_ANCHORS: Dict[str, List[str]] = {
    "summary":         ["summary", "objective", "profile", "about", "overview"],
    "experience":      ["experience", "work history", "employment", "career", "work experience"],
    "education":       ["education", "academic", "qualification", "degree"],
    "skills":          ["skills", "technical skills", "competencies", "technologies"],
    "projects":        ["projects", "portfolio", "work samples"],
    "certifications":  ["certifications", "certificates", "licenses"],
}

DEGREE_KEYWORDS: List[str] = [
    "bachelor", "master", "phd", "doctorate", "b.s", "m.s",
    "b.e", "m.e", "b.tech", "m.tech", "associate", "diploma", "mba",
]

INSTITUTION_KEYWORDS: List[str] = [
    "university", "college", "institute", "school", "academy",
]

_BULLET_RE = re.compile(r"^[\s]*[•\-\*•●▪>]\s+\S")

_YEAR_RANGE_RE = re.compile(
    r"((?:19|20)\d{2})\s*(?:[-–—]+|to)\s*((?:19|20)\d{2}|present|current|now)",
    re.IGNORECASE,
)

_NUMERIC_METRIC_RE = re.compile(
    r"(\d+\.?\d*\s*%"
    r"|\$\s*[\d,]+"
    r"|\d+[xX]\b"
    r"|\b\d{2,}\+?\s*(?:users|clients|engineers|employees|teams|projects|services|customers))",
    re.IGNORECASE,
)

_ROLE_RE = re.compile(
    r"\b(engineer|developer|manager|analyst|designer|lead|director|"
    r"scientist|consultant|specialist|architect|intern)\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ExperienceFeatures:
    num_roles: int = 0
    total_bullet_points: int = 0
    action_verb_count: int = 0
    estimated_years: float = 0.0


@dataclass
class SkillsFeatures:
    unique_skills: List[str] = field(default_factory=list)
    skills_by_category: Dict[str, List[str]] = field(default_factory=dict)
    category_coverage: int = 0
    skill_density: float = 0.0


@dataclass
class ContentQualityFeatures:
    avg_sentence_length: float = 0.0
    bullet_point_count: int = 0
    numeric_metrics_count: int = 0
    action_verb_ratio: float = 0.0


@dataclass
class ATSFeatures:
    keyword_density: float = 0.0
    section_completeness_score: float = 0.0
    formatting_score: float = 0.0


# ---------------------------------------------------------------------------
# Step 1 — Preprocessing
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Collapse runs of spaces/tabs; preserve newlines and original casing."""
    return re.sub(r"[ \t]+", " ", text).strip()


def _detect_sections(lines: List[str]) -> Dict[str, List[str]]:
    """
    Partition resume lines by section heading.
    A line is treated as a heading when it is short (<60 chars) and
    contains one of the anchor keywords for a known section.
    """
    sections: Dict[str, List[str]] = {key: [] for key in SECTION_ANCHORS}
    current: str | None = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        lower = stripped.lower()
        matched = False
        for section, anchors in SECTION_ANCHORS.items():
            if len(stripped) < 60 and any(anchor in lower for anchor in anchors):
                current = section
                matched = True
                break
        if not matched and current is not None:
            sections[current].append(stripped)

    return sections


# ---------------------------------------------------------------------------
# Step 2A — Experience Features
# ---------------------------------------------------------------------------

def extract_experience_features(text: str) -> ExperienceFeatures:
    lines = text.splitlines()

    bullets = sum(1 for line in lines if _BULLET_RE.match(line))

    words = re.findall(r"\b[a-z]+\b", text.lower())
    action_verb_count = sum(1 for w in words if w in ACTION_VERBS)

    role_matches = _ROLE_RE.findall(text)
    num_roles = len(set(m.lower() for m in role_matches)) if role_matches else 0

    ranges = _YEAR_RANGE_RE.findall(text)
    total_months = 0
    for start_str, end_str in ranges:
        start = int(start_str)
        end = 2025 if end_str.lower() in ("present", "current", "now") else int(end_str)
        total_months += max(0, (end - start) * 12)
    estimated_years = round(total_months / 12, 1)

    return ExperienceFeatures(
        num_roles=num_roles,
        total_bullet_points=bullets,
        action_verb_count=action_verb_count,
        estimated_years=estimated_years,
    )


# ---------------------------------------------------------------------------
# Step 2B — Skills Features
# ---------------------------------------------------------------------------

def extract_skills_features(text: str, total_words: int) -> SkillsFeatures:
    lower = text.lower()
    by_category: Dict[str, List[str]] = {}

    for category, skills in SKILL_TAXONOMY.items():
        found = [
            skill for skill in skills
            if re.search(r"\b" + re.escape(skill) + r"\b", lower)
        ]
        if found:
            by_category[category] = found

    unique_skills: List[str] = [s for skills in by_category.values() for s in skills]
    category_coverage = len(by_category)
    skill_density = len(unique_skills) / max(total_words, 1)

    return SkillsFeatures(
        unique_skills=unique_skills,
        skills_by_category=by_category,
        category_coverage=category_coverage,
        skill_density=round(skill_density, 6),
    )


# ---------------------------------------------------------------------------
# Step 2C — Content Quality Features
# ---------------------------------------------------------------------------

def extract_content_quality(text: str) -> ContentQualityFeatures:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    bullets = sum(1 for line in lines if _BULLET_RE.match(line))

    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    avg_len = (
        sum(len(s.split()) for s in sentences) / len(sentences)
        if sentences else 0.0
    )

    metrics = len(_NUMERIC_METRIC_RE.findall(text))

    words = re.findall(r"\b[a-z]+\b", text.lower())
    verb_count = sum(1 for w in words if w in ACTION_VERBS)
    verb_ratio = verb_count / max(len(words), 1)

    return ContentQualityFeatures(
        avg_sentence_length=round(avg_len, 2),
        bullet_point_count=bullets,
        numeric_metrics_count=metrics,
        action_verb_ratio=round(verb_ratio, 4),
    )


# ---------------------------------------------------------------------------
# Step 2D — ATS Features
# ---------------------------------------------------------------------------

def extract_ats_features(
    text: str,
    sections: Dict[str, List[str]],
    total_words: int,
) -> ATSFeatures:
    lower = text.lower()

    ats_vocab: set[str] = set(ACTION_VERBS) | {
        s for skills in SKILL_TAXONOMY.values() for s in skills
    }
    words = re.findall(r"\b\w+\b", lower)
    ats_hits = sum(1 for w in words if w in ats_vocab)
    keyword_density = ats_hits / max(total_words, 1)

    # Completeness: 4 priority sections
    priority = {"experience", "education", "skills", "summary"}
    present = sum(1 for s in priority if sections.get(s))
    section_completeness = present / len(priority)

    # Formatting: mix of bullet presence and reasonable line lengths
    all_lines = [l for l in text.splitlines() if l.strip()]
    n = max(len(all_lines), 1)
    bullet_ratio = sum(1 for l in all_lines if _BULLET_RE.match(l)) / n
    readable_ratio = sum(1 for l in all_lines if 10 < len(l.strip()) < 120) / n
    formatting_score = min((bullet_ratio + readable_ratio) / 2, 1.0)

    return ATSFeatures(
        keyword_density=round(keyword_density, 4),
        section_completeness_score=round(section_completeness, 2),
        formatting_score=round(formatting_score, 2),
    )


# ---------------------------------------------------------------------------
# Step 2E — Education (direct score, no dataclass needed)
# ---------------------------------------------------------------------------

def _score_education_direct(text: str) -> float:
    """Return 0–100 from detectable education signals."""
    lower = text.lower()
    score = 0.0
    if any(kw in lower for kw in DEGREE_KEYWORDS):
        score += 50
    if any(kw in lower for kw in INSTITUTION_KEYWORDS):
        score += 25
    if re.search(r"\bgpa\b|\bgrade point\b", lower):
        score += 15
    if re.search(r"\bhonors?\b|\bdistinction\b|\bcum laude\b|\bdean'?s list\b", lower):
        score += 10
    return min(score, 100.0)


# ---------------------------------------------------------------------------
# Step 3 — Dynamic Scoring (feature-scaled, no hard-coded grade bands)
# ---------------------------------------------------------------------------

def score_experience(features: ExperienceFeatures) -> float:
    """
    roles   → up to 40 pts (15 per unique role type, e.g. engineer, analyst)
    bullets → up to 30 pts (2 per bullet)
    verbs   → up to 20 pts (2 per action verb)
    years   → up to 10 pts (2 per year)
    """
    roles_score  = min(features.num_roles          * 15, 40)
    bullet_score = min(features.total_bullet_points *  2, 30)
    verb_score   = min(features.action_verb_count   *  2, 20)
    years_score  = min(features.estimated_years     *  2, 10)
    return round(min(roles_score + bullet_score + verb_score + years_score, 100.0), 1)


def score_skills(features: SkillsFeatures) -> float:
    """
    unique skills    → up to 50 pts (4 per skill)
    category spread  → up to 30 pts (8 per category covered)
    skill density    → up to 20 pts (density * 2000, capped)
    """
    unique_score   = min(len(features.unique_skills)  *  4, 50)
    category_score = min(features.category_coverage   *  8, 30)
    density_score  = min(features.skill_density       * 2000, 20)
    return round(min(unique_score + category_score + density_score, 100.0), 1)


def score_content(features: ContentQualityFeatures) -> float:
    """
    bullets  → up to 30 pts (2 per bullet)
    metrics  → up to 30 pts (6 per quantifiable achievement)
    verb ratio → up to 20 pts
    sentence length sweet spot (10-20 words) → up to 20 pts
    """
    bullet_score  = min(features.bullet_point_count    *  2, 30)
    metrics_score = min(features.numeric_metrics_count *  6, 30)
    verb_score    = min(features.action_verb_ratio     * 300, 20)

    avg = features.avg_sentence_length
    if 10 <= avg <= 20:
        length_score = 20.0
    elif avg < 10:
        length_score = max(0.0, avg * 2.0)
    else:
        length_score = max(0.0, 20.0 - (avg - 20) * 0.5)

    return round(min(bullet_score + metrics_score + verb_score + length_score, 100.0), 1)


def score_ats(features: ATSFeatures) -> float:
    """
    keyword density       → up to 40 pts
    section completeness  → up to 40 pts
    formatting quality    → up to 20 pts
    """
    kw_score      = min(features.keyword_density            * 600, 40)
    section_score = features.section_completeness_score     * 40
    fmt_score     = features.formatting_score               * 20
    return round(min(kw_score + section_score + fmt_score, 100.0), 1)


# ---------------------------------------------------------------------------
# Step 4 — Weighted Final Score
# ---------------------------------------------------------------------------

def compute_overall_score(
    exp: float,
    skills: float,
    content: float,
    ats: float,
    education: float,
) -> float:
    raw = (
        0.30 * exp
        + 0.25 * skills
        + 0.20 * content
        + 0.15 * ats
        + 0.10 * education
    )
    return round(min(raw, 100.0), 1)


# ---------------------------------------------------------------------------
# Step 5 — Insight Generation
# ---------------------------------------------------------------------------

_SCORE_LABELS: Dict[str, str] = {
    "experience": "work experience depth and action-driven bullet points",
    "skills":     "technical skill breadth and category coverage",
    "content":    "content quality, quantifiable achievements, and writing clarity",
    "ats":        "ATS keyword density and resume structure",
}

_IMPROVEMENT_TIPS: Dict[str, str] = {
    "experience": (
        "Add more quantified bullet points using strong action verbs "
        "(e.g. 'Led team of 5, reducing deployment time by 40%')."
    ),
    "skills": (
        "Expand your skill set across more categories (cloud, data, tools) "
        "and list them explicitly in a dedicated Skills section."
    ),
    "content": (
        "Include measurable metrics (%, $, counts) to demonstrate business impact; "
        "aim for 10–20 words per bullet point."
    ),
    "ats": (
        "Add clear section headers (Experience, Education, Skills, Summary) "
        "and increase the presence of relevant industry keywords."
    ),
}


def generate_insights(
    scores: Dict[str, float],
) -> Tuple[List[str], List[str]]:
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    strengths = [
        f"Strong {_SCORE_LABELS[k]} (score: {int(v)}/100)"
        for k, v in sorted_scores
        if v >= 60
    ][:3]

    improvements = [
        _IMPROVEMENT_TIPS[k]
        for k, v in sorted_scores
        if v < 60 and k in _IMPROVEMENT_TIPS
    ][:3]

    if not strengths:
        strengths = [
            "Resume has a foundational structure — build out each section for stronger scores."
        ]

    return strengths, improvements


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_resume(text: str, job_description: Optional[str] = None) -> dict:
    """
    Full pipeline: preprocess → NLP enrichment → feature extraction → score → insights.
    Returns a structured dict ready for JSON serialization.
    """
    if not text or not text.strip():
        raise ValueError("Resume text is empty.")

    normalized   = _normalize(text)
    lines        = normalized.splitlines()
    total_words  = len(re.findall(r"\b\w+\b", normalized.lower()))

    sections     = _detect_sections(lines)

    # --- Regex-based feature extraction (baseline) ---
    exp_feat     = extract_experience_features(normalized)
    skills_feat  = extract_skills_features(normalized, total_words)
    content_feat = extract_content_quality(normalized)
    ats_feat     = extract_ats_features(normalized, sections, total_words)

    # --- NLP enrichment (spaCy) ---
    # Overrides regex-derived role count and experience years with more
    # semantically aware values. Degrades gracefully if spaCy is unavailable.
    nlp_insights: Dict = {
        "companies_detected":  [],
        "roles_detected":      [],
        "experience_timeline": [],
    }
    try:
        nlp_entities = extract_entities(normalized)
        nlp_timeline = build_experience_timeline(nlp_entities, normalized)

        # NLP-derived values override regex when they are more precise.
        if nlp_timeline["num_jobs"] > exp_feat.num_roles:
            exp_feat.num_roles = nlp_timeline["num_jobs"]
        if nlp_timeline["experience_years"] > 0:
            exp_feat.estimated_years = nlp_timeline["experience_years"]

        nlp_insights = {
            "companies_detected":  nlp_timeline["companies"],
            "roles_detected":      nlp_timeline["roles"],
            # Structured timeline objects with start / end / duration_months
            "experience_timeline": nlp_timeline.get("timeline", []),
        }
    except Exception:
        # spaCy missing or NLP failure — scoring continues with regex values.
        pass

    # --- Scoring (unchanged logic) ---
    exp_score     = score_experience(exp_feat)
    skills_score  = score_skills(skills_feat)
    content_score = score_content(content_feat)
    ats_score     = score_ats(ats_feat)
    edu_score     = _score_education_direct(normalized)

    overall = compute_overall_score(
        exp_score, skills_score, content_score, ats_score, edu_score
    )

    component_scores = {
        "experience": exp_score,
        "skills":     skills_score,
        "content":    content_score,
        "ats":        ats_score,
    }

    strengths, improvements = generate_insights(component_scores)

    # --- AI insights layer (optional — degrades to None on any failure) ---
    ai_insights = None
    ai_error:   Optional[str] = None
    try:
        ai_insights = generate_ai_insights(
            text=normalized[:3000],
            features={
                "skills":           skills_feat.unique_skills,
                "roles":            nlp_insights.get("roles_detected", []),
                "companies":        nlp_insights.get("companies_detected", []),
                "experience_years": exp_feat.estimated_years,
                "job_description":  (job_description or "")[:1500],
            },
        )
    except Exception as exc:
        # Capture the error message so the frontend can show it instead of a
        # generic "check your API key" message.
        ai_error = str(exc)

    return {
        "overall_score": overall,
        "scores": component_scores,
        "features": {
            # Skill signals
            "skills_detected":          skills_feat.unique_skills,
            "skills_by_category":       skills_feat.skills_by_category,
            "skill_categories_covered": skills_feat.category_coverage,
            # Experience signals — NLP-enriched values used when available
            "experience_years":         exp_feat.estimated_years,
            "num_jobs":                 exp_feat.num_roles,
            "companies":                nlp_insights.get("companies_detected", []),
            "roles":                    nlp_insights.get("roles_detected", []),
            # Content signals
            "bullet_points":            exp_feat.total_bullet_points,
            "action_verbs_found":       exp_feat.action_verb_count,
            "numeric_metrics":          content_feat.numeric_metrics_count,
            "avg_sentence_length":      content_feat.avg_sentence_length,
            # ATS signals
            "sections_found":           [k for k, v in sections.items() if v],
            "keyword_density":          ats_feat.keyword_density,
            "section_completeness":     ats_feat.section_completeness_score,
        },
        "nlp_insights": nlp_insights,
        "ai_insights":  ai_insights,
        "ai_error":     ai_error,
        "strengths":    strengths,
        "improvements": improvements,
    }
