import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star, Clock, Calendar, Loader2, AlertCircle, Dumbbell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useRoutine, calcularDuracionTotal } from "@/hooks/useRoutines";
import { ScheduleRoutineModal } from "@/components/rutina/ScheduleRoutineModal";
import { RoutineRadarChart } from "@/components/rutina/RoutineRadarChart";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";

// Padel ball SVG component
function PadelBall({ filled, size = "md" }: { filled: boolean; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? 12 : 16;
  return (
    <svg
      width={dimensions}
      height={dimensions}
      viewBox="0 0 16 16"
      className={cn(
        "transition-colors",
        filled ? "text-primary" : "text-muted-foreground/40"
      )}
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill={filled ? "currentColor" : "transparent"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 3.5C6 5.5 6 10.5 4 12.5"
        stroke={filled ? "hsl(var(--primary-foreground))" : "currentColor"}
        strokeWidth="1"
        fill="none"
        opacity={filled ? 0.6 : 0.5}
      />
      <path
        d="M12 3.5C10 5.5 10 10.5 12 12.5"
        stroke={filled ? "hsl(var(--primary-foreground))" : "currentColor"}
        strokeWidth="1"
        fill="none"
        opacity={filled ? 0.6 : 0.5}
      />
    </svg>
  );
}

function DifficultyIndicator({ level }: { level: string }) {
  const filled = level === "Principiante" ? 1 : level === "Intermedio" ? 2 : 3;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <PadelBall key={i} filled={i <= filled} size="md" />
      ))}
    </div>
  );
}

