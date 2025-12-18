import { useRef, useState, useEffect } from "react";
import { Pause, Play, Info, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutProgressDots } from "./WorkoutProgressDots";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkoutExerciseProps {
  exerciseName: string;
  blockName: string;
  blockIndex: number;
  totalBlocks: number;
  timeRemaining: number;
  tipoEjecucion?: "tiempo" | "repeticiones";
  repeticiones?: number;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  tips?: string | null;
  isPaused: boolean;
  dotsByBlock: number[];
  currentDotIndex: number;
  userGender?: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onPause: () => void;
  onResume: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onExit: () => void;
  onFinishEarly: () => void;
  onPlayBuzzer?: () => void;
  onPlayBeep?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function WorkoutExercise({
  exerciseName,
  blockName,
  blockIndex,
  totalBlocks,
  timeRemaining,
  tipoEjecucion,
  repeticiones,
  videoUrl,
  thumbnailUrl,
  tips,
  isPaused,
  dotsByBlock,
  currentDotIndex,
  userGender,
  canGoBack,
  canGoForward,
  onPause,
  onResume,
  onGoBack,
  onGoForward,
  onExit,
  onFinishEarly,
  onPlayBuzzer,
  onPlayBeep,
}: WorkoutExerciseProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const lastBuzzerRef = useRef<number | null>(null);
  const hasPlayedBeepRef = useRef(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play beep when exercise starts (first render or reset)
  useEffect(() => {
    if (!hasPlayedBeepRef.current && !isPaused) {
      hasPlayedBeepRef.current = true;
      onPlayBeep?.();
    }
  }, [onPlayBeep, isPaused]);

  // Reset beep flag when exercise changes
  useEffect(() => {
    hasPlayedBeepRef.current = false;
  }, [exerciseName]);

  // Play buzzer on 3, 2, 1 for timed exercises
  useEffect(() => {
    if (tipoEjecucion === "tiempo" && timeRemaining <= 3 && timeRemaining >= 1) {
      if (lastBuzzerRef.current !== timeRemaining) {
        lastBuzzerRef.current = timeRemaining;
        onPlayBuzzer?.();
      }
    }
  }, [timeRemaining, tipoEjecucion, onPlayBuzzer]);

  // Gender-dynamic confirmation title
  const getFinishTitle = () => {
    if (userGender === "Mujer") {
      return "¿Estás segura de finalizar la rutina?";
    } else if (userGender === "Hombre") {
      return "¿Estás seguro de finalizar la rutina?";
    }
    return "¿Quieres finalizar la rutina?";
  };

  // Long press handler for forward button
  const handleForwardStart = () => {
    if (!canGoForward) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      onGoForward();
    }, 800); // 800ms long press
  };

  const handleForwardEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video Background */}
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
            alt={exerciseName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-background to-card" />
        )}
        {/* Subtle gradient overlay at top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section */}
        <div className="pt-12 px-4 space-y-4">
          {/* Block indicator */}
          <p className="text-center text-sm text-white/70 font-medium">
            Bloque {blockIndex + 1} / {totalBlocks} : {blockName}
          </p>

          {/* Progress dots */}
          <WorkoutProgressDots
            dotsByBlock={dotsByBlock}
            currentDotIndex={currentDotIndex}
          />

          {/* Exercise name with info button */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <h2 className="text-2xl font-bold text-white">
              {exerciseName}
            </h2>
            {tips && (
              <button
                onClick={() => setShowTips(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/30 text-white/70 hover:bg-white/10 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Section - only show when NOT paused */}
        {!isPaused && (
          <div className="px-4 pb-12 space-y-6">
            {/* Navigation and Pause controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Back button - always visible if available */}
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
                className="rounded-full px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={onPause}
              >
                <Pause className="w-5 h-5 mr-2" />
                Pausar ejercicio
              </Button>
            </div>

            {/* Timer */}
            <div className="text-center">
              {tipoEjecucion === "repeticiones" ? (
                <div className="space-y-2">
                  <p className="text-7xl font-bold text-white tracking-tight">
                    {repeticiones}
                  </p>
                  <p className="text-lg text-white/60">repeticiones</p>
                </div>
              ) : (
                <p className={`text-8xl font-bold tracking-tight transition-colors ${
                  timeRemaining <= 3 ? "text-primary" : "text-white"
                }`}>
                  {formatTime(timeRemaining)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Exit button - top left */}
      <button
        onClick={onExit}
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Tips Modal */}
      {showTips && tips && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowTips(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Tips de ejecución
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tips}
            </p>
            <Button
              className="w-full mt-4"
              onClick={() => setShowTips(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      )}

      {/* Paused overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl font-bold text-white mb-2">Pausado</p>
            
            {/* Navigation button when paused - only back */}
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
              className="rounded-full w-48"
            >
              <Play className="w-5 h-5 mr-2" />
              Continuar
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFinishDialog(true)}
              className="rounded-full w-48 border-white/60 text-white/60 hover:text-white hover:border-white hover:bg-white/10"
            >
              Finalizar rutina
            </Button>
          </div>
        </div>
      )}

      {/* Finish Early Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getFinishTitle()}</AlertDialogTitle>
            <AlertDialogDescription>
              Si finalizas ahora, la rutina no quedará registrada y no se modificará tu progreso ni el mapa radial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinishDialog(false)}>
              Seguir entrenando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowFinishDialog(false);
                onFinishEarly();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Finalizar rutina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}