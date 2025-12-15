import { cn } from "@/lib/utils";
import { useState } from "react";

interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0-100
    fullLabel?: string;
  }[];
  className?: string;
}

const fullLabels: Record<string, string> = {
  Fu: "Fuerza",
  Po: "Potencia",
  Ag: "Agilidad",
  Co: "Coordinación",
  Es: "Estabilidad",
  Ve: "Velocidad",
  Re: "Resistencia",
  Mo: "Movilidad",
};

export const RadarChart = ({ data, className }: RadarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const size = 200;
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = 65;
  const levels = 3;
  const numPoints = data.length;

  const getAngle = (index: number) => {
    return (Math.PI * 2 * index) / numPoints - Math.PI / 2;
  };

  const getPoint = (index: number, radius: number) => {
    const angle = getAngle(index);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getPentagonPath = (radius: number) => {
    const points = Array.from({ length: numPoints }, (_, i) => getPoint(i, radius));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  const dataPoints = data.map((item, index) => {
    const radius = (item.value / 100) * maxRadius;
    return getPoint(index, radius);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Calculate path length for animation
  const pathLength = 1000;

  const labelPositions = data.map((item, index) => {
    const point = getPoint(index, maxRadius + 18);
    return { ...point, label: item.label };
  });

  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (svgRect) {
      setTooltipPos({
        x: rect.x - svgRect.x + rect.width / 2,
        y: rect.y - svgRect.y,
      });
    }
    setHoveredIndex(index);
  };

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        <defs>
          <style>
            {`
              @keyframes drawPath {
                from {
                  stroke-dashoffset: ${pathLength};
                }
                to {
                  stroke-dashoffset: 0;
                }
              }
              @keyframes fillIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              .radar-path {
                stroke-dasharray: ${pathLength};
                stroke-dashoffset: 0;
                animation: drawPath 1.2s ease-out forwards;
              }
              .radar-fill {
                animation: fillIn 0.8s ease-out 0.4s forwards;
                opacity: 0;
              }
              .radar-point {
                animation: fillIn 0.3s ease-out forwards;
                opacity: 0;
              }
            `}
          </style>
        </defs>

        {/* Grid levels */}
        {Array.from({ length: levels }, (_, i) => {
          const radius = ((i + 1) / levels) * maxRadius;
          return (
            <path
              key={`level-${i}`}
              d={getPentagonPath(radius)}
              fill="none"
              stroke="hsl(192 30% 25%)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {Array.from({ length: numPoints }, (_, i) => {
          const outerPoint = getPoint(i, maxRadius);
          return (
            <line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke="hsl(192 30% 25%)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon - filled area */}
        <path
          d={dataPath}
          fill="hsl(169 100% 45% / 0.25)"
          className="radar-fill"
        />

        {/* Data polygon - stroke */}
        <path
          d={dataPath}
          fill="none"
          stroke="hsl(169 100% 45%)"
          strokeWidth="2"
          className="radar-path"
        />

        {/* Data points with hover areas */}
        {dataPoints.map((point, index) => (
          <g key={`point-group-${index}`}>
            {/* Invisible larger hit area */}
            <circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(index, e)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* Visible point */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 6 : 4}
              fill="hsl(169 100% 45%)"
              className="radar-point transition-all duration-200"
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              pointerEvents="none"
            />
          </g>
        ))}

        {/* Labels */}
        {labelPositions.map((pos, index) => (
          <text
            key={`label-${index}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={cn(
              "text-[10px] font-medium transition-all duration-200",
              hoveredIndex === index ? "fill-primary" : "fill-muted-foreground"
            )}
          >
            {pos.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 px-3 py-2 bg-card border border-border rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
          }}
        >
          <p className="text-xs font-semibold text-foreground">
            {fullLabels[data[hoveredIndex].label] || data[hoveredIndex].label}
          </p>
          <p className="text-xs text-primary font-bold">
            {data[hoveredIndex].value}%
          </p>
        </div>
      )}
    </div>
  );
};
