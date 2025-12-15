import { cn } from "@/lib/utils";
import { useState } from "react";

interface RadarChartProps {
  data: {
    label: string;
    value: number;
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
  const maxRadius = 70;
  const levels = 4;
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

  const getPolygonPath = (radius: number) => {
    const points = Array.from({ length: numPoints }, (_, i) => getPoint(i, radius));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  const dataPoints = data.map((item, index) => {
    const radius = (item.value / 100) * maxRadius;
    return getPoint(index, radius);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  const pathLength = 1000;

  const labelPositions = data.map((item, index) => {
    const point = getPoint(index, maxRadius + 16);
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
          {/* Gradient for the data area */}
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(169 100% 45%)" stopOpacity="0.15" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Point glow */}
          <filter id="pointGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <style>
            {`
              @keyframes drawPath {
                from { stroke-dashoffset: ${pathLength}; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes fillIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes pulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.7; }
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
              .center-pulse {
                animation: pulse 3s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* Background glow */}
        <circle
          cx={centerX}
          cy={centerY}
          r={maxRadius * 0.6}
          fill="hsl(var(--primary))"
          opacity="0.08"
          className="center-pulse"
        />

        {/* Grid levels */}
        {Array.from({ length: levels }, (_, i) => {
          const radius = ((i + 1) / levels) * maxRadius;
          const opacity = 0.15 + (i * 0.1);
          return (
            <path
              key={`level-${i}`}
              d={getPolygonPath(radius)}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              opacity={opacity}
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
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              opacity="0.2"
            />
          );
        })}

        {/* Data polygon - filled area */}
        <path
          d={dataPath}
          fill="url(#radarGradient)"
          className="radar-fill"
        />

        {/* Data polygon - stroke with glow */}
        <path
          d={dataPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          filter="url(#glow)"
          className="radar-path"
        />

        {/* Data points with hover areas */}
        {dataPoints.map((point, index) => (
          <g key={`point-group-${index}`}>
            {/* Invisible larger hit area */}
            <circle
              cx={point.x}
              cy={point.y}
              r="14"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(index, e)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* Outer glow ring on hover */}
            {hoveredIndex === index && (
              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="hsl(var(--primary))"
                opacity="0.2"
              />
            )}
            {/* Visible point */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 5 : 3.5}
              fill="hsl(var(--primary))"
              filter={hoveredIndex === index ? "url(#pointGlow)" : undefined}
              className="radar-point transition-all duration-200"
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              pointerEvents="none"
            />
            {/* Inner white dot */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 2 : 1.5}
              fill="hsl(var(--background))"
              className="radar-point"
              style={{ animationDelay: `${0.85 + index * 0.1}s` }}
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
              "text-[9px] font-bold uppercase tracking-wider transition-all duration-200",
              hoveredIndex === index 
                ? "fill-primary" 
                : "fill-muted-foreground/70"
            )}
          >
            {pos.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 px-3 py-2 bg-card/95 backdrop-blur-sm border border-primary/20 rounded-xl shadow-lg shadow-primary/10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 10,
          }}
        >
          <p className="text-xs font-semibold text-foreground">
            {fullLabels[data[hoveredIndex].label] || data[hoveredIndex].label}
          </p>
          <p className="text-sm text-primary font-bold">
            {data[hoveredIndex].value}%
          </p>
        </div>
      )}
    </div>
  );
};
