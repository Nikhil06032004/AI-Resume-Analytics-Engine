import React from 'react';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  title?: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, maxScore = 100, size = 200, title }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const strokeWidth = 12;

  const circumference = 2 * Math.PI * radius;
  const percentage = (score / maxScore) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#EF4444'; // Red
    return '#EF4444'; // Red
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke={getScoreColor(score)}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {score}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                out of {maxScore}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Resume Score
          </div>
          <div className={`text-lg font-semibold ${
            score >= 80 ? 'text-green-600' : 
            score >= 60 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {score >= 80 ? 'Excellent' : 
             score >= 60 ? 'Good' : 
             score >= 40 ? 'Fair' : 'Needs Improvement'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;