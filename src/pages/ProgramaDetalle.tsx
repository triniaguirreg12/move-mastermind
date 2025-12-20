import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Calendar, Loader2, AlertCircle, Dumbbell, ChevronRight, Users, PlayCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { cn } from "@/lib/utils";
import { useProgram } from "@/hooks/usePrograms";
import { useUserProgramEnrollment, useEnrollInProgram, useScheduleProgramRoutines } from "@/hooks/useUserPrograms";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { RoutineRadarChart } from "@/components/rutina/RoutineRadarChart";
import { ScheduleProgramModal } from "@/components/programa/ScheduleProgramModal";
import { useAuth } from "@/hooks/useAuth";
import { useScheduledRoutines } from "@/hooks/useScheduledRoutines";
import { toast } from "sonner";

// Padel ball SVG component for difficulty
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

export default function ProgramaDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("programa");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [showSwitchProgramDialog, setShowSwitchProgramDialog] = useState(false);
  const { user } = useAuth();
  
  const { data: program, isLoading, error } = useProgram(id);
  const { data: enrollment } = useUserProgramEnrollment(id);
  const { data: activeProgram } = useActiveProgram();
  const { data: scheduledRoutines = [] } = useScheduledRoutines();
  const enrollMutation = useEnrollInProgram();
  const scheduleMutation = useScheduleProgramRoutines();

  // Get completed routine IDs from scheduled_routines
  const completedRoutineIds = new Set(
    scheduledRoutines
      .filter(sr => sr.status === "completada")
      .map(sr => sr.routine_id)
  );

  const handleGoBack = () => {
    // Always navigate to home for consistent behavior
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error or not found state
  if (error || !program) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Programa no encontrado
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          El programa que buscas no existe o ha sido eliminado.
        </p>
        <Button onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  // Calculate total routines and weeks
  const totalWeeks = program.weeks?.length || 0;
  const totalRoutines = program.weeks?.reduce(
    (acc, week) => acc + (week.routines?.length || 0),
    0
  ) || 0;

  // Calculate unique implements from all routines
  const allImplements = new Set<string>();
  program.weeks?.forEach(week => {
    week.routines?.forEach(wr => {
      const routine = wr.routine;
      if (routine?.blocks) {
        routine.blocks.forEach((block: any) => {
          block.exercises?.forEach((be: any) => {
            const exercise = be.exercise;
            if (exercise?.implementos && Array.isArray(exercise.implementos)) {
              exercise.implementos.forEach((imp: string) => allImplements.add(imp));
            }
          });
        });
      }
    });
  });
  
  let implementsArray = Array.from(allImplements).sort();
  if (implementsArray.length > 1 && implementsArray.includes("Sin implemento")) {
    implementsArray = implementsArray.filter(i => i !== "Sin implemento");
  }
  if (implementsArray.length === 0) {
    implementsArray = ["Sin implemento"];
  }

  // Find the next routine that should be done in the active program
  const getNextRoutineId = (): string | null => {
    if (!enrollment || enrollment.status !== "active") return null;
    
    const currentWeek = program.weeks?.find(w => w.week_number === enrollment.current_week);
    if (!currentWeek?.routines) return null;
    
    const sortedRoutines = [...currentWeek.routines].sort((a, b) => a.orden - b.orden);
    return sortedRoutines.find(r => !completedRoutineIds.has(r.routine_id))?.routine_id || null;
  };

  const nextRoutineId = getNextRoutineId();

  const handleRoutineClick = (routineId: string, routineOrden: number, weekNumber: number) => {
    // Determine if this routine is locked
    let isLocked = false;
    
    // If user is not enrolled or program is not active, all routines except the first one in week 1 are locked
    if (!enrollment || enrollment.status !== "active") {
      // Only the first routine of week 1 is unlocked
      const firstWeek = program.weeks?.find(w => w.week_number === 1);
      const sortedRoutinesWeek1 = [...(firstWeek?.routines || [])].sort((a, b) => a.orden - b.orden);
      const firstRoutineId = sortedRoutinesWeek1[0]?.routine_id;
      
      isLocked = routineId !== firstRoutineId;
    } else {
      // User is enrolled and active
      // If clicking on a routine in a future week, it's locked
      if (weekNumber > enrollment.current_week) {
        isLocked = true;
      } else if (weekNumber === enrollment.current_week && nextRoutineId) {
        // If in the current week, check if the routine comes after the next one
        const currentWeek = program.weeks?.find(w => w.week_number === enrollment.current_week);
        const sortedRoutines = [...(currentWeek?.routines || [])].sort((a, b) => a.orden - b.orden);
        const nextRoutineOrden = sortedRoutines.find(r => r.routine_id === nextRoutineId)?.orden;
        
        if (nextRoutineOrden !== undefined && routineOrden > nextRoutineOrden) {
          isLocked = true;
        }
      }
    }
    
    navigate(`/rutina/${routineId}`, { 
      state: { 
        from: `/programa/${id}`,
        isLockedInProgram: isLocked,
        programName: program.nombre
      } 
    });
  };

  // Function to start/enroll in the program
  const handleStartProgram = async () => {
    if (!program) return;
    
    try {
      await enrollMutation.mutateAsync({
        programId: program.id,
        startWeek: 1,
      });
      
      toast.success("¡Programa activado! Puedes ejecutar las rutinas libremente.");
      
      const firstWeek = program.weeks?.sort((a, b) => a.week_number - b.week_number)[0];
      const firstRoutine = firstWeek?.routines?.sort((a, b) => a.orden - b.orden)[0];
      if (firstRoutine) {
        navigate(`/rutina/${firstRoutine.routine_id}`, { state: { from: `/programa/${id}` } });
      }
    } catch (error) {
      toast.error("Error al activar el programa");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Fixed Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          type="button"
          onClick={handleGoBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Fixed Rating */}
      {program.calificacion && program.calificacion > 0 && (
        <div className="absolute top-4 right-4 z-50">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-sm font-semibold text-white">{program.calificacion.toFixed(1)}</span>
            <Star className="w-4 h-4 text-warning fill-warning" />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={program.portada_url || "/placeholder.svg"}
            alt={program.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-background" />
        </div>

        {/* Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Difficulty */}
          <DifficultyIndicator level={program.dificultad} />

          {/* Title */}
          <h1 className="text-2xl font-bold text-white leading-tight">
            {program.nombre}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-white/80">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{totalWeeks} semanas</span>
            <span className="text-white/40">·</span>
            <span className="text-sm">{totalRoutines} rutinas</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pt-4 space-y-4">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/30">
            {program.categoria}
          </span>
          {program.assigned_user_id && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
              <Users className="w-3 h-3" />
              Programa Asignado
            </span>
          )}
        </div>

        {/* Description */}
        {program.descripcion && (
          <p className="text-sm text-foreground/80 leading-relaxed">
            {program.descripcion}
          </p>
        )}

        {/* Implements */}
        <div className="flex items-center gap-2 flex-wrap">
          <Dumbbell className="w-4 h-4 text-muted-foreground shrink-0" />
          {implementsArray.slice(0, 4).map((impl) => (
            <span
              key={impl}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30"
            >
              {impl}
            </span>
          ))}
          {implementsArray.length > 4 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30">
              +{implementsArray.length - 4}
            </span>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger 
              value="programa"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Programa
            </TabsTrigger>
            <TabsTrigger 
              value="aptitudes"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Aptitudes
            </TabsTrigger>
          </TabsList>

          {/* Programa Tab Content - Weeks and Routines */}
          <TabsContent value="programa" className="mt-4 space-y-4">
            {program.weeks && program.weeks.length > 0 ? (
              <Accordion type="single" collapsible defaultValue="week-1" className="space-y-2">
                {program.weeks
                  .sort((a, b) => a.week_number - b.week_number)
                  .map((week) => (
                    <AccordionItem 
                      key={week.id} 
                      value={`week-${week.week_number}`}
                      className="border border-border/30 rounded-xl overflow-hidden bg-card/30"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {week.week_number}
                            </span>
                          </div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-foreground">
                              Semana {week.week_number}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {week.routines?.length || 0} rutinas
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">
                          {week.routines && week.routines.length > 0 ? (
                            week.routines
                              .sort((a, b) => a.orden - b.orden)
                              .map((weekRoutine, index) => {
                                const isCompleted = completedRoutineIds.has(weekRoutine.routine_id);
                                // Find the first non-completed routine in the current week as "next"
                                const sortedRoutines = week.routines!.sort((a, b) => a.orden - b.orden);
                                const nextRoutineId = enrollment?.status === "active" && week.week_number === enrollment.current_week
                                  ? sortedRoutines.find(r => !completedRoutineIds.has(r.routine_id))?.routine_id
                                  : null;
                                const isNext = nextRoutineId === weekRoutine.routine_id;
                                
                                return (
                                  <button
                                    key={weekRoutine.id}
                                    onClick={() => handleRoutineClick(weekRoutine.routine_id, weekRoutine.orden, week.week_number)}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                      isCompleted 
                                        ? "bg-primary/5 border-primary/20" 
                                        : isNext
                                          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                          : "bg-secondary/50 hover:bg-secondary border-transparent hover:border-border"
                                    )}
                                  >
                                    {/* Status indicator */}
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                      isCompleted 
                                        ? "bg-primary text-primary-foreground" 
                                        : isNext 
                                          ? "bg-primary/20 border-2 border-primary"
                                          : "bg-muted"
                                    )}>
                                      {isCompleted ? (
                                        <Check className="w-3.5 h-3.5" />
                                      ) : (
                                        <span className={cn(
                                          "text-xs font-medium",
                                          isNext ? "text-primary" : "text-muted-foreground"
                                        )}>
                                          {index + 1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Routine thumbnail */}
                                    {weekRoutine.routine?.portada_url && (
                                      <div className={cn(
                                        "w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0",
                                        isCompleted && "opacity-60"
                                      )}>
                                        <img
                                          src={weekRoutine.routine.portada_url}
                                          alt={weekRoutine.routine.nombre}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}

                                    {/* Routine info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className={cn(
                                          "text-sm font-medium truncate",
                                          isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                                        )}>
                                          {weekRoutine.routine?.nombre || "Rutina"}
                                        </p>
                                        {isNext && (
                                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded">
                                            Siguiente
                                          </span>
                                        )}
                                      </div>
                                      {weekRoutine.routine?.categoria && (
                                        <p className="text-xs text-muted-foreground">
                                          {weekRoutine.routine.categoria}
                                        </p>
                                      )}
                                    </div>

                                    <ChevronRight className={cn(
                                      "h-4 w-4 flex-shrink-0",
                                      isCompleted ? "text-muted-foreground/50" : "text-muted-foreground"
                                    )} />
                                  </button>
                                );
                              })
                          ) : (
                            <div className="p-4 rounded-xl bg-muted/30 text-center">
                              <p className="text-sm text-muted-foreground">
                                No hay rutinas asignadas a esta semana
                              </p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            ) : (
              <div className="p-6 rounded-xl bg-card/50 border border-border/30 text-center">
                <p className="text-muted-foreground">
                  Este programa aún no tiene semanas configuradas.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Aptitudes Tab Content */}
          <TabsContent value="aptitudes" className="mt-4">
            <div className="bg-card/30 rounded-2xl border border-border/30 p-4">
              <RoutineRadarChart objetivo={program.objetivo as unknown as Record<string, number> | null} />
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
                const objetivo = program.objetivo as unknown as Record<string, number> | null;
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
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <div className="flex gap-2 max-w-lg mx-auto">
          {/* If user is already enrolled AND program is active, show continue UI */}
          {enrollment && enrollment.status === "active" ? (
            <Button
              className="flex-1 h-12 text-sm font-semibold"
              onClick={() => {
                // Navigate to first non-completed routine based on current week
                const currentWeek = program.weeks?.find(w => w.week_number === enrollment.current_week);
                const sortedRoutines = currentWeek?.routines?.sort((a, b) => a.orden - b.orden) || [];
                const nextRoutine = sortedRoutines.find(r => !completedRoutineIds.has(r.routine_id)) || sortedRoutines[0];
                if (nextRoutine) {
                  navigate(`/rutina/${nextRoutine.routine_id}`, { state: { from: `/programa/${id}` } });
                }
              }}
              disabled={!program.weeks?.length}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Continuar programa
            </Button>
          ) : enrollment && enrollment.status === "completed" ? (
            <Button
              className="flex-1 h-12 text-sm font-semibold"
              variant="outline"
              onClick={async () => {
                // Re-enroll to restart the program
                try {
                  await enrollMutation.mutateAsync({
                    programId: program.id,
                    startWeek: 1,
                  });
                  toast.success("¡Programa reiniciado!");
                } catch (error) {
                  toast.error("Error al reiniciar el programa");
                }
              }}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              Reiniciar programa
            </Button>
          ) : (
            <>
              <Button
                className="w-full h-12 text-sm font-semibold"
                onClick={() => {
                  if (!user) {
                    toast.error("Debes iniciar sesión para comenzar un programa");
                    navigate("/login");
                    return;
                  }
                  
                  // Check if there's another active program
                  if (activeProgram && activeProgram.id !== program.id) {
                    setShowSwitchProgramDialog(true);
                    return;
                  }
                  
                  // No conflict, proceed directly
                  handleStartProgram();
                }}
                disabled={!program.weeks?.length || !program.weeks[0]?.routines?.length || enrollMutation.isPending}
              >
                {enrollMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4 mr-2" />
                )}
                Comenzar ahora
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Schedule Program Modal */}
      {program.weeks && program.weeks.length > 0 && (
        <ScheduleProgramModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          programName={program.nombre}
          weekNumber={1}
          routines={program.weeks
            .sort((a, b) => a.week_number - b.week_number)[0]
            ?.routines?.map(wr => ({
              id: wr.id,
              routine_id: wr.routine_id,
              orden: wr.orden,
              routine: wr.routine ? {
                id: wr.routine.id,
                nombre: wr.routine.nombre,
                portada_url: wr.routine.portada_url,
                categoria: wr.routine.categoria,
              } : null,
            })) || []}
          onSchedule={async (assignments) => {
            await scheduleMutation.mutateAsync({
              programId: program.id,
              startWeek: 1,
              assignments,
            });
            toast.success("¡Rutinas agendadas! Las verás en tu calendario y Home.");
            setScheduleModalOpen(false);
          }}
          isLoading={scheduleMutation.isPending}
        />
      )}

      {/* Switch Program Confirmation Dialog */}
      <AlertDialog open={showSwitchProgramDialog} onOpenChange={setShowSwitchProgramDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar de programa?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Actualmente tienes activo el programa <strong>"{activeProgram?.nombre}"</strong>.
              </p>
              <p>
                Si inicias este nuevo programa, el anterior dejará de mostrar su progreso en el Home. 
              </p>
              <p className="text-primary font-medium">
                No te preocupes: las rutinas que ya completaste siguen contribuyendo a tu mapa de aptitudes.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSwitchProgramDialog(false);
                handleStartProgram();
              }}
            >
              Sí, cambiar programa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}