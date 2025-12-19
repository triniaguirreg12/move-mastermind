import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { RutinaObjetivo, APTITUDES_KEYS, APTITUDES_LABELS } from "./types";

interface ObjectiveRadarChartProps {
  objetivo: RutinaObjetivo;
}

const ObjectiveRadarChart = ({ objetivo }: ObjectiveRadarChartProps) => {
  const data = APTITUDES_KEYS.map((key) => ({
    aptitud: APTITUDES_LABELS[key],
    value: objetivo[key],
    fullMark: 10,
  }));

  return (
    <div className="w-full h-full min-h-[80px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis
            dataKey="aptitud"
            tick={{ 
              fill: "hsl(var(--muted-foreground))", 
              fontSize: 8,
            }}
            tickLine={false}
          />
          <Radar
            name="Objetivo"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ObjectiveRadarChart;
