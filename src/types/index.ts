export interface ResumeData {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  content: string;
  sections: {
    contact: boolean;
    summary: boolean;
    education: boolean;
    experience: boolean;
    skills: boolean;
    projects: boolean;
    certifications: boolean;
  };
  skills: string[];
  experience: number;
  education: string[];
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface AnalysisResult {
  overallScore: number;
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
  keywordFrequency: { [key: string]: number };
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

export type Theme = 'light' | 'dark';

export type AnalysisStep = 'upload' | 'analyzing' | 'job-matching' | 'results';