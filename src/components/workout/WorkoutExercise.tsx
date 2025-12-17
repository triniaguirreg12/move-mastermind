import { useRef, useState } from "react";
import { Pause, Play, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkoutProgressDots } from "./WorkoutProgressDots";

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
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
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
  onPause,
  onResume,
  onExit,
}: WorkoutExerciseProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showTips, setShowTips] = useState(false);

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

        {/* Bottom Section */}
        <div className="px-4 pb-12 space-y-6">
          {/* Pause/Resume button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={isPaused ? onResume : onPause}
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Continuar
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar ejercicio
                </>
              )}
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
              <p className="text-8xl font-bold text-white tracking-tight">
                {formatTime(timeRemaining)}
              </p>
            )}
          </div>
        </div>
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
        <div className="absolute inset-0 z-15 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-4">Pausado</p>
            <Button
              size="lg"
              onClick={onResume}
              className="rounded-full px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
