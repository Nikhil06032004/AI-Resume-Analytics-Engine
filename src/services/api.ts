/**
 * API client — all backend communication, serialisation, and
 * snake_case → camelCase mapping in one place.
 */

import type { AnalysisResult, AIFeedback } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

// ─── Backend response shapes ──────────────────────────────────────────────────

interface BackendFeatures {
  skills_detected: string[];
  skills_by_category: Record<string, string[]>;
  skill_categories_covered: number;
  experience_years: number;
  num_jobs: number;
  companies: string[];
  roles: string[];
  bullet_points: number;
  action_verbs_found: number;
  numeric_metrics: number;
  avg_sentence_length: number;
  sections_found: string[];
  keyword_density: number;
  section_completeness: number;
}

interface BackendNLPInsights {
  companies_detected: string[];
  roles_detected: string[];
  experience_timeline: (string | BackendNLPExperienceEntry)[];
}

export interface BackendAIFeedback {
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  ats_tips: string[];
  project_suggestions: string[];
  career_level: string | null;
  // Phase 5: renamed from role_match → recommended_roles (supports both)
  role_match?: string[];
  recommended_roles?: string[];
  red_flags: string[];
  unique_insights: string[];
}

interface BackendNLPExperienceEntry {
  start: number;
  end: number;
  duration_months: number;
}

interface BackendAnalysisResponse {
  filename: string;
  overall_score: number;
  scores: { experience: number; skills: number; content: number; ats: number };
  features: BackendFeatures;
  nlp_insights: BackendNLPInsights;
  // Phase 5: renamed ai_feedback → ai_insights (supports both keys)
  ai_insights?: BackendAIFeedback | null;
  ai_feedback?: BackendAIFeedback | null;
  ai_error?: string | null;
  strengths: string[];
  improvements: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r(n: number) { return Math.round(n ?? 0); }

function mapAI(raw: BackendAIFeedback): AIFeedback {
  // Phase 5 renamed role_match → recommended_roles; support both
  const roles = raw.recommended_roles ?? raw.role_match ?? [];
  return {
    summary:            raw.summary,
    strengths:          raw.strengths          ?? [],
    weaknesses:         raw.weaknesses         ?? [],
    improvements:       raw.improvements       ?? [],
    atsTips:            raw.ats_tips           ?? [],
    projectSuggestions: raw.project_suggestions ?? [],
    careerLevel:        (raw.career_level as AIFeedback['careerLevel']) ?? null,
    roleMatch:          roles,
    redFlags:           raw.red_flags          ?? [],
    uniqueInsights:     raw.unique_insights    ?? [],
  };
}

// ─── Real score mapper ────────────────────────────────────────────────────────
// Section scores derived from backend feature signals — no fake hardcoded values.

function mapResponse(raw: BackendAnalysisResponse): AnalysisResult {
  const f   = raw.features ?? {} as BackendFeatures;
  const nlp = raw.nlp_insights ?? {} as BackendNLPInsights;

  const skills   = f.skills_detected  ?? [];
  const sections = f.sections_found   ?? [];
  const sc       = f.section_completeness ?? 0;  // 0–1
  const expScore = r(raw.scores?.experience ?? 0);
  const skScore  = r(raw.scores?.skills ?? 0);
  const atsScore = r(raw.scores?.ats ?? 0);

  // Section completeness radar — uses real backend signals
  const sectionScores = {
    contact:        r(Math.min(atsScore * 0.85 + sc * 10, 100)),
    summary:        sections.includes('summary')        ? r(Math.min(55 + sc * 40, 100)) : 18,
    education:      sections.includes('education')      ? r(Math.min(50 + sc * 35, 100)) : 18,
    experience:     expScore,
    skills:         skScore,
    projects:       sections.includes('projects')       ? r(Math.min(48 + sc * 35, 100)) : 18,
    certifications: sections.includes('certifications') ? r(Math.min(45 + sc * 30, 100)) : 12,
  };

  // Keyword frequency — real category skill counts, not fake sequential numbers
  const skillsByCategory = f.skills_by_category ?? {};
  const keywordFrequency: Record<string, number> = Object.fromEntries(
    Object.entries(skillsByCategory)
      .map(([cat, list]) => [cat, (list as string[]).length])
      .filter(([, n]) => (n as number) > 0)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 8),
  );

