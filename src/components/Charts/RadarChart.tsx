import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../contexts/ThemeContext';

interface RadarChartProps {
  data: { label: string; value: number }[];
  title?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, title }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const lineColor  = dark ? '#374151' : '#E5E7EB';
  const textColor  = dark ? '#9CA3AF' : '#6B7280';
  const titleColor = dark ? '#F9FAFB' : '#111827';
  const bg         = dark ? '#1F2937' : '#ffffff';
  const border     = dark ? '#374151' : '#E5E7EB';

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: bg, borderColor: border,
      textStyle: { color: titleColor, fontSize: 12 },
      extraCssText: 'border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.12)',
      formatter: (params: { value: number[] }) =>
        data.map((d, i) => `${d.label}: <b>${params.value[i]}</b>`).join('<br/>'),
    },
    radar: {
      indicator: data.map(d => ({ name: d.label, max: 100 })),
      splitLine: { lineStyle: { color: lineColor, type: 'dashed' } },
      axisLine: { lineStyle: { color: lineColor } },
      splitArea: {
        show: true,
        areaStyle: {
          color: dark
            ? ['rgba(55,65,81,0.3)', 'rgba(55,65,81,0.1)']
            : ['rgba(243,244,246,0.5)', 'rgba(255,255,255,0.3)'],
        },
      },
      axisName: {
        color: textColor, fontSize: 11, fontWeight: '500',
        padding: [3, 5],
        backgroundColor: dark ? 'rgba(31,41,55,0.7)' : 'rgba(249,250,251,0.85)',
        borderRadius: 4,
      },
      radius: '62%',
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.map(d => d.value),
        name: 'Score',
        symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#3B82F6', width: 2.5 },
        areaStyle: {
          color: {
            type: 'radial', x: 0.5, y: 0.5, r: 0.5,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.35)' },
              { offset: 1, color: 'rgba(59,130,246,0.05)' },
            ],
          },
        },
        itemStyle: { color: '#3B82F6', borderColor: dark ? '#1F2937' : '#fff', borderWidth: 2 },
      }],
    }],
  }), [data, dark, lineColor, textColor, titleColor, bg, border]);

  return (
    <div>
      {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">{title}</h3>}
      <ReactECharts option={option} style={{ height: 270 }} notMerge />
    </div>
  );
};

export default RadarChart;
