import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { AnalysisStep } from '../../types';

interface ProgressTrackerProps {
  currentStep: AnalysisStep;
}

// Correct order: upload → job-matching → analyzing → results
const STEPS: { key: AnalysisStep; label: string; description: string }[] = [
  { key: 'upload',       label: 'Upload',      description: 'Choose your resume'         },
  { key: 'job-matching', label: 'Job Match',   description: 'Optional targeting'         },
  { key: 'analyzing',    label: 'Analysing',   description: 'OCR + NLP + AI processing'  },
  { key: 'results',      label: 'Results',     description: 'Insights & recommendations' },
];

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex items-center space-x-2.5">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                index < currentIndex  ? 'bg-green-500 text-white'
                : index === currentIndex ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
              }`}>
                {index < currentIndex
                  ? <CheckCircle className="w-4 h-4" />
                  : <Circle className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-semibold ${
                  index <= currentIndex ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                  {step.description}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <ArrowRight className={`w-4 h-4 hidden md:block shrink-0 ${
                index < currentIndex ? 'text-green-400' : 'text-gray-300 dark:text-gray-600'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
