import { cn } from "@/lib/utils";

interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0-100
  }[];
  className?: string;
}

export const RadarChart = ({ data, className }: RadarChartProps) => {
  const size = 200;
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = 70;
  const levels = 3;
  const numPoints = data.length;

  // Calculate angle for each axis (starting from top, going clockwise)
  const getAngle = (index: number) => {
    return (Math.PI * 2 * index) / numPoints - Math.PI / 2;
  };

  // Get x,y coordinates for a point at given angle and radius
  const getPoint = (index: number, radius: number) => {
    const angle = getAngle(index);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Generate pentagon path for a given radius
  const getPentagonPath = (radius: number) => {
    const points = Array.from({ length: numPoints }, (_, i) => getPoint(i, radius));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  // Generate the data polygon path
  const dataPoints = data.map((item, index) => {
    const radius = (item.value / 100) * maxRadius;
    return getPoint(index, radius);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Label positions (slightly outside the chart)
  const labelPositions = data.map((item, index) => {
    const point = getPoint(index, maxRadius + 18);
    return { ...point, label: item.label };
  });

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Grid levels - concentric pentagons */}
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

        {/* Axis lines from center to each vertex */}
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
          stroke="hsl(169 100% 45%)"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="hsl(169 100% 45%)"
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
            className="fill-muted-foreground text-[11px] font-medium"
          >
            {pos.label}
          </text>
        ))}
      </svg>
    </div>
  );
};
