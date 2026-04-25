import React from 'react';
import {
  TrendingUp, Briefcase, Award, Target, RotateCcw,
  CheckCircle, XCircle, Lightbulb, ShieldCheck, Rocket,
  Sparkles, AlertOctagon, Brain, Star,
  Zap, Loader2, Wand2,
} from 'lucide-react';
import { useResume } from '../../contexts/ResumeContext';
import { AIFeedback } from '../../types';
import ScoreGauge from '../Charts/ScoreGauge';
import PieChart   from '../Charts/PieChart';
import RadarChart from '../Charts/RadarChart';
import BarChart   from '../Charts/BarChart';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-500' : 'text-red-500';

const scoreBg = (s: number) =>
  s >= 80
    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
    : s >= 60
    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';

const CAREER_PILL: Record<string, string> = {
  fresher:     'bg-gray-100 text-gray-700   dark:bg-gray-700  dark:text-gray-300',
  junior:      'bg-blue-100 text-blue-700   dark:bg-blue-900/40 dark:text-blue-300',
  'mid-level': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  senior:      'bg-green-100 text-green-700  dark:bg-green-900/40 dark:text-green-300',
};

// ─── Reusable primitives ──────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ icon: React.ReactNode; label: string; accent: string }> = ({ icon, label, accent }) => (
  <div className={`flex items-center gap-2 mb-4 text-${accent}-600 dark:text-${accent}-400`}>
    {icon}
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{label}</h3>
  </div>
);

