import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { AnalysisStep } from '../../types';

interface ProgressTrackerProps {
  currentStep: AnalysisStep;
}

const steps = [
  { key: 'upload', label: 'Upload Resume', description: 'Choose your resume file' },
  { key: 'analyzing', label: 'AI Analysis', description: 'Processing your resume' },
  { key: 'job-matching', label: 'Job Matching', description: 'Compare with job requirements' },
  { key: 'results', label: 'Results', description: 'View insights and recommendations' }
];

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentStep }) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                index < currentStepIndex
                  ? 'bg-green-500 text-white'
                  : index === currentStepIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
              }`}>
                {index < currentStepIndex ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${
                  index <= currentStepIndex
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 hidden md:block" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;