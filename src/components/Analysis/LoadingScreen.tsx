import React, { useState, useEffect } from 'react';
import { Brain, Zap, Target, TrendingUp, FileText, Search } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const analysisSteps = [
    {
      icon: FileText,
      title: 'Parsing Resume',
      description: 'Extracting text and structure from your resume',
      duration: 1000
    },
    {
      icon: Search,
      title: 'Content Analysis',
      description: 'Analyzing sections, keywords, and formatting',
      duration: 1500
    },
    {
      icon: Brain,
      title: 'AI Processing',
      description: 'Running AI algorithms for skill extraction',
      duration: 2000
    },
    {
      icon: Zap,
      title: 'Skill Matching',
      description: 'Comparing skills with industry requirements',
      duration: 1000
    },
    {
      icon: Target,
      title: 'Score Calculation',
      description: 'Computing comprehensive resume metrics',
      duration: 800
    },
    {
      icon: TrendingUp,
      title: 'Generating Insights',
      description: 'Creating personalized recommendations',
      duration: 700
    }
  ];

  useEffect(() => {
    let totalDuration = 0;
    const stepDurations = analysisSteps.map(step => step.duration);
    
    const runSteps = async () => {
      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentStep(i);
        
        // Animate progress for current step
        const stepDuration = stepDurations[i];
        const stepStartProgress = (i / analysisSteps.length) * 100;
        const stepEndProgress = ((i + 1) / analysisSteps.length) * 100;
        
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + (stepEndProgress - stepStartProgress) / (stepDuration / 50);
            if (newProgress >= stepEndProgress) {
              clearInterval(progressInterval);
              return stepEndProgress;
            }
            return newProgress;
          });
        }, 50);
        
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    };

    runSteps();
  }, []);

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <Brain className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Analyzing Your Resume
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Our AI is processing your resume and generating insights...
        </p>
      </div>

      {/* Current Step Indicator */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              {React.createElement(analysisSteps[currentStep]?.icon || Brain, {
                className: "w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse"
              })}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {analysisSteps[currentStep]?.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analysisSteps[currentStep]?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {analysisSteps.map((step, index) => (
          <div 
            key={index} 
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border transition-all duration-300 ${
              index <= currentStep 
                ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg mb-4 mx-auto transition-colors ${
              index <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
            }`}>
              <step.icon className={`w-6 h-6 ${index === currentStep ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className={`font-semibold mb-2 transition-colors ${
              index <= currentStep 
                ? 'text-blue-900 dark:text-blue-100' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {step.title}
            </h3>
            <p className={`text-sm transition-colors ${
              index <= currentStep 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {step.description}
            </p>
            {index <= currentStep && (
              <div className="mt-3 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Analysis Progress
          </span>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Step {currentStep + 1} of {analysisSteps.length}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;