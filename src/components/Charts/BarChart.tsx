import React from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
  color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, color = '#3B82F6' }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  const chartHeight = 200;
  const barWidth = 40;
  const barSpacing = 10;
  const chartWidth = data.length * (barWidth + barSpacing) - barSpacing;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-full flex justify-center">
          <svg width={chartWidth} height={chartHeight + 60} className="drop-shadow-sm">
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * chartHeight;
              const x = index * (barWidth + barSpacing);
              const y = chartHeight - barHeight;
              
              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400"
                  >
                    {item.value}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400"
                    transform={`rotate(-45 ${x + barWidth / 2} ${chartHeight + 20})`}
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BarChart;