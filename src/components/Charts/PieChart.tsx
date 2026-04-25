import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../contexts/ThemeContext';

interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
}

const PALETTE = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#F97316','#84CC16'];

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const textColor  = dark ? '#9CA3AF' : '#6B7280';
  const bg         = dark ? '#1F2937' : '#ffffff';
  const border     = dark ? '#374151' : '#E5E7EB';
  const titleColor = dark ? '#F9FAFB' : '#111827';
  const filtered   = data.filter(d => d.value > 0);

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <b>{c}</b> ({d}%)',
      backgroundColor: bg, borderColor: border,
      textStyle: { color: titleColor, fontSize: 12 },
      extraCssText: 'border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.12)',
    },
    legend: {
      orient: 'vertical', right: '2%', top: 'middle',
      icon: 'circle', itemWidth: 8, itemHeight: 8,
      textStyle: { color: textColor, fontSize: 11, lineHeight: 20 },
    },
    series: [{
      type: 'pie',
      radius: ['42%', '70%'],
      center: ['36%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 5, borderColor: dark ? '#1F2937' : '#ffffff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: 'bold', color: titleColor },
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
      },
      data: filtered.map((item, i) => ({
        value: item.value,
        name: item.label,
        itemStyle: { color: item.color ?? PALETTE[i % PALETTE.length] },
      })),
    }],
  }), [filtered, dark, bg, border, textColor, titleColor]);

  return (
    <div>
      {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">{title}</h3>}
      <ReactECharts option={option} style={{ height: 230 }} notMerge />
    </div>
  );
};

export default PieChart;
