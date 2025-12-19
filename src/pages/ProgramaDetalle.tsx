import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, Calendar, Loader2, AlertCircle, Dumbbell, ChevronRight, Check, Circle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useProgram } from "@/hooks/usePrograms";
import { RoutineRadarChart } from "@/components/rutina/RoutineRadarChart";

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
  
  const { data: program, isLoading, error } = useProgram(id);

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

  const handleRoutineClick = (routineId: string) => {
    navigate(`/rutina/${routineId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Fixed Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => navigate(-1)}
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
                              .map((weekRoutine, index) => (
                                <button
                                  key={weekRoutine.id}
                                  onClick={() => handleRoutineClick(weekRoutine.routine_id)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all text-left"
                                >
                                  {/* Order number */}
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {index + 1}
                                    </span>
                                  </div>

                                  {/* Routine thumbnail */}
                                  {weekRoutine.routine?.portada_url && (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                      <img
                                        src={weekRoutine.routine.portada_url}
                                        alt={weekRoutine.routine.nombre}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}

                                  {/* Routine info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {weekRoutine.routine?.nombre || "Rutina"}
                                    </p>
                                    {weekRoutine.routine?.categoria && (
                                      <p className="text-xs text-muted-foreground">
                                        {weekRoutine.routine.categoria}
                                      </p>
                                    )}
                                  </div>

                                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </button>
                              ))
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

      {/* Sticky Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={() => {
              // Navigate to first routine of first week
              const firstWeek = program.weeks?.sort((a, b) => a.week_number - b.week_number)[0];
              const firstRoutine = firstWeek?.routines?.sort((a, b) => a.orden - b.orden)[0];
              if (firstRoutine) {
                navigate(`/rutina/${firstRoutine.routine_id}`);
              }
            }}
            disabled={!program.weeks?.length || !program.weeks[0]?.routines?.length}
          >
            Comenzar programa
          </Button>
        </div>
      </div>
    </div>
  );
}