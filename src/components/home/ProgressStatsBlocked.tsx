import { Lock, UserPlus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProgressStatsBlockedProps {
  children: React.ReactNode;
  className?: string;
  onSubscribe?: () => void;
}

export function ProgressStatsBlocked({ children, className, onSubscribe }: ProgressStatsBlockedProps) {
  const { level, isGuest, canAccessFullContent } = useUserAccess();
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

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center mb-2",
          isGuest ? "bg-primary/10" : "bg-warning/10"
        )}>
          {isGuest ? (
            <UserPlus className="w-4 h-4 text-primary" />
          ) : (
            <BarChart3 className="w-4 h-4 text-warning" />
          )}
        </div>
        
        <p className="text-[10px] text-center text-muted-foreground px-2 mb-2 leading-tight max-w-[120px]">
          {isGuest 
            ? "Crea tu cuenta para ver estadísticas" 
            : "Desbloquea con suscripción"
          }
        </p>
        
        <Button
          size="sm"
          variant={isGuest ? "default" : "outline"}
          className="h-6 text-[10px] px-2"
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
          {isGuest ? "Registrarme" : "Ver planes"}
        </Button>
      </div>
    </div>
  );
}
