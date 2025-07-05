import React, { useState } from 'react';
import { Briefcase, Upload, Zap } from 'lucide-react';
import { useResume } from '../../contexts/ResumeContext';

const JobDescriptionInput: React.FC = () => {
  const { setCurrentStep, analyzeResume } = useResume();
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsProcessing(true);
    
    try {
      // Analyze resume with job description
      await analyzeResume(jobDescription);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    setIsProcessing(true);
    try {
      // Analyze resume without job description
      await analyzeResume();
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Job Description Matching
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Paste a job description to get targeted insights and skill gap analysis
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Paste the job description here...

Example:
We are looking for a Senior Frontend Developer with 5+ years of experience in React, TypeScript, and modern web technologies. The ideal candidate should have experience with:

• React, Redux, TypeScript
• Modern CSS frameworks (Tailwind, SCSS)
• RESTful APIs and GraphQL
• Testing frameworks (Jest, Cypress)
• Git version control
• Agile development methodologies

Requirements:
- Bachelor's degree in Computer Science or related field
- 5+ years of frontend development experience
- Strong problem-solving skills
- Experience with cloud platforms (AWS, Azure)
- Excellent communication skills"
          />
        </div>

        <div className="flex justify-center space-x-4">
          <button
            type="submit"
            disabled={!jobDescription.trim() || isProcessing}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isProcessing ? (
              <>
                <Zap className="w-5 h-5 animate-pulse" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Analyze Match</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleSkip}
            disabled={isProcessing}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
          >
            {isProcessing ? 'Analyzing...' : 'Skip for Now'}
          </button>
        </div>
      </form>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Skill Gap Analysis
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Identify missing skills and get suggestions for improvement
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Match Score
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get a compatibility score between your resume and the job
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Keyword Optimization
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Learn which keywords to include for better ATS compatibility
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionInput;