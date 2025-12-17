import { CheckCircle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WorkoutCompleteProps {
  routineName: string;
  routineId: string;
  onRepeat?: () => void;
}

export function WorkoutComplete({
  routineName,
  routineId,
  onRepeat,
}: WorkoutCompleteProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Success icon */}
      <div className="mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-2">
        ¡Felicitaciones!
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-muted-foreground mb-2">
        Completaste la rutina
      </p>

      {/* Routine name */}
      <p className="text-xl font-semibold text-primary mb-8">
        {routineName}
      </p>

      {/* Stats placeholder - can be expanded later */}
      <div className="w-full max-w-xs bg-card/50 rounded-2xl p-4 border border-border/30 mb-8">
        <p className="text-sm text-muted-foreground">
          ¡Sigue así! Cada entrenamiento te acerca a tus objetivos.
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <Button
          className="w-full h-12"
          onClick={() => navigate("/")}
        >
          <Home className="w-5 h-5 mr-2" />
          Ir al inicio
        </Button>

        <Button
          variant="outline"
          className="w-full h-12"
          onClick={onRepeat}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Repetir rutina
        </Button>
      </div>
    </div>
  );
}
