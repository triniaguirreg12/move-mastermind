import { RadarChart } from "@/components/home/RadarChart";
import { useUserAccess } from "@/hooks/useUserAccess";
import { cn } from "@/lib/utils";

interface RadarChartBlockedProps {
  data: { label: string; value: number }[];
  className?: string;
}

// Demo data for preview (registered users)
const DEMO_RADAR_DATA = [
  { label: "Fu", value: 45 },
  { label: "Po", value: 35 },
  { label: "Ag", value: 60 },
  { label: "Co", value: 50 },
  { label: "Es", value: 40 },
  { label: "Ve", value: 55 },
  { label: "Re", value: 30 },
  { label: "Mo", value: 45 },
];

// Minimal data for guests (very low values to show structure)
const GUEST_RADAR_DATA = [
  { label: "Fu", value: 15 },
  { label: "Po", value: 20 },
  { label: "Ag", value: 25 },
  { label: "Co", value: 15 },
  { label: "Es", value: 20 },
  { label: "Ve", value: 25 },
  { label: "Re", value: 15 },
  { label: "Mo", value: 20 },
];

export function RadarChartBlocked({ data, className }: RadarChartBlockedProps) {
  const { isGuest, canAccessFullContent } = useUserAccess();

  // Subscribed users see the real chart
  if (canAccessFullContent) {
    return <RadarChart data={data} className={className} />;
  }

  // Get appropriate demo data based on access level
  const displayData = isGuest ? GUEST_RADAR_DATA : DEMO_RADAR_DATA;

  // For non-subscribed users, just show the faded chart (no overlay here)
  // The unified overlay is handled by the parent section
  return (
    <div className={cn("opacity-80 pointer-events-none", className)}>
      <RadarChart data={displayData} />
    </div>
  );
}
