import React, { useState, useEffect } from 'react';
import { Brain, Zap, Target, TrendingUp, FileText, Search, Loader2, Sparkles } from 'lucide-react';
import { useResume } from '../../contexts/ResumeContext';

const STEPS = [
  { icon: FileText,   title: 'Parsing Resume',     desc: 'OCR extraction from PDF / image', duration: 1200 },
  { icon: Search,     title: 'Content Analysis',   desc: 'Sections, keywords, formatting',  duration: 1400 },
  { icon: Brain,      title: 'NLP Processing',     desc: 'Entity extraction via spaCy',      duration: 1800 },
  { icon: Zap,        title: 'Skill Matching',     desc: 'Taxonomy-based skill detection',   duration: 1000 },
  { icon: Target,     title: 'Score Calculation',  desc: 'Deterministic feature scoring',    duration: 800  },
  { icon: TrendingUp, title: 'AI Insights',        desc: 'Gemini generating feedback…',      duration: 1200 },
];

const LoadingScreen: React.FC = () => {
  const { isAnalyzing } = useResume();
  const [activeStep, setActiveStep]     = useState(0);
  const [progress, setProgress]         = useState(0);
  const [animDone, setAnimDone]         = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setActiveStep(i);

        const start = (i / STEPS.length) * 100;
        const end   = ((i + 1) / STEPS.length) * 100;
        const tick  = 50;
        const steps = STEPS[i].duration / tick;

        for (let t = 0; t < steps; t++) {
          if (cancelled) return;
          await new Promise(r => setTimeout(r, tick));
          setProgress(start + ((end - start) * (t + 1)) / steps);
        }
      }
      if (!cancelled) setAnimDone(true);
    };

    run();
    return () => { cancelled = true; };
  }, []);

  // After animation finishes, API might still be running — show a waiting state
  if (animDone && isAnalyzing) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Generating AI Insights
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Gemini is writing your personalised feedback — this can take a few seconds…
        </p>
        <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Almost there…</span>
        </div>
        {/* Pulse dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <Brain className="w-7 h-7 text-white animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analysing Your Resume
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          OCR · NLP · deterministic scoring · AI feedback
        </p>
      </div>

      {/* Active step banner */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
            {React.createElement(STEPS[activeStep]?.icon ?? Brain, {
              className: 'w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse',
            })}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {STEPS[activeStep]?.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {STEPS[activeStep]?.desc}
            </p>
          </div>
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-auto" />
        </div>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 border transition-all duration-300 ${
              i < activeStep
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : i === activeStep
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
              i <= activeStep
                ? i < activeStep ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
            }`}>
              <step.icon className={`w-4 h-4 ${i === activeStep ? 'animate-pulse' : ''}`} />
            </div>
            <p className={`text-xs font-semibold mb-0.5 ${
              i <= activeStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {step.title}
            </p>
            <p className={`text-xs ${
              i <= activeStep ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {step.desc}
            </p>
            {i < activeStep && (
              <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">✓ Done</div>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            Step {Math.min(activeStep + 1, STEPS.length)} of {STEPS.length}
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
