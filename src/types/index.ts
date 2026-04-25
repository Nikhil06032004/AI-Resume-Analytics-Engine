// ─── Resume file metadata (backend handles all parsing) ──────────────────────
export interface ResumeData {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
}

// ─── Job description ──────────────────────────────────────────────────────────
export interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

// ─── AI feedback layer ────────────────────────────────────────────────────────
export interface AIFeedback {
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  atsTips: string[];
  projectSuggestions: string[];
  careerLevel: 'fresher' | 'junior' | 'mid-level' | 'senior' | null;
  roleMatch: string[];
  redFlags: string[];
  uniqueInsights: string[];
}

// ─── NLP entity extraction ────────────────────────────────────────────────────
export interface NLPInsights {
  companiesDetected: string[];
  rolesDetected: string[];
  experienceTimeline: string[];
}

// ─── Feature signals ──────────────────────────────────────────────────────────
export interface AnalysisFeatures {
  skillsDetected: string[];
  skillsByCategory: Record<string, string[]>;
  skillCategoriesCovered: number;
  experienceYears: number;
  numJobs: number;
  companies: string[];
  roles: string[];
  bulletPoints: number;
  actionVerbsFound: number;
  numericMetrics: number;
  avgSentenceLength: number;
  sectionsFound: string[];
  keywordDensity: number;
  sectionCompleteness: number;
}

// ─── Full analysis result ─────────────────────────────────────────────────────
export interface AnalysisResult {
  filename: string;
  overallScore: number;
  scores: {
    experience: number;
    skills: number;
    content: number;
    ats: number;
  };
  features: AnalysisFeatures;
  nlpInsights: NLPInsights;
  aiFeedback: AIFeedback | null;
  aiError: string | null;       // real error from backend (quota, key, etc.)
  strengths: string[];
  improvements: string[];
  // Chart-compatible derived fields
  skillMatch: {
    matched: string[];
    missing: string[];
    matchPercentage: number;
  };
  sectionScores: {
    contact: number;
    summary: number;
    education: number;
    experience: number;
    skills: number;
    projects: number;
    certifications: number;
  };
  keywordFrequency: Record<string, number>;
  suggestions: string[];
  weaknesses: string[];
}

export interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

export type Theme = 'light' | 'dark';
export type AnalysisStep = 'upload' | 'analyzing' | 'job-matching' | 'results';
