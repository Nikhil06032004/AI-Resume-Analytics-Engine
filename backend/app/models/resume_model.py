"""
Pydantic schemas for MongoDB resume documents.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ScoresSchema(BaseModel):
    experience: float = 0
    skills:     float = 0
    content:    float = 0
    ats:        float = 0


class ResumeDocument(BaseModel):
    """Full document stored in the 'resumes' collection."""
    user_name:     str
    filename:      str
    upload_date:   datetime = Field(default_factory=datetime.utcnow)
    overall_score: float
    scores:        ScoresSchema
    features:      Dict[str, Any] = {}
    nlp_insights:  Dict[str, Any] = {}
    ai_insights:   Optional[Dict[str, Any]] = None
    strengths:     List[str] = []
    improvements:  List[str] = []


class ResumeSummary(BaseModel):
    """Lightweight projection used in the history list."""
    id:            str
    user_name:     str
    filename:      str
    upload_date:   datetime
    overall_score: float
    career_level:  Optional[str] = None
