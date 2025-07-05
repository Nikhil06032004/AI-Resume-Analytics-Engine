import React, { useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useResume } from '../../contexts/ResumeContext';

const ResumeUpload: React.FC = () => {
  const { resume, setResume, analyzeResume } = useResume();
  const {
    isDragActive,
    uploadProgress,
    error,
    processFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    setError
  } = useFileUpload();

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const result = await processFile(files[0]);
      if (result) {
        setResume(result);
      }
    }
  }, [processFile, setResume]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const result = await processFile(files[0]);
      if (result) {
        setResume(result);
      }
    }
  }, [processFile, setResume]);

  const handleAnalyze = useCallback(() => {
    if (resume) {
      analyzeResume();
    }
  }, [resume, analyzeResume]);

  const handleRemoveFile = useCallback(() => {
    setResume(null);
    setError(null);
  }, [setResume, setError]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Upload Your Resume
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Get AI-powered insights and recommendations to improve your resume
        </p>
      </div>

      {!resume ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload resume file"
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            or click to browse files
          </p>
          
          <div className="flex justify-center">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Select File
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Supported formats: PDF, DOC, DOCX, TXT</p>
            <p>Maximum size: 10MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {resume.fileName}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(resume.fileSize / 1024).toFixed(1)} KB • Uploaded successfully
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleAnalyze}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Analyze Resume
            </button>
          </div>
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Processing file...</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">Demo Mode</p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                {error.includes('sample content') 
                  ? 'Using sample content for demonstration. The analysis will work with realistic data.'
                  : error
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature highlights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Smart Analysis
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-powered analysis of your resume content, skills, and structure
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Multiple Formats
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Support for PDF, DOC, DOCX, and TXT file formats
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Instant Results
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get comprehensive analysis and recommendations in seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;