
import React, { useMemo } from 'react';

interface TelemetryGraphProps {
  data: number[];
  color?: string;
}

const TelemetryGraph: React.FC<TelemetryGraphProps> = ({ data, color = '#3b82f6' }) => {
  const points = useMemo(() => {
    const max = Math.max(...data, 100);
    const width = 100;
    const height = 40;
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (val / max) * height;
      return `${x},${y}`;
    }).join(' ');
  }, [data]);

  return (
    <div className="w-full h-10 overflow-hidden">
      <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-500"
        />
        <path
          d={`M 0 40 L ${points} L 100 40 Z`}
          fill={`url(#grad-${color.replace('#', '')})`}
          fillOpacity="0.1"
        />
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default TelemetryGraph;
