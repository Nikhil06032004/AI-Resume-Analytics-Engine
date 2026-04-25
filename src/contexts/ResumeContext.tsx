import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ResumeData, JobDescription, AnalysisResult, AnalysisStep } from '../types';
import { analyzeResume as apiAnalyzeResume, fetchAIFeedback } from '../services/api';

interface ResumeContextType {
  currentStep: AnalysisStep;
  setCurrentStep: (step: AnalysisStep) => void;
  resume: ResumeData | null;
  setResume: (resume: ResumeData | null) => void;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  userName: string;
  setUserName: (name: string) => void;
  jobDescription: JobDescription | null;
  setJobDescription: (job: JobDescription | null) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  analyzeResume: (jobDesc?: string) => Promise<void>;
  getAISuggestions: () => Promise<void>;
  isAnalyzing: boolean;
  isAILoading: boolean;
  aiError: string | null;
  analysisError: string | null;
  resetAll: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const useResume = (): ResumeContextType => {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within ResumeProvider');
  return ctx;
};

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep]       = useState<AnalysisStep>('upload');
  const [resume, setResume]                 = useState<ResumeData | null>(null);
  const [resumeFile, setResumeFile]         = useState<File | null>(null);
  const [userName, setUserName]             = useState<string>('');
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [isAILoading, setIsAILoading]       = useState(false);
  const [analysisError, setAnalysisError]   = useState<string | null>(null);
  const [aiError, setAiError]               = useState<string | null>(null);

  // Stable ref so getAISuggestions always sees the latest analysisResult
  const resultRef = useRef<AnalysisResult | null>(null);
  resultRef.current = analysisResult;

  const analyzeResume = useCallback(async (jobDesc?: string) => {
    if (!resumeFile) return;
    // Pass userName to the API so it's stored in MongoDB
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCurrentStep('analyzing');
    try {
      const result = await apiAnalyzeResume(resumeFile, jobDesc, userName);
      setAnalysisResult(result);
      setCurrentStep('results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setAnalysisError(msg);
      setCurrentStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [resumeFile, userName]);

  const getAISuggestions = useCallback(async () => {
    const current = resultRef.current;
    if (!resumeFile || !current) return;

    setIsAILoading(true);
    setAiError(null);

    // Clear existing AI section so the user sees a real loading state
    setAnalysisResult({ ...current, aiFeedback: null, aiError: null });

    try {
      const { ai, error } = await fetchAIFeedback(resumeFile);
      if (ai) {
        setAnalysisResult({ ...current, aiFeedback: ai, aiError: null });
      } else {
        // Restore scores but show the real error from the backend
        const msg = error ?? 'AI did not return a response.';
        setAnalysisResult({ ...current, aiFeedback: null, aiError: msg });
        setAiError(msg);
      }
    } catch (err) {
      setAnalysisResult(current);
      setAiError(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setIsAILoading(false);
    }
  }, [resumeFile]);

  const resetAll = useCallback(() => {
    setCurrentStep('upload');
    setResume(null);
    setResumeFile(null);
    setUserName('');
    setJobDescription(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAiError(null);
  }, []);

  return (
    <ResumeContext.Provider value={{
      currentStep, setCurrentStep,
      resume, setResume,
      resumeFile, setResumeFile,
      userName, setUserName,
      jobDescription, setJobDescription,
      analysisResult, setAnalysisResult,
      analyzeResume,
      getAISuggestions,
      isAnalyzing,
      isAILoading,
      aiError,
      analysisError,
      resetAll,
    }}>
      {children}
    </ResumeContext.Provider>
  );
};