const BulletList: React.FC<{ items: string[]; dot: string; emptyMsg?: string }> = ({ items, dot, emptyMsg }) => {
  if (!items.length && emptyMsg)
    return <p className="text-sm text-gray-400 dark:text-gray-500 italic">{emptyMsg}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={`w-2 h-2 ${dot} rounded-full mt-1.5 shrink-0`} />
          <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const Chip: React.FC<{ label: string; color?: 'green' | 'red' | 'blue' | 'purple' | 'gray' | 'teal' }> = ({
  label, color = 'blue',
}) => {
  const s = {
    green:  'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',
    red:    'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400',
    blue:   'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    gray:   'bg-gray-100   text-gray-700   dark:bg-gray-700      dark:text-gray-300',
    teal:   'bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s[color]}`}>
      {label}
    </span>
  );
};

// ─── AI Career Profile banner ─────────────────────────────────────────────────

const AIBanner: React.FC<{ ai: AIFeedback }> = ({ ai }) => (
  <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 shadow-lg text-white">
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-base">AI Career Profile</p>
            <p className="text-blue-200 text-xs">Powered by Google Gemini</p>
          </div>
        </div>
        {ai.careerLevel && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${CAREER_PILL[ai.careerLevel] ?? 'bg-white/20 text-white'}`}>
            {ai.careerLevel}
          </span>
        )}
      </div>

      {ai.summary && (
        <p className="text-blue-50 text-sm leading-relaxed mb-4">{ai.summary}</p>
      )}

      {ai.roleMatch.length > 0 && (
        <div>
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">Recommended Roles</p>
          <div className="flex flex-wrap gap-2">
            {ai.roleMatch.map((r, i) => (
              <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium">{r}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── AI Suggestions button ────────────────────────────────────────────────────

const AIButton: React.FC<{ hasAI: boolean; loading: boolean; onClick: () => void }> = ({
  hasAI, loading, onClick,
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60
      bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
      text-white shadow-md hover:shadow-lg active:scale-95"
  >
    {loading
      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
      : <><Wand2 className="w-4 h-4" /> {hasAI ? 'Refresh AI Insights' : 'Get AI Suggestions'}</>}
  </button>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { analysisResult, isAILoading, aiError: contextAiError, getAISuggestions, resetAll } = useResume();

  if (!analysisResult) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        No analysis data available.
      </div>
    );
  }

  const {
    filename, overallScore, scores, features, nlpInsights,
    aiFeedback, aiError: resultAiError, strengths, improvements, sectionScores, keywordFrequency,
  } = analysisResult;

  // Show backend error (quota/key) OR context-level error
  const displayAiError = resultAiError ?? contextAiError;

  // ── Chart data ──────────────────────────────────────────────────────────────

  // Skill coverage pie — categories with their skill counts
  const skillCoverageData = Object.entries(features.skillsByCategory)
    .filter(([, skills]) => skills.length > 0)
    .map(([cat, skills]) => ({ label: cat, value: skills.length }));

  // Section completeness radar — real scores from backend signals
  const radarData = [
    { label: 'Contact',    value: sectionScores.contact },
    { label: 'Summary',    value: sectionScores.summary },
    { label: 'Education',  value: sectionScores.education },
    { label: 'Experience', value: sectionScores.experience },
    { label: 'Skills',     value: sectionScores.skills },
    { label: 'Projects',   value: sectionScores.projects },
    { label: 'Certs',      value: sectionScores.certifications },
  ];

  // Top skills bar — real category counts
  const barData = Object.entries(keywordFrequency).map(([label, value]) => ({ label, value }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Analysis Results</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{filename}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AIButton hasAI={!!aiFeedback} loading={isAILoading} onClick={getAISuggestions} />
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Analyse Another
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Score',  value: overallScore,      icon: TrendingUp, extra: scoreBg(overallScore),  textCls: scoreColor(overallScore) },
          { label: 'Experience',     value: scores.experience, icon: Briefcase,  extra: 'bg-blue-50   border-blue-200   dark:bg-blue-900/20   dark:border-blue-800',   textCls: 'text-blue-600'   },
          { label: 'Skills Score',   value: scores.skills,     icon: Award,      extra: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800', textCls: 'text-purple-600' },
          { label: 'ATS Score',      value: scores.ats,        icon: Target,     extra: 'bg-teal-50   border-teal-200   dark:bg-teal-900/20   dark:border-teal-800',   textCls: 'text-teal-600'   },
        ].map(({ label, value, icon: Icon, extra, textCls }) => (
          <div key={label} className={`p-5 rounded-2xl border-2 ${extra}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
                <p className={`text-4xl font-extrabold mt-1 ${textCls}`}>{value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">out of 100</p>
              </div>
              <Icon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Career Profile ── */}
      {aiFeedback && <AIBanner ai={aiFeedback} />}

      {/* Loading state — shown while refresh is in progress */}
      {isAILoading && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-6 flex items-center gap-4">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Generating AI insights…</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gemini is analysing your resume — this takes a few seconds.</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {displayAiError && !isAILoading && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">AI insights failed</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{displayAiError}</p>
          </div>
        </div>
      )}

      {/* Empty state — no AI yet and not loading */}
      {!aiFeedback && !isAILoading && !displayAiError && (
        <div className="rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 p-6 text-center">
          <Wand2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">AI Insights not yet loaded</p>
          <p className="text-xs text-gray-400 mb-4">Click "Get AI Suggestions" above to generate personalised feedback using Gemini.</p>
          <AIButton hasAI={false} loading={false} onClick={getAISuggestions} />
        </div>
      )}

      {/* ── 4 ECharts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card><ScoreGauge score={overallScore} title="Resume Score" /></Card>
        <Card>
          <PieChart
            data={skillCoverageData.length ? skillCoverageData : [{ label: 'No skills detected', value: 1 }]}
            title="Skill Coverage by Category"
          />
        </Card>
        <Card><RadarChart data={radarData} title="Section Completeness" /></Card>
        <Card>
          <BarChart
            data={barData.length ? barData : [{ label: 'No data', value: 0 }]}
            title="Skills per Category"
            color="#8B5CF6"
          />
        </Card>
      </div>

      {/* ── Strengths / Areas to Improve / Action Plan ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <CardTitle icon={<CheckCircle className="w-4 h-4" />} label="Strengths" accent="green" />
          <BulletList
            items={aiFeedback?.strengths.length ? aiFeedback.strengths : strengths}
            dot="bg-green-500"
            emptyMsg="No strengths detected yet — try getting AI suggestions."
          />
        </Card>

        <Card>
          <CardTitle icon={<XCircle className="w-4 h-4" />} label="Areas to Improve" accent="red" />
          <BulletList
            items={aiFeedback?.weaknesses ?? []}
            dot="bg-red-500"
            emptyMsg="No weaknesses identified — get AI suggestions for a deeper review."
          />
        </Card>

        <Card>
          <CardTitle icon={<Lightbulb className="w-4 h-4" />} label="Action Plan" accent="yellow" />
          <BulletList
            items={aiFeedback?.improvements.length ? aiFeedback.improvements : improvements}
            dot="bg-yellow-500"
            emptyMsg="No action items yet."
          />
        </Card>
      </div>

      {/* ── AI-specific insights ── */}
      {aiFeedback && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {aiFeedback.atsTips.length > 0 && (
            <Card>
              <CardTitle icon={<ShieldCheck className="w-4 h-4" />} label="ATS Optimisation Tips" accent="blue" />
              <BulletList items={aiFeedback.atsTips} dot="bg-blue-500" />
            </Card>
          )}
          {aiFeedback.projectSuggestions.length > 0 && (
            <Card>
              <CardTitle icon={<Rocket className="w-4 h-4" />} label="Project Suggestions" accent="purple" />
              <BulletList items={aiFeedback.projectSuggestions} dot="bg-purple-500" />
            </Card>
          )}
          {aiFeedback.uniqueInsights.length > 0 && (
            <Card>
              <CardTitle icon={<Sparkles className="w-4 h-4" />} label="Unique Insights" accent="teal" />
              <BulletList items={aiFeedback.uniqueInsights} dot="bg-teal-500" />
            </Card>
          )}
          {aiFeedback.redFlags.length > 0 && (
            <Card>
              <CardTitle icon={<AlertOctagon className="w-4 h-4" />} label="Red Flags" accent="red" />
              <BulletList items={aiFeedback.redFlags} dot="bg-red-500" />
            </Card>
          )}
        </div>
      )}

      {/* ── Skills detected ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle icon={<Star className="w-4 h-4" />} label="All Detected Skills" accent="green" />
          {features.skillsDetected.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {features.skillsDetected.map((s, i) => <Chip key={i} label={s} color="green" />)}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No skills detected in the resume text.</p>
          )}
        </Card>

        <Card>
          <CardTitle icon={<Zap className="w-4 h-4" />} label="Skills by Category" accent="purple" />
          {Object.keys(features.skillsByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(features.skillsByCategory).map(([cat, skills]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    {cat} <span className="normal-case font-normal">({skills.length})</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, i) => <Chip key={i} label={s} color="purple" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No categorised skills found.</p>
          )}
        </Card>
      </div>


    </div>
  );
};

export default Dashboard;
