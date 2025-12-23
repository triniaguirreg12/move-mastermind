import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExerciseLockedOverlayProps {
  onSubscribe: () => void;
}

export function ExerciseLockedOverlay({ onSubscribe }: ExerciseLockedOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
      <Lock className="w-5 h-5 text-muted-foreground mb-2" />
      <p className="text-xs text-muted-foreground mb-2 text-center px-2">
        Disponible con suscripción
      </p>
      <Button 
        size="sm" 
        variant="default" 
        className="h-7 text-xs px-3"
        onClick={(e) => {
          e.stopPropagation();
          onSubscribe();
        }}
      >
        Suscribirme
      </Button>
    </div>
  );
}
