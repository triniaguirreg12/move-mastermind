import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, AlertTriangle, ChevronDown, Clock, Repeat, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ObjectiveRadarChart from "@/components/admin/routines/ObjectiveRadarChart";
import {
  RutinaObjetivo,
  APTITUDES_KEYS,
  APTITUDES_LABELS,
  createEmptyObjetivo,
  DIFICULTADES_RUTINA,
} from "@/components/admin/routines/types";
import type { Json } from "@/integrations/supabase/types";

interface BlockExerciseCustom {
  tiempo?: number;
  repeticiones?: number;
  descanso_override?: number;
}

interface BlockCustom {
  descanso_entre_ejercicios?: number;
  descanso_entre_series?: number;
  series?: number;
  exercises?: Record<string, BlockExerciseCustom>;
}

interface ProgramRoutineCustomData {
  nombre?: string;
  descripcion?: string;
  dificultad?: string;
  objetivo?: RutinaObjetivo;
  descanso_entre_bloques?: number;
  blocks?: Record<string, BlockCustom>;
}

interface RoutineBlock {
  id: string;
  nombre: string;
  orden: number;
  series: number | null;
  descanso_entre_ejercicios: number | null;
  descanso_entre_series: number | null;
  repetir_bloque: boolean | null;
  exercises: Array<{
    id: string;
    orden: number;
    tiempo: number | null;
    repeticiones: number | null;
    tipo_ejecucion: string;
    exercise: {
      id: string;
      nombre: string;
      thumbnail_url: string | null;
    } | null;
  }>;
}

interface EditProgramRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineId: string;
  currentCustomData: Json | null;
  onSave: (customData: ProgramRoutineCustomData) => void;
}

