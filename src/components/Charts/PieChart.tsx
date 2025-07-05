import React from 'react';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, size = 200, title }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  let cumulativePercentage = 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-8">
        <svg width={size} height={size} className="drop-shadow-sm">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = cumulativePercentage * 3.6;
            const endAngle = (cumulativePercentage + percentage) * 3.6;
            
            cumulativePercentage += percentage;
            
            return (
              <path
                key={index}
                d={createArcPath(startAngle, endAngle)}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            );
          })}
        </svg>
        
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PieChart;