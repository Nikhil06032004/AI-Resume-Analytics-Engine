import React from 'react';
import { TrendingUp, Target, Award, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useResume } from '../../contexts/ResumeContext';
import PieChart from '../Charts/PieChart';
import ScoreGauge from '../Charts/ScoreGauge';
import RadarChart from '../Charts/RadarChart';
import BarChart from '../Charts/BarChart';

const Dashboard: React.FC = () => {
  const { analysisResult } = useResume();

  if (!analysisResult) {
    return <div>No analysis data available</div>;
  }

  const skillMatchData = [
    {
      label: 'Matched Skills',
      value: analysisResult.skillMatch.matched.length,
      color: '#10B981'
    },
    {
      label: 'Missing Skills',
      value: analysisResult.skillMatch.missing.length,
      color: '#EF4444'
    }
  ];

  const sectionData = Object.entries(analysisResult.sectionScores).map(([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: value
  }));

  const keywordData = Object.entries(analysisResult.keywordFrequency).map(([key, value]) => ({
    label: key,
    value: value
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Resume Analysis Results
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Here's your comprehensive resume analysis with AI-powered insights
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border-2 ${getScoreBgColor(analysisResult.overallScore)} dark:bg-gray-800 dark:border-gray-700`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                {analysisResult.overallScore}/100
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="p-6 rounded-xl border-2 bg-blue-50 border-blue-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Skill Match</p>
              <p className="text-3xl font-bold text-blue-600">
                {analysisResult.skillMatch.matchPercentage}%
              </p>
            </div>
            <Target className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="p-6 rounded-xl border-2 bg-purple-50 border-purple-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Skills Found</p>
              <p className="text-3xl font-bold text-purple-600">
                {analysisResult.skillMatch.matched.length}
              </p>
            </div>
            <Award className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Gauge */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <ScoreGauge score={analysisResult.overallScore} title="Resume Score" />
        </div>

        {/* Skill Match Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <PieChart data={skillMatchData} title="Skill Match Analysis" />
        </div>

        {/* Section Scores Radar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <RadarChart data={sectionData} title="Section Completeness" />
        </div>

        {/* Keyword Frequency Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <BarChart data={keywordData} title="Keyword Frequency" />
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {analysisResult.strengths.map((strength, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {analysisResult.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Suggestions</h3>
          </div>
          <ul className="space-y-2">
            {analysisResult.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Skills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Matched Skills</h3>
          <div className="flex flex-wrap gap-2">
            {analysisResult.skillMatch.matched.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Missing Skills</h3>
          <div className="flex flex-wrap gap-2">
            {analysisResult.skillMatch.missing.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;