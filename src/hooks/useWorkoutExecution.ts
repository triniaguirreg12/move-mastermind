import { useState, useCallback, useRef, useEffect } from "react";
import type { Routine, RoutineBlock, BlockExercise, Exercise } from "@/hooks/useRoutines";

// Flatten the routine structure into a sequence of steps
export interface WorkoutStep {
  type: "countdown" | "exercise" | "rest-exercise" | "rest-series" | "rest-block" | "complete";
  blockIndex: number;
  blockName: string;
  seriesIndex: number; // Current series (1-based)
  totalSeries: number;
  exerciseIndex: number;
  totalExercises: number;
  exercise?: {
    id: string;
    nombre: string;
    video_url: string | null;
    thumbnail_url: string | null;
    tips: string | null;
  };
  nextExercise?: {
    id: string;
    nombre: string;
    video_url: string | null;
    thumbnail_url: string | null;
    tips: string | null;
  };
  duration: number; // in seconds
  tipoEjecucion?: "tiempo" | "repeticiones";
  repeticiones?: number;
}

// Build the full workout sequence from routine data
export function buildWorkoutSequence(routine: Routine): WorkoutStep[] {
  const steps: WorkoutStep[] = [];
  const blocks = routine.blocks || [];

  blocks.forEach((block, blockIndex) => {
    const exercises = block.exercises || [];
    const totalSeries = block.repetir_bloque ? block.series : 1;

    for (let seriesIndex = 1; seriesIndex <= totalSeries; seriesIndex++) {
      exercises.forEach((blockExercise, exerciseIndex) => {
        const exercise = blockExercise.exercise;
        const isLastExercise = exerciseIndex === exercises.length - 1;
        const isLastSeries = seriesIndex === totalSeries;
        const isLastBlock = blockIndex === blocks.length - 1;

        // Add countdown before first exercise of first series
        if (seriesIndex === 1 && exerciseIndex === 0 && blockIndex === 0) {
          steps.push({
            type: "countdown",
            blockIndex,
            blockName: block.nombre,
            seriesIndex,
            totalSeries,
            exerciseIndex,
            totalExercises: exercises.length,
            exercise: exercise ? {
              id: exercise.id,
              nombre: exercise.nombre,
              video_url: exercise.video_url,
              thumbnail_url: exercise.thumbnail_url,
              tips: exercise.tips,
            } : undefined,
            duration: 5, // 5 second countdown
          });
        }

        // Add exercise step
        const exerciseDuration = blockExercise.tipo_ejecucion === "tiempo" 
          ? blockExercise.tiempo 
          : blockExercise.repeticiones * 3; // 3 seconds per rep estimate

        steps.push({
          type: "exercise",
          blockIndex,
          blockName: block.nombre,
          seriesIndex,
          totalSeries,
          exerciseIndex,
          totalExercises: exercises.length,
          exercise: exercise ? {
            id: exercise.id,
            nombre: exercise.nombre,
            video_url: exercise.video_url,
            thumbnail_url: exercise.thumbnail_url,
            tips: exercise.tips,
          } : undefined,
          duration: exerciseDuration,
          tipoEjecucion: blockExercise.tipo_ejecucion,
          repeticiones: blockExercise.repeticiones,
        });

        // Add rest after exercise (if not last exercise in block)
        if (!isLastExercise) {
          const nextExercise = exercises[exerciseIndex + 1]?.exercise;
          steps.push({
            type: "rest-exercise",
            blockIndex,
            blockName: block.nombre,
            seriesIndex,
            totalSeries,
            exerciseIndex: exerciseIndex + 1,
            totalExercises: exercises.length,
            nextExercise: nextExercise ? {
              id: nextExercise.id,
              nombre: nextExercise.nombre,
              video_url: nextExercise.video_url,
              thumbnail_url: nextExercise.thumbnail_url,
              tips: nextExercise.tips,
            } : undefined,
            duration: block.descanso_entre_ejercicios,
          });
        }

        // Add rest between series (if last exercise but not last series)
        if (isLastExercise && !isLastSeries) {
          const firstExerciseNextSeries = exercises[0]?.exercise;
          const restDuration = block.usar_mismo_descanso 
            ? block.descanso_entre_ejercicios 
            : block.descanso_entre_series;
          
          steps.push({
            type: "rest-series",
            blockIndex,
            blockName: block.nombre,
            seriesIndex: seriesIndex + 1,
            totalSeries,
            exerciseIndex: 0,
            totalExercises: exercises.length,
            nextExercise: firstExerciseNextSeries ? {
              id: firstExerciseNextSeries.id,
              nombre: firstExerciseNextSeries.nombre,
              video_url: firstExerciseNextSeries.video_url,
              thumbnail_url: firstExerciseNextSeries.thumbnail_url,
              tips: firstExerciseNextSeries.tips,
            } : undefined,
            duration: restDuration,
          });
        }
      });

      // Add rest between blocks (if last series and not last block)
      const isLastBlockForRest = blockIndex === blocks.length - 1;
      if (seriesIndex === totalSeries && !isLastBlockForRest) {
        const nextBlock = blocks[blockIndex + 1];
        const firstExerciseNextBlock = nextBlock?.exercises?.[0]?.exercise;
        
        steps.push({
          type: "rest-block",
          blockIndex: blockIndex + 1,
          blockName: nextBlock?.nombre || "",
          seriesIndex: 1,
          totalSeries: nextBlock?.repetir_bloque ? nextBlock.series : 1,
          exerciseIndex: 0,
          totalExercises: nextBlock?.exercises?.length || 0,
          nextExercise: firstExerciseNextBlock ? {
            id: firstExerciseNextBlock.id,
            nombre: firstExerciseNextBlock.nombre,
            video_url: firstExerciseNextBlock.video_url,
            thumbnail_url: firstExerciseNextBlock.thumbnail_url,
            tips: firstExerciseNextBlock.tips,
          } : undefined,
          duration: routine.descanso_entre_bloques,
        });
      }
    }
  });

  // Add completion step
  steps.push({
    type: "complete",
    blockIndex: blocks.length - 1,
    blockName: "",
    seriesIndex: 1,
    totalSeries: 1,
    exerciseIndex: 0,
    totalExercises: 0,
    duration: 0,
  });

  return steps;
}

