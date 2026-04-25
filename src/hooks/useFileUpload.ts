import { useState, useCallback } from 'react';
import { ResumeData } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg']);

export const useFileUpload = () => {
  const [isDragActive, setIsDragActive]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]                 = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return `Unsupported format. Allowed: PDF, DOCX, TXT, PNG, JPG`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10 MB';
    }
    if (file.size === 0) {
      return 'File is empty';
    }
    return null;
  }, []);

  const processFile = useCallback(async (file: File): Promise<ResumeData | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setError(null);
    setUploadProgress(0);

    // Simulate upload progress while we wait for the backend later
    const steps = [15, 35, 60, 80, 95];
    for (const step of steps) {
      setUploadProgress(step);
      await new Promise(r => setTimeout(r, 120));
    }
    setUploadProgress(100);

    return {
      id:         Date.now().toString(),
      fileName:   file.name,
      fileSize:   file.size,
      uploadDate: new Date(),
    };
  }, [validateFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return {
    isDragActive,
    uploadProgress,
    error,
    setError,
    processFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
  };
};
