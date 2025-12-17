import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface WorkoutCountdownProps {
  seconds: number;
  exerciseName?: string;
  blockName?: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  onPlayBuzzer?: () => void;
}

export function WorkoutCountdown({
  seconds,
  exerciseName,
  blockName,
  videoUrl,
  thumbnailUrl,
  onPlayBuzzer,
}: WorkoutCountdownProps) {
  const lastBuzzerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play buzzer on 3, 2, 1
  useEffect(() => {
    if (seconds <= 3 && seconds >= 1 && lastBuzzerRef.current !== seconds) {
      lastBuzzerRef.current = seconds;
      onPlayBuzzer?.();
    }
  }, [seconds, onPlayBuzzer]);

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
            alt={exerciseName || "Exercise"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-background to-card" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center">
        {/* Block indicator */}
        {blockName && (
          <p className="text-sm text-white/70 font-medium mb-2">
            {blockName}
          </p>
        )}

        {/* Exercise name */}
        {exerciseName && (
          <h2 className="text-2xl font-bold text-white mb-8">
            {exerciseName}
          </h2>
        )}

        {/* Countdown number */}
        <div
          className={cn(
            "text-[180px] font-bold leading-none transition-all duration-200",
            seconds <= 3 ? "text-primary scale-110" : "text-white"
          )}
        >
          {seconds}
        </div>

        {/* Label */}
        <p className="text-lg text-white/60 mt-4">
          Prepárate
        </p>
      </div>
    </div>
  );
}