// Calculate total progress dots (all exercises across all series)
export function calculateProgressDots(routine: Routine): { total: number; byBlock: number[] } {
  const blocks = routine.blocks || [];
  let total = 0;
  const byBlock: number[] = [];

  blocks.forEach((block) => {
    const exercises = block.exercises || [];
    const totalSeries = block.repetir_bloque ? block.series : 1;
    const blockTotal = exercises.length * totalSeries;
    byBlock.push(blockTotal);
    total += blockTotal;
  });

  return { total, byBlock };
}

// Calculate which dot index we're on
export function getCurrentDotIndex(steps: WorkoutStep[], currentStepIndex: number): number {
  let dotIndex = 0;
  for (let i = 0; i <= currentStepIndex; i++) {
    if (steps[i]?.type === "exercise") {
      dotIndex++;
    }
  }
  return dotIndex - 1; // 0-indexed
}

export interface UseWorkoutExecutionReturn {
  steps: WorkoutStep[];
  currentStepIndex: number;
  currentStep: WorkoutStep | null;
  timeRemaining: number;
  isPaused: boolean;
  isComplete: boolean;
  totalDots: number;
  dotsByBlock: number[];
  currentDotIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skipRest: () => void;
  goBack: () => void;
  goForward: () => void;
  exit: () => void;
}

export function useWorkoutExecution(
  routine: Routine | null,
  onComplete?: () => void,
  onExit?: () => void
): UseWorkoutExecutionReturn {
  const [steps, setSteps] = useState<WorkoutStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ total: 0, byBlock: [] as number[] });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize workout
  useEffect(() => {
    if (routine) {
      const workoutSteps = buildWorkoutSequence(routine);
      const progress = calculateProgressDots(routine);
      setSteps(workoutSteps);
      setProgressInfo(progress);
      setCurrentStepIndex(0);
      setTimeRemaining(workoutSteps[0]?.duration || 0);
      setIsPaused(true);
      setIsComplete(false);
    }
  }, [routine]);

  // Timer logic
  useEffect(() => {
    if (isPaused || isComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next step
          setCurrentStepIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= steps.length) {
              setIsComplete(true);
              onComplete?.();
              return prevIndex;
            }
            const nextStep = steps[nextIndex];
            setTimeRemaining(nextStep?.duration || 0);
            return nextIndex;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isComplete, steps, onComplete]);

  const start = useCallback(() => {
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const skipRest = useCallback(() => {
    const currentStep = steps[currentStepIndex];
    if (currentStep?.type.startsWith("rest")) {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= steps.length) {
          setIsComplete(true);
          return prev;
        }
        setTimeRemaining(steps[nextIndex]?.duration || 0);
        return nextIndex;
      });
    }
  }, [steps, currentStepIndex]);

  // Find previous exercise step index
  const findPreviousExerciseIndex = useCallback((fromIndex: number): number => {
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (steps[i]?.type === "exercise") {
        return i;
      }
    }
    return -1;
  }, [steps]);

  // Find next exercise step index
  const findNextExerciseIndex = useCallback((fromIndex: number): number => {
    for (let i = fromIndex + 1; i < steps.length; i++) {
      if (steps[i]?.type === "exercise") {
        return i;
      }
    }
    return -1;
  }, [steps]);

  // Go back to previous exercise
  const goBack = useCallback(() => {
    const prevExerciseIndex = findPreviousExerciseIndex(currentStepIndex);
    if (prevExerciseIndex >= 0) {
      setCurrentStepIndex(prevExerciseIndex);
      setTimeRemaining(steps[prevExerciseIndex]?.duration || 0);
    }
  }, [currentStepIndex, findPreviousExerciseIndex, steps]);

  // Go forward to next exercise (only when paused)
  const goForward = useCallback(() => {
    if (!isPaused) return; // Only allow when paused
    
    const nextExerciseIndex = findNextExerciseIndex(currentStepIndex);
    if (nextExerciseIndex >= 0) {
      setCurrentStepIndex(nextExerciseIndex);
      setTimeRemaining(steps[nextExerciseIndex]?.duration || 0);
    }
  }, [currentStepIndex, findNextExerciseIndex, steps, isPaused]);

  const exit = useCallback(() => {
    setIsPaused(true);
    onExit?.();
  }, [onExit]);

  const currentStep = steps[currentStepIndex] || null;
  const currentDotIndex = getCurrentDotIndex(steps, currentStepIndex);
  const canGoBack = findPreviousExerciseIndex(currentStepIndex) >= 0;
  const canGoForward = isPaused && findNextExerciseIndex(currentStepIndex) >= 0;

  return {
    steps,
    currentStepIndex,
    currentStep,
    timeRemaining,
    isPaused,
    isComplete,
    totalDots: progressInfo.total,
    dotsByBlock: progressInfo.byBlock,
    currentDotIndex,
    canGoBack,
    canGoForward,
    start,
    pause,
    resume,
    skipRest,
    goBack,
    goForward,
    exit,
  };
}
