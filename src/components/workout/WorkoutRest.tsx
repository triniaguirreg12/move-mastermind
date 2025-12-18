import { useEffect, useRef, useState } from "react";
import { SkipForward, X, Pause, Play, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkoutRestProps {
  type: "rest-exercise" | "rest-series" | "rest-block";
  timeRemaining: number;
  nextExerciseName?: string;
  nextBlockName?: string;
  seriesInfo?: string; // e.g., "Serie 2 de 3"
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  isPaused: boolean;
  canGoBack: boolean;
  onSkip: () => void;
  onExit: () => void;
  onPause: () => void;
  onResume: () => void;
  onGoBack: () => void;
  onPlayBuzzer?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getRestLabel(type: WorkoutRestProps["type"]): string {
  switch (type) {
    case "rest-exercise":
      return "Descanso";
    case "rest-series":
      return "Descanso entre series";
    case "rest-block":
      return "Descanso entre bloques";
    default:
      return "Descanso";
  }
}

export function WorkoutRest({
  type,
  timeRemaining,
  nextExerciseName,
  nextBlockName,
  seriesInfo,
  videoUrl,
  thumbnailUrl,
  isPaused,
  canGoBack,
  onSkip,
  onExit,
  onPause,
  onResume,
  onGoBack,
  onPlayBuzzer,
}: WorkoutRestProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastBuzzerRef = useRef<number | null>(null);

  // Play buzzer on 3, 2, 1
  useEffect(() => {
    if (timeRemaining <= 3 && timeRemaining >= 1 && lastBuzzerRef.current !== timeRemaining) {
      lastBuzzerRef.current = timeRemaining;
      onPlayBuzzer?.();
    }
  }, [timeRemaining, onPlayBuzzer]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video Background - next exercise preview */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster={thumbnailUrl || undefined}
          />
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={nextExerciseName || "Next exercise"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-background to-card" />
        )}
        {/* Dark overlay to differentiate from active exercise */}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center">
        {/* Rest label */}
        <div className="mb-6">
          <p className="text-lg font-medium text-primary uppercase tracking-wider">
            {getRestLabel(type)}
          </p>
        </div>

        {/* Timer */}
        <p
          className={cn(
            "text-8xl font-bold tracking-tight transition-colors duration-200",
            timeRemaining <= 3 ? "text-primary" : "text-white"
          )}
        >
          {formatTime(timeRemaining)}
        </p>

        {/* Next exercise info */}
        <div className="mt-8 space-y-2">
          {type === "rest-block" && nextBlockName && (
            <p className="text-sm text-white/50">
              Próximo bloque
            </p>
          )}
          {seriesInfo && type === "rest-series" && (
            <p className="text-sm text-white/50">
              {seriesInfo}
            </p>
          )}
          {nextExerciseName && (
            <>
              <p className="text-sm text-white/50">
                {type === "rest-block" ? "" : "Siguiente"}
              </p>
              <p className="text-xl font-semibold text-white">
                {nextExerciseName}
              </p>
            </>
          )}
        </div>

        {/* Controls - only show when NOT paused */}
        {!isPaused && (
          <div className="mt-8 flex items-center gap-4">
            {/* Back button */}
            <button
              onClick={onGoBack}
              disabled={!canGoBack}
              className={`w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm transition-all ${
                canGoBack 
                  ? "bg-white/10 border border-white/30 text-white hover:bg-white/20" 
                  : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Pause button */}
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={onPause}
            >
              <Pause className="w-5 h-5 mr-2" />
              Pausar
            </Button>

            {/* Skip button */}
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={onSkip}
            >
              <SkipForward className="w-5 h-5 mr-2" />
              Saltar
            </Button>
          </div>
        )}
      </div>

      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Paused overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl font-bold text-white mb-2">Pausado</p>
            
            {/* Back button when paused */}
            {canGoBack && (
              <button
                onClick={onGoBack}
                className="flex flex-col items-center gap-1 text-white hover:text-primary transition-all mb-4"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-full border-2 border-white/60 hover:border-primary">
                  <ChevronLeft className="w-7 h-7" />
                </div>
                <span className="text-xs">Anterior</span>
              </button>
            )}

            <Button
              size="lg"
              onClick={onResume}
              className="rounded-full px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Continuar
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={onSkip}
              className="rounded-full px-8 border-white/60 text-white/60 hover:text-white hover:border-white hover:bg-white/10"
            >
              <SkipForward className="w-5 h-5 mr-2" />
              Saltar descanso
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}