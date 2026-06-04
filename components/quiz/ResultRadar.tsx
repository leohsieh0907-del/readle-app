'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface ResultRadarProps {
  data: { skill: string; score: number }[];
}

export default function ResultRadar({ data }: ResultRadarProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(91,91,240,0.15)" />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#5B5B6E' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="#5B5BF0"
            fill="url(#radarGrad)"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C7CFF" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#5B5BF0" stopOpacity={0.2} />
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
