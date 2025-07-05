import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ResumeProvider } from './contexts/ResumeContext';
import Header from './components/Layout/Header';
import ProgressTracker from './components/Layout/ProgressTracker';
import ResumeUpload from './components/Upload/ResumeUpload';
import LoadingScreen from './components/Analysis/LoadingScreen';
import JobDescriptionInput from './components/JobMatching/JobDescriptionInput';
import Dashboard from './components/Dashboard/Dashboard';
import { useResume } from './contexts/ResumeContext';

const AppContent: React.FC = () => {
  const { currentStep } = useResume();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return <ResumeUpload />;
      case 'analyzing':
        return <LoadingScreen />;
      case 'job-matching':
        return <JobDescriptionInput />;
      case 'results':
        return <Dashboard />;
      default:
        return <ResumeUpload />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProgressTracker currentStep={currentStep} />
          {renderCurrentStep()}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ResumeProvider>
        <AppContent />
      </ResumeProvider>
    </ThemeProvider>
  );
}

export default App;