import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../contexts/ThemeContext';

interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
  color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, color = '#3B82F6' }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const textColor  = dark ? '#9CA3AF' : '#6B7280';
  const titleColor = dark ? '#F9FAFB' : '#111827';
  const gridColor  = dark ? '#374151' : '#F3F4F6';
  const bg         = dark ? '#1F2937' : '#ffffff';
  const border     = dark ? '#374151' : '#E5E7EB';

  const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 12, right: 52, bottom: 8, top: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: bg, borderColor: border,
      textStyle: { color: titleColor, fontSize: 12 },
      extraCssText: 'border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.12)',
    },
    xAxis: {
      type: 'value',
      max: Math.max(...sorted.map(d => d.value), 1),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 10 },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map(d => d.label),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: {
        color: textColor, fontSize: 11, fontWeight: '500',
        formatter: (v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v,
      },
    },
    series: [{
      type: 'bar',
      data: sorted.map(d => d.value),
      barMaxWidth: 26,
      itemStyle: {
        borderRadius: [0, 5, 5, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{ offset: 0, color: color + '55' }, { offset: 1, color }],
        },
      },
      label: { show: true, position: 'right', fontSize: 11, fontWeight: 'bold', color: textColor, formatter: '{c}' },
    }],
  }), [sorted, color, dark, textColor, titleColor, gridColor, bg, border]);

  return (
    <div>
      {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">{title}</h3>}
      <ReactECharts option={option} style={{ height: 270 }} notMerge />
    </div>
  );
};

export default BarChart;
