import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ScoreGaugeProps {
  score: number;
  title?: string;
}

function scoreColor(s: number) {
  return s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : s >= 40 ? '#F97316' : '#EF4444';
}
function scoreLabel(s: number) {
  return s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, title }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      radius: '88%',
      center: ['50%', '55%'],
      progress: { show: true, width: 22, itemStyle: { color: scoreColor(score) } },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 22, color: [[1, dark ? '#374151' : '#E5E7EB']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '-5%'],
        fontSize: 42,
        fontWeight: 'bold',
        color: dark ? '#F9FAFB' : '#111827',
        formatter: '{value}',
      },
      data: [{
        value: score,
        name: scoreLabel(score),
        title: { offsetCenter: [0, '30%'], fontSize: 13, fontWeight: '600', color: scoreColor(score) },
      }],
    }],
  }), [score, dark]);

  return (
    <div>
      {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">{title}</h3>}
      <ReactECharts option={option} style={{ height: 230 }} notMerge />
    </div>
  );
};

export default ScoreGauge;
