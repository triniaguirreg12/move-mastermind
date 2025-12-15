import { cn } from "@/lib/utils";

interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0-100
  }[];
  className?: string;
}

export const RadarChart = ({ data, className }: RadarChartProps) => {
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 70;
  const levels = 3;

  // Calculate points for each data item
  const angleStep = (2 * Math.PI) / data.length;
  
  const getPoint = (index: number, radius: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Generate polygon points for the data
  const dataPoints = data.map((item, index) => {
    const radius = (item.value / 100) * maxRadius;
    return getPoint(index, radius);
  });

  const dataPath = dataPoints
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ") + " Z";

  // Generate level rings
  const levelPaths = Array.from({ length: levels }, (_, levelIndex) => {
    const radius = ((levelIndex + 1) / levels) * maxRadius;
    const points = data.map((_, i) => getPoint(i, radius));
    return points
      .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ") + " Z";
  });

  // Generate axis lines
  const axisLines = data.map((_, index) => {
    const outerPoint = getPoint(index, maxRadius + 10);
    return { x1: centerX, y1: centerY, x2: outerPoint.x, y2: outerPoint.y };
  });

  // Label positions
  const labelPositions = data.map((item, index) => {
    const point = getPoint(index, maxRadius + 20);
    return { ...point, label: item.label };
  });

  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Level rings */}
        {levelPaths.map((path, index) => (
          <path
            key={`level-${index}`}
            d={path}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, index) => (
          <line
            key={`axis-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.3}
          />
        ))}

        {/* Data polygon - outer stroke */}
        <path
          d={dataPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />

        {/* Data polygon - filled area */}
        <path
          d={dataPath}
          fill="hsl(var(--primary))"
          fillOpacity="0.2"
        />

        {/* Data points */}
        {dataPoints.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="hsl(var(--primary))"
          />
        ))}

        {/* Labels */}
        {labelPositions.map((pos, index) => (
          <text
            key={`label-${index}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px] font-medium"
          >
            {pos.label}
          </text>
        ))}
      </svg>
    </div>
  );
};
