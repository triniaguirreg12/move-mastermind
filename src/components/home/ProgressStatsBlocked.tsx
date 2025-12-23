import { Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProgressStatsBlockedProps {
  children: React.ReactNode;
  className?: string;
}

export function ProgressStatsBlocked({ children, className }: ProgressStatsBlockedProps) {
  const { isGuest, canAccessFullContent } = useUserAccess();
  const navigate = useNavigate();

  // Subscribed users see the real stats
  if (canAccessFullContent) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Blurred content */}
      <div className="opacity-30 pointer-events-none select-none">
        {children}
      </div>

      {/* Single unified overlay - no icon, just text + button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] text-center text-muted-foreground px-2 mb-2 leading-tight max-w-[140px]">
          {isGuest 
            ? "Crea tu cuenta para ver tu progreso" 
            : "Tu mapa se modificará con tus entrenamientos"
          }
        </p>
        
        <Button
          size="sm"
          variant={isGuest ? "default" : "outline"}
          className="h-6 text-[10px] px-3"
          onClick={() => {
            if (isGuest) {
              navigate("/login", { state: { mode: "signup" } });
            } else {
              navigate("/configuracion", { state: { scrollTo: "planes" } });
            }
          }}
        >
          {isGuest ? "Registrarme" : "Ver planes"}
        </Button>
      </div>
    </div>
  );
}
