import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoutine } from "@/hooks/useRoutines";
import { useWorkoutExecution } from "@/hooks/useWorkoutExecution";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutCountdown } from "@/components/workout/WorkoutCountdown";
import { WorkoutExercise } from "@/components/workout/WorkoutExercise";
import { WorkoutRest } from "@/components/workout/WorkoutRest";
import { WorkoutComplete } from "@/components/workout/WorkoutComplete";

// Audio context singleton for sounds
let audioContextInstance: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContextInstance) {
    audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContextInstance;
}

// Buzzer sound - plays on countdown (3, 2, 1)
function createBuzzerSound() {
  return () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Hz - medium tone
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };
}

// Beep sound - plays when exercise starts (higher pitch, distinct)
function createBeepSound() {
  return () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1200; // Hz - higher tone than buzzer
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  };
}

export default function RutinaEjecucion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { data: routine, isLoading, error } = useRoutine(id);
  const { data: userProfile } = useUserProfile();
  
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const buzzerRef = useRef<(() => void) | null>(null);
  const beepRef = useRef<(() => void) | null>(null);

  // Initialize sounds
  useEffect(() => {
    buzzerRef.current = createBuzzerSound();
    beepRef.current = createBeepSound();
  }, []);

  const playBuzzer = useCallback(() => {
    try {
      buzzerRef.current?.();
    } catch (e) {
      console.log("Could not play buzzer sound");
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      beepRef.current?.();
    } catch (e) {
      console.log("Could not play beep sound");
    }
  }, []);

  // Save workout completion to database
  const handleWorkoutComplete = useCallback(async () => {
    if (!user || !routine) return;

    try {
      // Create a completed entrenamiento event
      const today = new Date().toISOString().split("T")[0];
      
      await supabase.from("user_events").insert({
        user_id: user.id,
        type: "entrenamiento",
        event_date: today,
        status: "completed",
        title: routine.nombre,
        metadata: {
          routine_id: routine.id,
          routine_name: routine.nombre,
          routine_category: routine.categoria,
          routine_cover_url: routine.portada_url,
        },
      });

      // Update routine's veces_realizada counter
      await supabase
        .from("routines")
        .update({ veces_realizada: (routine.veces_realizada || 0) + 1 })
        .eq("id", routine.id);

    } catch (error) {
      console.error("Error saving workout completion:", error);
    }
  }, [user, routine]);

  const handleExit = useCallback(() => {
    navigate(`/rutina/${id}`);
  }, [navigate, id]);


  const {
    currentStep,
    timeRemaining,
    isPaused,
    isComplete,
    totalDots,
    dotsByBlock,
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
  } = useWorkoutExecution(
    workoutStarted ? routine : null,
    handleWorkoutComplete,
    handleExit
  );

  // Handle early finish - don't save anything, just redirect to routine preview
  const handleFinishEarly = useCallback(() => {
    exit();
    navigate(`/rutina/${id}`);
  }, [exit, navigate, id]);

  // Auto-start workout when started flag is set
  useEffect(() => {
    if (workoutStarted && currentStep?.type === "countdown") {
      start();
    }
  }, [workoutStarted, currentStep?.type, start]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error or not found state
  if (error || !routine) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Rutina no encontrada
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          La rutina que buscas no existe o ha sido eliminada.
        </p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  // Not started yet - show initial countdown screen
  if (!workoutStarted) {
    const firstExercise = routine.blocks?.[0]?.exercises?.[0]?.exercise;
    
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Video Background */}
        <div className="absolute inset-0">
          {firstExercise?.video_url ? (
            <video
              src={firstExercise.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster={firstExercise.thumbnail_url || undefined}
            />
          ) : firstExercise?.thumbnail_url ? (
            <img
              src={firstExercise.thumbnail_url}
              alt={firstExercise.nombre || "Exercise"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-background to-card" />
          )}
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center">
          <p className="text-sm text-white/70 font-medium mb-2">
            {routine.blocks?.[0]?.nombre || "Bloque 1"}
          </p>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {firstExercise?.nombre || "Primer ejercicio"}
          </h2>

          <p className="text-lg text-white/60 mb-8">
            ¿Listo para comenzar?
          </p>

          <Button
            size="lg"
            className="rounded-full px-12 h-14 text-lg"
            onClick={() => setWorkoutStarted(true)}
          >
            Comenzar
          </Button>
        </div>

        {/* Exit button */}
        <button
          onClick={handleExit}
          className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  // Workout complete
  if (isComplete) {
    return (
      <WorkoutComplete
        routineName={routine.nombre}
        routineId={routine.id}
        routineObjetivo={routine.objetivo as unknown as Record<string, number> | null}
      />
    );
  }

  // Render current step
  if (!currentStep) return null;

  const totalBlocks = routine.blocks?.length || 1;

  switch (currentStep.type) {
    case "countdown":
      return (
        <WorkoutCountdown
          seconds={timeRemaining}
          exerciseName={currentStep.exercise?.nombre}
          blockName={currentStep.blockName}
          videoUrl={currentStep.exercise?.video_url}
          thumbnailUrl={currentStep.exercise?.thumbnail_url}
          onPlayBuzzer={playBuzzer}
        />
      );

    case "exercise":
      return (
        <WorkoutExercise
          exerciseName={currentStep.exercise?.nombre || "Ejercicio"}
          blockName={currentStep.blockName}
          blockIndex={currentStep.blockIndex}
          totalBlocks={totalBlocks}
          timeRemaining={timeRemaining}
          tipoEjecucion={currentStep.tipoEjecucion}
          repeticiones={currentStep.repeticiones}
          videoUrl={currentStep.exercise?.video_url}
          thumbnailUrl={currentStep.exercise?.thumbnail_url}
          tips={currentStep.exercise?.tips}
          comment={currentStep.comment}
          isPaused={isPaused}
          dotsByBlock={dotsByBlock}
          currentDotIndex={currentDotIndex}
          userGender={userProfile?.sex}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onPause={pause}
          onResume={resume}
          onGoBack={goBack}
          onGoForward={goForward}
          onExit={() => {
            exit();
            handleExit();
          }}
          onFinishEarly={handleFinishEarly}
          onPlayBuzzer={playBuzzer}
          onPlayBeep={playBeep}
        />
      );

    case "rest-exercise":
    case "rest-series":
    case "rest-block":
      return (
        <WorkoutRest
          type={currentStep.type}
          timeRemaining={timeRemaining}
          nextExerciseName={currentStep.nextExercise?.nombre}
          nextBlockName={currentStep.type === "rest-block" ? currentStep.blockName : undefined}
          seriesInfo={
            currentStep.type === "rest-series"
              ? `Serie ${currentStep.seriesIndex} de ${currentStep.totalSeries}`
              : undefined
          }
          videoUrl={currentStep.nextExercise?.video_url}
          thumbnailUrl={currentStep.nextExercise?.thumbnail_url}
          isPaused={isPaused}
          canGoBack={canGoBack}
          onSkip={skipRest}
          onPause={pause}
          onResume={resume}
          onGoBack={goBack}
          onFinishEarly={handleFinishEarly}
          onExit={() => {
            exit();
            handleExit();
          }}
          onPlayBuzzer={playBuzzer}
        />
      );

    default:
      return null;
  }
}
