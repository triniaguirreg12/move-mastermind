import { cn } from "@/lib/utils";

interface WorkoutProgressDotsProps {
  dotsByBlock: number[];
  currentDotIndex: number;
  className?: string;
}

export function WorkoutProgressDots({ 
  dotsByBlock, 
  currentDotIndex,
  className 
}: WorkoutProgressDotsProps) {
  let globalIndex = 0;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      {dotsByBlock.map((dotsInBlock, blockIndex) => (
        <div key={blockIndex} className="flex items-center">
          {/* Dots for this block */}
          <div className="flex items-center gap-1">
            {Array.from({ length: dotsInBlock }).map((_, dotIndex) => {
              const thisGlobalIndex = globalIndex;
              globalIndex++;
              const isCompleted = thisGlobalIndex < currentDotIndex;
              const isCurrent = thisGlobalIndex === currentDotIndex;

              return (
                <div
                  key={dotIndex}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    isCompleted && "bg-primary",
                    isCurrent && "bg-primary scale-125",
                    !isCompleted && !isCurrent && "border border-muted-foreground/40 bg-transparent"
                  )}
                />
              );
            })}
          </div>

          {/* Block separator */}
          {blockIndex < dotsByBlock.length - 1 && (
            <div className="w-0.5 h-4 bg-muted-foreground/30 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}