export default function EditProgramRoutineModal({
  open,
  onOpenChange,
  routineId,
  currentCustomData,
  onSave,
}: EditProgramRoutineModalProps) {
  const { toast } = useToast();
  
  // Fetch the original routine data with blocks
  const { data: originalRoutine, isLoading: loadingRoutine } = useQuery({
    queryKey: ["routine-detail", routineId],
    enabled: open && !!routineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("id", routineId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch blocks and exercises
  const { data: blocks, isLoading: loadingBlocks } = useQuery({
    queryKey: ["routine-blocks", routineId],
    enabled: open && !!routineId,
    queryFn: async () => {
      const { data: blocksData, error: blocksError } = await supabase
        .from("routine_blocks")
        .select("*")
        .eq("routine_id", routineId)
        .order("orden", { ascending: true });

      if (blocksError) throw blocksError;
      if (!blocksData || blocksData.length === 0) return [];

      const blockIds = blocksData.map(b => b.id);
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("block_exercises")
        .select(`
          *,
          exercise:exercises(id, nombre, thumbnail_url)
        `)
        .in("block_id", blockIds)
        .order("orden", { ascending: true });

      if (exercisesError) throw exercisesError;

      return blocksData.map(block => ({
        ...block,
        exercises: (exercisesData || [])
          .filter(e => e.block_id === block.id)
          .map(e => ({
            ...e,
            exercise: e.exercise as { id: string; nombre: string; thumbnail_url: string | null } | null,
          })),
      })) as RoutineBlock[];
    },
  });

  const [customData, setCustomData] = useState<ProgramRoutineCustomData>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Initialize form when modal opens
  useEffect(() => {
    if (open && originalRoutine) {
      const parsed = currentCustomData as ProgramRoutineCustomData | null;
      setCustomData(parsed || {});
      // Expand all blocks by default
      if (blocks) {
        setExpandedBlocks(new Set(blocks.map(b => b.id)));
      }
    }
  }, [open, originalRoutine, currentCustomData, blocks]);

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  // Get effective values
  const getEffectiveValue = <T,>(field: keyof ProgramRoutineCustomData, originalValue: T): T => {
    const customValue = customData[field];
    return customValue !== undefined ? (customValue as T) : originalValue;
  };

  const getBlockValue = <T,>(blockId: string, field: keyof BlockCustom, originalValue: T): T => {
    const blockCustom = customData.blocks?.[blockId];
    if (blockCustom && blockCustom[field] !== undefined) {
      return blockCustom[field] as T;
    }
    return originalValue;
  };

  const getExerciseValue = <T,>(blockId: string, exerciseId: string, field: keyof BlockExerciseCustom, originalValue: T): T => {
    const exerciseCustom = customData.blocks?.[blockId]?.exercises?.[exerciseId];
    if (exerciseCustom && exerciseCustom[field] !== undefined) {
      return exerciseCustom[field] as T;
    }
    return originalValue;
  };

  const handleFieldChange = <K extends keyof ProgramRoutineCustomData>(
    field: K,
    value: ProgramRoutineCustomData[K]
  ) => {
    setCustomData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlockChange = (blockId: string, field: keyof BlockCustom, value: number) => {
    setCustomData(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks?.[blockId],
          [field]: value,
        },
      },
    }));
  };

  const handleExerciseChange = (blockId: string, exerciseId: string, field: keyof BlockExerciseCustom, value: number) => {
    setCustomData(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks?.[blockId],
          exercises: {
            ...prev.blocks?.[blockId]?.exercises,
            [exerciseId]: {
              ...prev.blocks?.[blockId]?.exercises?.[exerciseId],
              [field]: value,
            },
          },
        },
      },
    }));
  };

  const handleObjetivoChange = (key: keyof RutinaObjetivo, value: number) => {
    const currentObjetivo = getEffectiveValue(
      "objetivo",
      (originalRoutine?.objetivo as unknown as RutinaObjetivo) || createEmptyObjetivo()
    );
    const newObjetivo = { ...currentObjetivo, [key]: value };
    handleFieldChange("objetivo", newObjetivo);
  };

  const resetField = (field: keyof ProgramRoutineCustomData) => {
    setCustomData(prev => {
      const newData = { ...prev };
      delete newData[field];
      return newData;
    });
  };

  const resetBlock = (blockId: string) => {
    setCustomData(prev => {
      const newBlocks = { ...prev.blocks };
      delete newBlocks[blockId];
      return { ...prev, blocks: Object.keys(newBlocks).length > 0 ? newBlocks : undefined };
    });
  };

  const resetAllChanges = () => {
    setCustomData({});
  };

  const handleSave = () => {
    // Clean up empty customizations
    const cleanCustomData: ProgramRoutineCustomData = {};
    
    if (customData.nombre && customData.nombre !== originalRoutine?.nombre) {
      cleanCustomData.nombre = customData.nombre;
    }
    if (customData.descripcion !== undefined && customData.descripcion !== originalRoutine?.descripcion) {
      cleanCustomData.descripcion = customData.descripcion;
    }
    if (customData.dificultad && customData.dificultad !== originalRoutine?.dificultad) {
      cleanCustomData.dificultad = customData.dificultad;
    }
    if (customData.objetivo) {
      cleanCustomData.objetivo = customData.objetivo;
    }
    if (customData.descanso_entre_bloques !== undefined && 
        customData.descanso_entre_bloques !== originalRoutine?.descanso_entre_bloques) {
      cleanCustomData.descanso_entre_bloques = customData.descanso_entre_bloques;
    }
    if (customData.blocks && Object.keys(customData.blocks).length > 0) {
      cleanCustomData.blocks = customData.blocks;
    }

    onSave(Object.keys(cleanCustomData).length > 0 ? cleanCustomData : {});
    toast({
      title: "Cambios guardados",
      description: "La rutina dentro del programa ha sido actualizada",
    });
    onOpenChange(false);
  };

  const hasAnyCustomization = Object.keys(customData).length > 0;
  const isLoading = loadingRoutine || loadingBlocks;

  if (isLoading || !originalRoutine) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const effectiveNombre = getEffectiveValue("nombre", originalRoutine.nombre);
  const effectiveDescripcion = getEffectiveValue("descripcion", originalRoutine.descripcion || "");
  const effectiveDificultad = getEffectiveValue("dificultad", originalRoutine.dificultad);
  const effectiveObjetivo = getEffectiveValue(
    "objetivo",
    (originalRoutine.objetivo as unknown as RutinaObjetivo) || createEmptyObjetivo()
  );
  const effectiveDescanso = getEffectiveValue(
    "descanso_entre_bloques",
    originalRoutine.descanso_entre_bloques || 60
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-heading">
              Editar rutina en programa
            </DialogTitle>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              Copia en programa
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Los cambios solo afectan a esta copia. La rutina original permanece intacta.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-4 space-y-6 pb-8">
            {/* Alert */}
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700">Edición aislada</p>
                <p className="text-amber-600/80 mt-0.5">
                  Estos cambios SOLO aplican a esta rutina dentro de este programa.
                </p>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nombre">Nombre</Label>
                  {customData.nombre !== undefined && (
                    <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={() => resetField("nombre")}>
                      <RotateCcw className="h-3 w-3 mr-1" />Restaurar
                    </Button>
                  )}
                </div>
                <Input
                  id="nombre"
                  value={effectiveNombre}
                  onChange={(e) => handleFieldChange("nombre", e.target.value)}
                  className={`bg-card border-border ${customData.nombre !== undefined ? "ring-2 ring-amber-500/30" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dificultad</Label>
                  {customData.dificultad !== undefined && (
                    <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={() => resetField("dificultad")}>
                      <RotateCcw className="h-3 w-3 mr-1" />Restaurar
                    </Button>
                  )}
                </div>
                <Select value={effectiveDificultad} onValueChange={(v) => handleFieldChange("dificultad", v)}>
                  <SelectTrigger className={`bg-card border-border ${customData.dificultad !== undefined ? "ring-2 ring-amber-500/30" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFICULTADES_RUTINA.map((dif) => (
                      <SelectItem key={dif} value={dif}>{dif}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="descripcion">Descripción</Label>
                {customData.descripcion !== undefined && (
                  <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={() => resetField("descripcion")}>
                    <RotateCcw className="h-3 w-3 mr-1" />Restaurar
                  </Button>
                )}
              </div>
              <Textarea
                id="descripcion"
                value={effectiveDescripcion}
                onChange={(e) => handleFieldChange("descripcion", e.target.value)}
                className={`bg-card border-border resize-none ${customData.descripcion !== undefined ? "ring-2 ring-amber-500/30" : ""}`}
                rows={2}
              />
            </div>

            {/* Rest between blocks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descanso entre bloques</Label>
                {customData.descanso_entre_bloques !== undefined && (
                  <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={() => resetField("descanso_entre_bloques")}>
                    <RotateCcw className="h-3 w-3 mr-1" />Restaurar
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[effectiveDescanso]}
                  onValueChange={([v]) => handleFieldChange("descanso_entre_bloques", v)}
                  min={0}
                  max={180}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{effectiveDescanso}s</span>
              </div>
            </div>

            {/* Blocks Section */}
            {blocks && blocks.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Bloques y Ejercicios</Label>
                
                {blocks.map((block) => {
                  const isExpanded = expandedBlocks.has(block.id);
                  const hasBlockCustom = !!customData.blocks?.[block.id];
                  const effectiveDescansoEj = getBlockValue(block.id, "descanso_entre_ejercicios", block.descanso_entre_ejercicios || 30);
                  const effectiveDescansoSeries = getBlockValue(block.id, "descanso_entre_series", block.descanso_entre_series || 60);
                  const effectiveSeries = getBlockValue(block.id, "series", block.series || 1);

                  return (
                    <Collapsible key={block.id} open={isExpanded} onOpenChange={() => toggleBlock(block.id)}>
                      <div className={`border rounded-lg ${hasBlockCustom ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}>
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Dumbbell className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{block.nombre || `Bloque ${block.orden + 1}`}</span>
                              <Badge variant="secondary" className="text-xs">
                                {block.exercises.length} ejercicio{block.exercises.length !== 1 ? "s" : ""}
                              </Badge>
                              {hasBlockCustom && (
                                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                                  Modificado
                                </Badge>
                              )}
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="px-3 pb-3 space-y-4 border-t border-border/50">
                            {/* Block settings */}
                            <div className="grid grid-cols-3 gap-4 pt-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Series</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={effectiveSeries}
                                    onChange={(e) => handleBlockChange(block.id, "series", parseInt(e.target.value) || 1)}
                                    className="bg-card border-border h-8 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Descanso entre ejercicios</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={300}
                                    step={5}
                                    value={effectiveDescansoEj}
                                    onChange={(e) => handleBlockChange(block.id, "descanso_entre_ejercicios", parseInt(e.target.value) || 0)}
                                    className="bg-card border-border h-8 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">seg</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Descanso entre series</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={300}
                                    step={5}
                                    value={effectiveDescansoSeries}
                                    onChange={(e) => handleBlockChange(block.id, "descanso_entre_series", parseInt(e.target.value) || 0)}
                                    className="bg-card border-border h-8 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">seg</span>
                                </div>
                              </div>
                            </div>

                            {hasBlockCustom && (
                              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => resetBlock(block.id)}>
                                <RotateCcw className="h-3 w-3 mr-1" />Restaurar bloque
                              </Button>
                            )}

                            {/* Exercises */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Ejercicios</Label>
                              {block.exercises.map((exercise) => {
                                const hasExerciseCustom = !!customData.blocks?.[block.id]?.exercises?.[exercise.id];
                                const effectiveTiempo = getExerciseValue(block.id, exercise.id, "tiempo", exercise.tiempo || 30);
                                const effectiveReps = getExerciseValue(block.id, exercise.id, "repeticiones", exercise.repeticiones || 10);

                                return (
                                  <div 
                                    key={exercise.id} 
                                    className={`flex items-center gap-3 p-2 rounded-lg ${hasExerciseCustom ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted/30"}`}
                                  >
                                    {exercise.exercise?.thumbnail_url ? (
                                      <img 
                                        src={exercise.exercise.thumbnail_url} 
                                        alt="" 
                                        className="h-10 w-10 rounded object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {exercise.exercise?.nombre || "Ejercicio"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {exercise.tipo_ejecucion === "tiempo" ? "Por tiempo" : "Por repeticiones"}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {exercise.tipo_ejecucion === "tiempo" ? (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            min={5}
                                            max={300}
                                            step={5}
                                            value={effectiveTiempo}
                                            onChange={(e) => handleExerciseChange(block.id, exercise.id, "tiempo", parseInt(e.target.value) || 30)}
                                            className="w-16 h-7 text-sm bg-card border-border"
                                          />
                                          <span className="text-xs text-muted-foreground">seg</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={effectiveReps}
                                            onChange={(e) => handleExerciseChange(block.id, exercise.id, "repeticiones", parseInt(e.target.value) || 10)}
                                            className="w-16 h-7 text-sm bg-card border-border"
                                          />
                                          <span className="text-xs text-muted-foreground">reps</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}

            {/* Objetivos */}
            {originalRoutine.categoria !== "Activación" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Aptitudes físicas</Label>
                  {customData.objetivo !== undefined && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => resetField("objetivo")}>
                      <RotateCcw className="h-3 w-3 mr-1" />Restaurar
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-[180px]">
                      <ObjectiveRadarChart objetivo={effectiveObjetivo} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {APTITUDES_KEYS.map((key) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground text-xs">{APTITUDES_LABELS[key]}</span>
                          <span className="font-medium text-xs">{effectiveObjetivo[key]}</span>
                        </div>
                        <Slider
                          value={[effectiveObjetivo[key]]}
                          onValueChange={([v]) => handleObjetivoChange(key, v)}
                          min={0}
                          max={10}
                          step={1}
                          className="h-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div>
            {hasAnyCustomization && (
              <Button variant="ghost" size="sm" onClick={resetAllChanges} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar todo
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
