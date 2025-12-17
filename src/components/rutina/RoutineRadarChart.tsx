import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const APTITUDES_LABELS: Record<string, string> = {
  fuerza: "Fuerza",
  potencia: "Potencia",
  agilidad: "Agilidad",
  coordinacion: "Coordinación",
  estabilidad: "Estabilidad",
  velocidad: "Velocidad",
  resistencia: "Resistencia",
  movilidad: "Movilidad",
};

const APTITUDES_ORDER = [
  "fuerza",
  "potencia",
  "agilidad",
  "coordinacion",
  "velocidad",
  "estabilidad",
  "movilidad",
  "resistencia",
];

interface RoutineRadarChartProps {
  objetivo: Record<string, number> | null;
}

export function RoutineRadarChart({ objetivo }: RoutineRadarChartProps) {
  if (!objetivo) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">Sin datos de aptitudes</p>
      </div>
    );
  }

  const data = APTITUDES_ORDER.map((key) => ({
    aptitud: APTITUDES_LABELS[key],
    value: objetivo[key] || 0,
    fullMark: 10,
  }));

  // Check if all values are 0
  const hasValues = data.some((d) => d.value > 0);

  if (!hasValues) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">Sin aptitudes configuradas</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis
            dataKey="aptitud"
            tick={{ 
              fill: "hsl(var(--muted-foreground))", 
              fontSize: 11,
              fontWeight: 500,
            }}
            tickLine={false}
          />
          <Radar
            name="Aptitud"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">
                      {data.aptitud}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nivel: {data.value}/10
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
