import React, { createContext, useContext, useState, useCallback } from 'react';
import { ResumeData, JobDescription, AnalysisResult, AnalysisStep } from '../types';
import { ResumeAnalyzer } from '../services/resumeAnalyzer';

interface ResumeContextType {
  currentStep: AnalysisStep;
  setCurrentStep: (step: AnalysisStep) => void;
  resume: ResumeData | null;
  setResume: (resume: ResumeData | null) => void;
  jobDescription: JobDescription | null;
  setJobDescription: (job: JobDescription | null) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  analyzeResume: (jobDesc?: string) => Promise<void>;
  isAnalyzing: boolean;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeResume = useCallback(async (jobDesc?: string) => {
    if (!resume) return;

    setIsAnalyzing(true);
    setCurrentStep('analyzing');

    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Perform actual analysis
      const result = await ResumeAnalyzer.analyzeResume(resume, jobDesc);
      
      setAnalysisResult(result);
      setCurrentStep('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      // Handle error appropriately
    } finally {
      setIsAnalyzing(false);
    }
  }, [resume]);

  return (
    <ResumeContext.Provider value={{
      currentStep,
      setCurrentStep,
      resume,
      setResume,
      jobDescription,
      setJobDescription,
      analysisResult,
      setAnalysisResult,
      analyzeResume,
      isAnalyzing
    }}>
      {children}
    </ResumeContext.Provider>
  );
};