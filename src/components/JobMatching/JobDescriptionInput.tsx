import React, { useState } from 'react';
import { Briefcase, Zap, SkipForward, Loader2 } from 'lucide-react';
import { useResume } from '../../contexts/ResumeContext';

const JobDescriptionInput: React.FC = () => {
  const { analyzeResume, isAnalyzing } = useResume();
  const [jobDesc, setJobDesc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDesc.trim()) return;
    await analyzeResume(jobDesc.trim());
  };

  const handleSkip = async () => {
    await analyzeResume();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-600 rounded-2xl mb-4 shadow-lg">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Job Description Matching
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Paste a job description to tailor the AI feedback and skill gap analysis to a specific role.
          You can also skip this step.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <label htmlFor="jobDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="jobDesc"
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            rows={10}
            disabled={isAnalyzing}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-sm disabled:opacity-50"
            placeholder="Paste the job description here…"
          />
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="submit"
            disabled={!jobDesc.trim() || isAnalyzing}
            className="inline-flex items-center gap-2 px-7 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isAnalyzing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              : <><Zap className="w-4 h-4" /> Analyze with Job Match</>}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-7 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobDescriptionInput;
