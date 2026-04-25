import React, { useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Brain, Shield, Zap, User } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useResume } from '../../contexts/ResumeContext';

const FEATURES = [
  {
    icon: Brain,
    color: 'blue',
    title: 'Real OCR + NLP',
    desc: 'Scanned PDFs and images — no mock data',
  },
  {
    icon: Shield,
    color: 'green',
    title: 'All Formats',
    desc: 'PDF, DOCX, TXT, PNG, JPG supported',
  },
  {
    icon: Zap,
    color: 'purple',
    title: 'AI Feedback',
    desc: 'Career level, role match, ATS tips',
  },
];

const ResumeUpload: React.FC = () => {
  const { resume, setResume, setResumeFile, setCurrentStep, analysisError, userName, setUserName } = useResume();
  const {
    isDragActive, uploadProgress, error,
    processFile, handleDragEnter, handleDragLeave, handleDragOver, setError,
  } = useFileUpload();

  const handleFile = useCallback(async (file: File) => {
    const data = await processFile(file);
    if (data) {
      setResume(data);
      setResumeFile(file);
    }
  }, [processFile, setResume, setResumeFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setResume(null);
    setResumeFile(null);
    setError(null);
  }, [setResume, setResumeFile, setError]);

  // Go to job-matching first — user can optionally add a job description
  const handleContinue = useCallback(() => {
    setCurrentStep('job-matching');
  }, [setCurrentStep]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Heading */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Upload Your Resume
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Real OCR · NLP · AI analysis &mdash; no mock data, no placeholders
        </p>
      </div>

      {/* Name input */}
      <div className="mb-6">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <User className="w-4 h-4" /> Your Name
        </label>
        <input
          type="text"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          placeholder="Enter your name (optional)"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Drop zone */}
      {!resume ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
            onChange={handleSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload resume file"
          />
          <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            isDragActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
          }`}>
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {isDragActive ? 'Drop it here!' : 'Drag & drop your resume'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">or click anywhere to browse</p>
          <span className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Browse Files
          </span>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            PDF &bull; DOCX &bull; TXT &bull; PNG &bull; JPG &nbsp;&nbsp;|&nbsp;&nbsp; Max 10 MB
          </p>
        </div>
      ) : (
        /* File ready state */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800/40 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100 text-sm">{resume.fileName}</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {(resume.fileSize / 1024).toFixed(1)} KB &bull; Ready to analyse
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-base transition-colors shadow-sm"
          >
            <CheckCircle className="w-5 h-5" />
            Continue to Analysis
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Reading file…
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Errors */}
      {(error ?? analysisError) && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error ?? analysisError}</p>
        </div>
      )}

      {/* Feature highlights */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, color, title, desc }) => (
          <div
            key={title}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center"
          >
            <div className={`w-10 h-10 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center mx-auto mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeUpload;
