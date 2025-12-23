import { Lock, UserPlus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart } from "@/components/home/RadarChart";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface RadarChartBlockedProps {
  data: { label: string; value: number }[];
  className?: string;
  onSubscribe?: () => void;
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

export function RadarChartBlocked({ data, className, onSubscribe }: RadarChartBlockedProps) {
  const { level, isGuest, canAccessFullContent } = useUserAccess();
  const navigate = useNavigate();

  // Subscribed users see the real chart
  if (canAccessFullContent) {
    return <RadarChart data={data} className={className} />;
  }

  // Get appropriate demo data based on access level
  const displayData = isGuest ? GUEST_RADAR_DATA : DEMO_RADAR_DATA;

  return (
    <div className={cn("relative", className)}>
      {/* Blurred/faded chart */}
      <div className="opacity-60 pointer-events-none">
        <RadarChart data={displayData} />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-[2px] rounded-lg">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mb-2",
          isGuest ? "bg-primary/10" : "bg-warning/10"
        )}>
          {isGuest ? (
            <UserPlus className="w-5 h-5 text-primary" />
          ) : (
            <Lock className="w-5 h-5 text-warning" />
          )}
        </div>
        
        <p className="text-[10px] text-center text-muted-foreground px-4 mb-2 leading-tight">
          {isGuest 
            ? "Regístrate para ver tu progreso" 
            : "Tu mapa se moverá con tus entrenamientos"
          }
        </p>
        
        <Button
          size="sm"
          variant={isGuest ? "default" : "outline"}
          className="h-6 text-[10px] px-3"
          onClick={() => {
            if (isGuest) {
              navigate("/login", { state: { mode: "signup" } });
            } else if (onSubscribe) {
              onSubscribe();
            } else {
              navigate("/configuracion");
            }
          }}
        >
          {isGuest ? "Registrarme" : "Suscribirme"}
        </Button>
      </div>
    </div>
  );
}