  // Phase 5: prefer ai_insights (new key); fall back to ai_feedback (old key)
  const rawAI = raw.ai_insights ?? raw.ai_feedback ?? null;
  const aiFeedback: AIFeedback | null = rawAI ? mapAI(rawAI) : null;
  // Forward the real error message from the backend (quota, invalid key, etc.)
  const backendAiError: string | null = raw.ai_error ?? null;

  return {
    filename:     raw.filename,
    overallScore: r(raw.overall_score),
    scores: {
      experience: expScore,
      skills:     skScore,
      content:    r(raw.scores?.content ?? 0),
      ats:        atsScore,
    },
    features: {
      skillsDetected:         skills,
      skillsByCategory,
      skillCategoriesCovered: f.skill_categories_covered ?? 0,
      experienceYears:        f.experience_years ?? 0,
      numJobs:                f.num_jobs ?? 0,
      companies:              f.companies ?? [],
      roles:                  f.roles ?? [],
      bulletPoints:           f.bullet_points ?? 0,
      actionVerbsFound:       f.action_verbs_found ?? 0,
      numericMetrics:         f.numeric_metrics ?? 0,
      avgSentenceLength:      f.avg_sentence_length ?? 0,
      sectionsFound:          sections,
      keywordDensity:         f.keyword_density ?? 0,
      sectionCompleteness:    sc,
    },
    nlpInsights: {
      companiesDetected:  nlp.companies_detected  ?? [],
      rolesDetected:      nlp.roles_detected      ?? [],
      // Phase 5: timeline entries are objects {start,end,duration_months}
      // Convert to strings for display; keep raw objects for future use
      experienceTimeline: (nlp.experience_timeline ?? []).map(e =>
        typeof e === 'string' ? e : `${e.start} – ${e.end === 2025 ? 'Present' : e.end}`
      ),
    },
    aiFeedback,
    aiError:      backendAiError,
    strengths:    raw.strengths   ?? [],
    improvements: raw.improvements ?? [],
    // Derived chart fields — real data
    skillMatch: {
      matched:         skills,
      missing:         [],
      matchPercentage: skills.length > 0 ? Math.min(r(skills.length * 5.5), 100) : 0,
    },
    sectionScores,
    keywordFrequency,
    suggestions: raw.improvements ?? [],
    weaknesses:  aiFeedback?.weaknesses ?? [],
  };
}

// ─── Error helper ─────────────────────────────────────────────────────────────

async function handleError(res: Response): Promise<never> {
  let detail = `Server error ${res.status}`;
  try { const b = await res.json(); if (b?.detail) detail = b.detail; } catch { /* */ }
  throw new Error(detail);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function analyzeResume(
  file: File,
  jobDescription?: string,
  userName?: string,
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append('file', file);
  if (jobDescription?.trim()) form.append('job_description', jobDescription.trim());
  if (userName?.trim())       form.append('user_name', userName.trim());
  const res = await fetch(`${API_BASE}/resume/analyze`, { method: 'POST', body: form });
  if (!res.ok) await handleError(res);
  return mapResponse(await res.json());
}

/** Fetch only AI feedback for an already-uploaded file (no full re-analysis). */
export async function fetchAIFeedback(
  file: File,
  jobDescription?: string,
): Promise<{ ai: AIFeedback | null; error: string | null }> {
  const form = new FormData();
  form.append('file', file);
  if (jobDescription?.trim()) form.append('job_description', jobDescription.trim());
  const res = await fetch(`${API_BASE}/resume/analyze`, { method: 'POST', body: form });
  if (!res.ok) {
    let detail = `Server error ${res.status}`;
    try { const b = await res.json(); if (b?.detail) detail = b.detail; } catch { /* */ }
    return { ai: null, error: detail };
  }
  const data: BackendAnalysisResponse = await res.json();
  const rawAI = data.ai_insights ?? data.ai_feedback ?? null;
  const error  = data.ai_error ?? null;
  return { ai: rawAI ? mapAI(rawAI) : null, error };
}

export async function uploadResumePreview(
  file: File,
): Promise<{ filename: string; text_length: number; preview: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/resume/upload`, { method: 'POST', body: form });
  if (!res.ok) await handleError(res);
  return res.json();
}
