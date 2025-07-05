import React from 'react';

interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
  title?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300, title }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const maxValue = 100;

  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  const getAxisPoint = (index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const dataPoints = data.map((item, index) => getPoint(index, item.value));
  const pathData = dataPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <div className="flex justify-center">
        <svg width={size} height={size} className="drop-shadow-sm">
          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
            <polygon
              key={scale}
              points={data.map((_, index) => {
                const point = getPoint(index, scale * maxValue);
                return `${point.x},${point.y}`;
              }).join(' ')}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Axis lines */}
          {data.map((_, index) => {
            const axisPoint = getAxisPoint(index);
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={axisPoint.x}
                y2={axisPoint.y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Data area */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3B82F6"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {dataPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="2"
            />
          ))}
          
          {/* Labels */}
          {data.map((item, index) => {
            const labelPoint = getAxisPoint(index);
            const angle = index * angleStep - Math.PI / 2;
            const isLeft = Math.cos(angle) < 0;
            const isTop = Math.sin(angle) < 0;
            
            return (
              <text
                key={index}
                x={labelPoint.x + (isLeft ? -10 : 10)}
                y={labelPoint.y + (isTop ? -10 : 20)}
                textAnchor={isLeft ? 'end' : 'start'}
                className="text-xs fill-gray-600 dark:fill-gray-400"
                dominantBaseline="middle"
              >
                {item.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default RadarChart;