interface ExerciseItemProps {
  exercise: {
    id: string;
    nombre: string;
    thumbnail_url: string | null;
    video_url: string | null;
    tips: string | null;
  };
  exerciseIndex: number;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

function ExerciseItem({ exercise, exerciseIndex, isAuthenticated, onAuthRequired }: ExerciseItemProps) {
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Guest users can only preview first 2 exercises (index 0 and 1)
  const canPreview = isAuthenticated || exerciseIndex < 2;

  const handleClick = () => {
    if (!canPreview) {
      onAuthRequired();
      return;
    }
    setShowPreview(true);
  };

  const handleClose = () => {
    setShowPreview(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer w-full text-left"
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
          <img
            src={exercise.thumbnail_url || "/placeholder.svg"}
            alt={exercise.nombre}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-foreground flex-1">
          {exercise.nombre}
        </span>

        {/* Tap hint */}
        <span className="text-[10px] text-muted-foreground">
          Toca para ver
        </span>
      </button>

      {/* Preview Modal */}
      {showPreview && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in"
          onClick={handleBackdropClick}
        >
          <div 
            className="bg-background/95 backdrop-blur-md rounded-2xl p-4 pt-10 relative animate-scale-in max-w-[260px] w-full border border-border/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>

            <div className="space-y-2">
              {/* Exercise name */}
              <h3 className="text-base font-bold text-foreground text-center">
                {exercise.nombre}
              </h3>

              {/* Video - Vertical format, centered and smaller */}
              <div className="flex justify-center">
                <div className="aspect-[9/16] w-32 rounded-lg overflow-hidden bg-muted">
                  <video
                    ref={videoRef}
                    src={exercise.video_url || ""}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster={exercise.thumbnail_url || "/placeholder.svg"}
                  />
                </div>
              </div>

              {/* Tips as list */}
              {exercise.tips && (
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-[9px] font-semibold text-primary mb-1.5 uppercase tracking-wide">
                    Tips de Ejecución
                  </p>
                  <ul className="text-[11px] text-foreground/90 leading-snug space-y-1 text-left">
                    {exercise.tips.split(/\d+\.\s*/).filter(Boolean).map((tip, index) => (
                      <li key={index} className="flex gap-1.5">
                        <span className="text-primary font-medium shrink-0">{index + 1}.</span>
                        <span>{tip.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Calculate unique implements from routine blocks
function calcularImplementosRutina(blocks: Array<{ exercises?: Array<{ exercise?: { implementos?: string[] | null } }> }>): string[] {
  const allImplements = new Set<string>();
  
  blocks.forEach(block => {
    block.exercises?.forEach(be => {
      const exercise = be.exercise as { implementos?: string[] | null } | undefined;
      if (exercise?.implementos && Array.isArray(exercise.implementos)) {
        exercise.implementos.forEach(imp => allImplements.add(imp));
      }
    });
  });
  
  // Filter out "Sin implemento" if there are real implements
  let implements_arr = Array.from(allImplements).sort();
  if (implements_arr.length > 1 && implements_arr.includes("Sin implemento")) {
    implements_arr = implements_arr.filter(i => i !== "Sin implemento");
  }
  
  // If no implements, show "Sin implemento"
  if (implements_arr.length === 0) {
    implements_arr = ["Sin implemento"];
  }
  
  return implements_arr;
}

export default function RutinaDetalle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("rutina");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [isProgram, setIsProgram] = useState<boolean | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  // Get the "from" path from location state, if available
  const fromPath = (location.state as { from?: string })?.from;
  
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  const { data: routine, isLoading, error } = useRoutine(id);
  const { data: activeProgram } = useActiveProgram();

  // Check if this routine is part of the user's active program
  const isPartOfActiveProgram = activeProgram?.weeks?.some(week => 
    week.routines?.some(wr => wr.routine_id === id)
  ) || false;

  // Get program info if routine is part of active program
  const programInfo = isPartOfActiveProgram ? {
    name: activeProgram?.nombre,
    weekNumber: activeProgram?.weeks?.find(week => 
      week.routines?.some(wr => wr.routine_id === id)
    )?.week_number,
  } : null;

  // Check if this is a program and redirect if so
  useEffect(() => {
    if (routine && routine.tipo === "programa") {
      setIsProgram(true);
    } else if (routine) {
      setIsProgram(false);
    }
  }, [routine]);

  // Redirect to program page if this is a program
  if (isProgram === true && id) {
    return <Navigate to={`/programa/${id}`} replace />;
  }

  // Loading state
  if (isLoading || isProgram === null && !error) {
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
        <Button onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  // Calculate meta info
  const totalBlocks = routine.blocks?.length || 0;
  const totalExercises = routine.blocks?.reduce(
    (acc, block) => acc + (block.exercises?.length || 0),
    0
  ) || 0;

  // Calculate duration using unified logic (same as Admin/Library)
  const routineBlocksForCalc = (routine.blocks || []).map(b => ({
    id: b.id,
    series: b.series,
    repetir_bloque: b.repetir_bloque,
    descanso_entre_ejercicios: b.descanso_entre_ejercicios,
    descanso_entre_series: b.descanso_entre_series,
    usar_mismo_descanso: b.usar_mismo_descanso,
  }));
  
  const exercisesForCalc = (routine.blocks || []).flatMap(block => 
    (block.exercises || []).map(be => ({
      block_id: block.id,
      tiempo: be.tiempo,
      repeticiones: be.repeticiones,
      tipo_ejecucion: be.tipo_ejecucion,
    }))
  );
  
  const totalSeconds = calcularDuracionTotal(
    routineBlocksForCalc,
    exercisesForCalc,
    routine.descanso_entre_bloques || 60
  );
  const durationMins = Math.round(totalSeconds / 60);

  // Calculate ALL implements (no +N summary in detail view)
  const allImplements = calcularImplementosRutina(routine.blocks || []);

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // If we have a stored "from" path, use it
    if (fromPath) {
      navigate(fromPath);
      return;
    }
    // Use navigate(-1) - React Router's way to go back
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Fixed Back Button - highest z-index below modals */}
      <div className="fixed top-4 left-4 z-[45]">
        <button
          type="button"
          onClick={handleGoBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Fixed Rating */}
      {routine.calificacion && routine.calificacion > 0 && (
        <div className="fixed top-4 right-4 z-[45]">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-sm font-semibold text-white">{routine.calificacion.toFixed(1)}</span>
            <Star className="w-4 h-4 text-warning fill-warning" />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={routine.portada_url || "/placeholder.svg"}
            alt={routine.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-background" />
        </div>

        {/* Bottom Overlay - Title, Difficulty, Meta */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Difficulty */}
          <DifficultyIndicator level={routine.dificultad} />

          {/* Title */}
          <h1 className="text-2xl font-bold text-white leading-tight">
            {routine.nombre}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{durationMins} min</span>
            <span className="text-white/40">·</span>
            <span className="text-sm">{totalBlocks} {totalBlocks === 1 ? 'bloque' : 'bloques'} · {totalExercises} ejercicios</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pt-4 space-y-4">
        {/* Category Badge + Program Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/30">
            {routine.categoria}
          </span>
          
          {/* Program indicator badge */}
          {isPartOfActiveProgram && programInfo && (
            <button
              onClick={() => navigate(`/programa/${activeProgram?.id}`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Semana {programInfo.weekNumber} · {programInfo.name}</span>
            </button>
          )}
        </div>

        {/* Description */}
        {routine.descripcion && (
          <p className="text-sm text-foreground/80 leading-relaxed">
            {routine.descripcion}
          </p>
        )}

        {/* Implements - Show ALL (no +N summary) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Dumbbell className="w-4 h-4 text-muted-foreground shrink-0" />
          {allImplements.map((impl) => (
            <span
              key={impl}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30"
            >
              {impl}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger 
              value="rutina"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Rutina
            </TabsTrigger>
            <TabsTrigger 
              value="aptitudes"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Aptitudes
            </TabsTrigger>
          </TabsList>

          {/* Rutina Tab Content */}
          <TabsContent value="rutina" className="mt-4 space-y-4">
            {/* Exercise List by Blocks */}
            {routine.blocks && routine.blocks.length > 0 && (
              <div className="space-y-4">
                {routine.blocks.map((block, blockIndex) => (
                  <div key={block.id} className="space-y-2">
                    {/* Block separator */}
                    {blockIndex > 0 && (
                      <div className="py-2">
                        <div className="h-px bg-border/50" />
                      </div>
                    )}
                    
                    {/* Block name */}
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                      {block.nombre}
                      {block.repetir_bloque && block.series > 1 && (
                        <span className="ml-2 text-primary">({block.series} series)</span>
                      )}
                    </p>

                    {/* Exercises in block */}
                    <div className="space-y-2">
                      {block.exercises?.map((blockExercise, exerciseIndexInBlock) => {
                        const exercise = (blockExercise as { exercise?: { id: string; nombre: string; thumbnail_url: string | null; video_url: string | null; tips: string | null } }).exercise;
                        if (!exercise) return null;
                        
                        // Calculate global exercise index across all blocks
                        const globalExerciseIndex = routine.blocks?.slice(0, blockIndex).reduce(
                          (acc, b) => acc + (b.exercises?.length || 0), 0
                        ) + exerciseIndexInBlock;
                        
                        return (
                          <ExerciseItem 
                            key={blockExercise.id} 
                            exercise={exercise}
                            exerciseIndex={globalExerciseIndex}
                            isAuthenticated={isAuthenticated}
                            onAuthRequired={() => setShowAuthPrompt(true)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty exercises state */}
            {(!routine.blocks || routine.blocks.length === 0) && (
              <div className="p-6 rounded-xl bg-card/50 border border-border/30 text-center">
                <p className="text-muted-foreground">
                  Esta rutina aún no tiene ejercicios asignados.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Aptitudes Tab Content */}
          <TabsContent value="aptitudes" className="mt-4">
            <div className="bg-card/30 rounded-2xl border border-border/30 p-4">
              <RoutineRadarChart objetivo={routine.objetivo as unknown as Record<string, number> | null} />
            </div>

            {/* Aptitudes legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { key: "fuerza", label: "Fuerza" },
                { key: "potencia", label: "Potencia" },
                { key: "agilidad", label: "Agilidad" },
                { key: "coordinacion", label: "Coordinación" },
                { key: "velocidad", label: "Velocidad" },
                { key: "estabilidad", label: "Estabilidad" },
                { key: "movilidad", label: "Movilidad" },
                { key: "resistencia", label: "Resistencia" },
              ].map(({ key, label }) => {
                const objetivo = routine.objetivo as unknown as Record<string, number> | null;
                const value = objetivo?.[key] || 0;
                return (
                  <div 
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground">{value}/10</span>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 text-sm font-medium"
            onClick={() => setScheduleModalOpen(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Programar
          </Button>
          <Button
            type="button"
            className="flex-[2] h-12 text-sm font-semibold"
            onClick={() => navigate(`/rutina/${routine.id}/ejecucion`, { state: { from: location.pathname } })}
          >
            Comenzar rutina
          </Button>
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleRoutineModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        routineId={routine.id}
        routineName={routine.nombre}
        routineCategory={routine.categoria}
        routineCoverUrl={routine.portada_url || undefined}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Desbloquea todos los ejercicios"
        description="Regístrate para ver los detalles de todos los ejercicios, incluyendo videos y tips de ejecución."
      />
    </div>
  );
}
