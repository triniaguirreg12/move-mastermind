import { useState, useEffect, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Minus, 
  Copy, 
  X, 
  Search,
  Edit,
  Loader2,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  Upload,
} from "lucide-react";
import { useAvailableRoutines, useCreateProgram, useUpdateProgram } from "@/hooks/usePrograms";
import ObjectiveRadarChart from "@/components/admin/routines/ObjectiveRadarChart";
import EditProgramRoutineModal from "./EditProgramRoutineModal";
import { 
  RutinaObjetivo, 
  APTITUDES_KEYS, 
  createEmptyObjetivo,
  DIFICULTADES_RUTINA,
  type DificultadRutina,
} from "@/components/admin/routines/types";
import type { Json } from "@/integrations/supabase/types";

interface ProgramRoutine {
  id: string;
  routine_id: string;
  nombre: string;
  categoria: string;
  dificultad: string;
  orden: number;
  custom_data: Json | null;
  isCustomized?: boolean;
  objetivo?: RutinaObjetivo;
}

interface ProgramWeek {
  id: string;
  week_number: number;
  routines: ProgramRoutine[];
}

interface ProgramFormData {
  id?: string;
  nombre: string;
  descripcion: string;
  portada_url: string;
  portada_type: "routine" | "external" | "";
  portada_routine_id?: string;
  duracion_semanas: number;
  dificultad: DificultadRutina | "";
  estado: "borrador" | "publicada";
  weeks: ProgramWeek[];
}

interface CreateProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  program?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    portada_url: string | null;
    duracion_semanas: number | null;
    dificultad: string;
    estado: string;
    weeks?: Array<{
      id: string;
      week_number: number;
      routines?: Array<{
        id: string;
        routine_id: string;
        orden: number;
        custom_data: Json | null;
        routine?: {
          nombre: string;
          categoria: string;
          dificultad: string;
          objetivo?: Json;
        };
      }>;
    }>;
  } | null;
}

const createEmptyWeek = (weekNumber: number): ProgramWeek => ({
  id: crypto.randomUUID(),
  week_number: weekNumber,
  routines: [],
});

export default function CreateProgramModal({
  open,
  onOpenChange,
  onSave,
  program,
}: CreateProgramModalProps) {
  const { toast } = useToast();
  const { data: availableRoutines, isLoading: loadingRoutines } = useAvailableRoutines();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const [formData, setFormData] = useState<ProgramFormData>({
    nombre: "",
    descripcion: "",
    portada_url: "",
    portada_type: "",
    duracion_semanas: 4,
    dificultad: "",
    estado: "borrador",
    weeks: [createEmptyWeek(1), createEmptyWeek(2), createEmptyWeek(3), createEmptyWeek(4)],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [draggedRoutine, setDraggedRoutine] = useState<{
    routine_id: string;
    nombre: string;
    categoria: string;
    dificultad: string;
    objetivo?: RutinaObjetivo;
  } | null>(null);
  const [draggedWeekIndex, setDraggedWeekIndex] = useState<number | null>(null);
  
  // State for editing routine within program
  const [editingRoutine, setEditingRoutine] = useState<{
    weekIndex: number;
    routineIndex: number;
    routineId: string;
    customData: Json | null;
  } | null>(null);

  const calculatedObjetivo = useMemo((): RutinaObjetivo => {
    const allRoutines = formData.weeks.flatMap(w => w.routines);
    if (allRoutines.length === 0) return createEmptyObjetivo();

    const totals = createEmptyObjetivo();
    let count = 0;

    allRoutines.forEach(routine => {
      if (routine.objetivo) {
        APTITUDES_KEYS.forEach(key => {
          totals[key] += routine.objetivo![key] || 0;
        });
        count++;
      }
    });

    if (count === 0) return createEmptyObjetivo();

    const averaged = { ...totals };
    APTITUDES_KEYS.forEach(key => {
      averaged[key] = Math.round((totals[key] / count) * 10) / 10;
    });

    return averaged;
  }, [formData.weeks]);

  // Check if there are any scored aptitudes
  const hasAptitudes = APTITUDES_KEYS.some(key => calculatedObjetivo[key] > 0);

  // Reset form when opening/closing or when program changes
  useEffect(() => {
    if (open) {
      if (program) {
        // Editing existing program
        const weeks = (program.weeks || []).map(w => ({
          id: w.id,
          week_number: w.week_number,
          routines: (w.routines || []).map(r => ({
            id: r.id,
            routine_id: r.routine_id,
            nombre: r.routine?.nombre || "Rutina",
            categoria: r.routine?.categoria || "Funcional",
            dificultad: r.routine?.dificultad || "Principiante",
            orden: r.orden,
            custom_data: r.custom_data,
            isCustomized: !!r.custom_data,
            objetivo: r.routine?.objetivo as unknown as RutinaObjetivo | undefined,
          })),
        }));

        setFormData({
          id: program.id,
          nombre: program.nombre,
          descripcion: program.descripcion || "",
          portada_url: program.portada_url || "",
          portada_type: program.portada_url ? "external" : "",
          duracion_semanas: program.duracion_semanas || 4,
          dificultad: (program.dificultad as DificultadRutina) || "",
          estado: program.estado as "borrador" | "publicada",
          weeks: weeks.length > 0 ? weeks : [createEmptyWeek(1)],
        });
      } else {
        // Creating new program
        setFormData({
          nombre: "",
          descripcion: "",
          portada_url: "",
          portada_type: "",
          duracion_semanas: 4,
          dificultad: "",
          estado: "borrador",
          weeks: [createEmptyWeek(1), createEmptyWeek(2), createEmptyWeek(3), createEmptyWeek(4)],
        });
      }
      setSearchTerm("");
      setFilterCategoria("");
    }
  }, [open, program]);

  // Update weeks when duration changes
  useEffect(() => {
    const currentWeeks = formData.weeks.length;
    const targetWeeks = formData.duracion_semanas;

    if (targetWeeks > currentWeeks) {
      // Add weeks
      const newWeeks = [...formData.weeks];
      for (let i = currentWeeks + 1; i <= targetWeeks; i++) {
        newWeeks.push(createEmptyWeek(i));
      }
      setFormData(prev => ({ ...prev, weeks: newWeeks }));
    } else if (targetWeeks < currentWeeks) {
      // Remove weeks (keep first N)
      setFormData(prev => ({
        ...prev,
        weeks: prev.weeks.slice(0, targetWeeks),
      }));
    }
  }, [formData.duracion_semanas]);

  const filteredRoutines = (availableRoutines || []).filter(r => {
    if (searchTerm && !r.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterCategoria && r.categoria !== filterCategoria) {
      return false;
    }
    // Only show Funcional and Kinesiología (not Activación)
    if (r.categoria === "Activación") {
      return false;
    }
    return true;
  });

  const handleDragStart = (routine: typeof filteredRoutines[0]) => {
    setDraggedRoutine({
      routine_id: routine.id,
      nombre: routine.nombre,
      categoria: routine.categoria,
      dificultad: routine.dificultad,
      objetivo: (routine as any).objetivo as RutinaObjetivo | undefined,
    });
  };

  const handleDragEnd = () => {
    setDraggedRoutine(null);
    setDraggedWeekIndex(null);
  };

  const handleDropOnWeek = (weekIndex: number) => {
    if (!draggedRoutine) return;

    const newWeeks = [...formData.weeks];
    const targetWeek = newWeeks[weekIndex];
    
    targetWeek.routines.push({
      id: crypto.randomUUID(),
      routine_id: draggedRoutine.routine_id,
      nombre: draggedRoutine.nombre,
      categoria: draggedRoutine.categoria,
      dificultad: draggedRoutine.dificultad,
      orden: targetWeek.routines.length,
      custom_data: null,
      objetivo: draggedRoutine.objetivo,
    });

    setFormData(prev => ({ ...prev, weeks: newWeeks }));
    setDraggedRoutine(null);

    toast({
      title: "Rutina agregada",
      description: `"${draggedRoutine.nombre}" agregada a Semana ${weekIndex + 1}`,
    });
  };

  const removeRoutineFromWeek = (weekIndex: number, routineIndex: number) => {
    const newWeeks = [...formData.weeks];
    newWeeks[weekIndex].routines.splice(routineIndex, 1);
    // Reorder remaining routines
    newWeeks[weekIndex].routines.forEach((r, i) => {
      r.orden = i;
    });
    setFormData(prev => ({ ...prev, weeks: newWeeks }));
  };

  const duplicateWeekToPosition = (sourceWeekIndex: number, targetWeekNumber: number) => {
    const sourceWeek = formData.weeks[sourceWeekIndex];
    const targetWeekIndex = targetWeekNumber - 1;
    
    if (targetWeekIndex < 0 || targetWeekIndex >= formData.weeks.length) {
      toast({
        title: "Error",
        description: `La semana ${targetWeekNumber} no existe`,
        variant: "destructive",
      });
      return;
    }

    if (targetWeekIndex === sourceWeekIndex) {
      toast({
        title: "Aviso",
        description: "No puedes duplicar una semana a sí misma",
        variant: "destructive",
      });
      return;
    }

    const newWeeks = [...formData.weeks];
    newWeeks[targetWeekIndex] = {
      ...newWeeks[targetWeekIndex],
      routines: sourceWeek.routines.map(r => ({
        ...r,
        id: crypto.randomUUID(),
      })),
    };

    setFormData(prev => ({ ...prev, weeks: newWeeks }));

    toast({
      title: "Semana duplicada",
      description: `Contenido de Semana ${sourceWeekIndex + 1} copiado a Semana ${targetWeekNumber}`,
    });
  };

  const duplicateWeekToNewWeek = (sourceWeekIndex: number) => {
    const sourceWeek = formData.weeks[sourceWeekIndex];
    const newWeekNumber = formData.duracion_semanas + 1;
    
    const newWeek: ProgramWeek = {
      id: crypto.randomUUID(),
      week_number: newWeekNumber,
      routines: sourceWeek.routines.map(r => ({
        ...r,
        id: crypto.randomUUID(),
      })),
    };

    setFormData(prev => ({
      ...prev,
      duracion_semanas: newWeekNumber,
      weeks: [...prev.weeks, newWeek],
    }));

    toast({
      title: "Semana duplicada",
      description: `Semana ${sourceWeekIndex + 1} copiada a nueva Semana ${newWeekNumber}`,
    });
  };

  const addNewWeek = () => {
    const newWeekNumber = formData.duracion_semanas + 1;
    setFormData(prev => ({
      ...prev,
      duracion_semanas: newWeekNumber,
      weeks: [...prev.weeks, createEmptyWeek(newWeekNumber)],
    }));
  };

  const moveWeek = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= formData.weeks.length) return;

    const newWeeks = [...formData.weeks];
    const [movedWeek] = newWeeks.splice(fromIndex, 1);
    newWeeks.splice(toIndex, 0, movedWeek);
    
    // Update week numbers
    newWeeks.forEach((week, index) => {
      week.week_number = index + 1;
    });

    setFormData(prev => ({ ...prev, weeks: newWeeks }));
  };

  const moveRoutineInWeek = (weekIndex: number, fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.weeks[weekIndex].routines.length) return;
    
    const newWeeks = [...formData.weeks];
    const [removed] = newWeeks[weekIndex].routines.splice(fromIndex, 1);
    newWeeks[weekIndex].routines.splice(toIndex, 0, removed);
    // Reorder
    newWeeks[weekIndex].routines.forEach((r, i) => {
      r.orden = i;
    });
    setFormData(prev => ({ ...prev, weeks: newWeeks }));
  };

  const handleRoutineCustomDataSave = (customData: Record<string, unknown>) => {
    if (!editingRoutine) return;
    
    const { weekIndex, routineIndex } = editingRoutine;
    const newWeeks = [...formData.weeks];
    const routine = newWeeks[weekIndex].routines[routineIndex];
    
    const hasCustomizations = Object.keys(customData).length > 0;
    
    routine.custom_data = hasCustomizations ? (customData as Json) : null;
    routine.isCustomized = hasCustomizations;
    
    // Update display values if customized
    if (customData.nombre) {
      routine.nombre = customData.nombre as string;
    }
    if (customData.dificultad) {
      routine.dificultad = customData.dificultad as string;
    }
    if (customData.objetivo) {
      routine.objetivo = customData.objetivo as RutinaObjetivo;
    }
    
    setFormData(prev => ({ ...prev, weeks: newWeeks }));
    setEditingRoutine(null);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!formData.nombre.trim()) errors.push("El nombre es obligatorio");
    if (formData.duracion_semanas < 1) errors.push("La duración debe ser al menos 1 semana");
    if (!formData.dificultad) errors.push("La dificultad es obligatoria");
    return errors;
  };

  const handleSave = async (publish: boolean) => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Errores de validación",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    const estado = publish ? "publicada" : "borrador";

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        categoria: "Funcional", // Default for programs
        dificultad: formData.dificultad,
        estado,
        portada_url: formData.portada_url || undefined,
        duracion_semanas: formData.duracion_semanas,
        objetivo: calculatedObjetivo as unknown as Json,
        weeks: formData.weeks.map(w => ({
          week_number: w.week_number,
          routines: w.routines.map(r => ({
            routine_id: r.routine_id,
            orden: r.orden,
            custom_data: r.custom_data || undefined,
          })),
        })),
      };

      if (formData.id) {
        await updateProgram.mutateAsync({ id: formData.id, ...payload });
        toast({
          title: "Programa actualizado",
          description: `"${formData.nombre}" guardado correctamente`,
        });
      } else {
        await createProgram.mutateAsync(payload);
        toast({
          title: "Programa creado",
          description: `"${formData.nombre}" creado correctamente`,
        });
      }

      onSave?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el programa",
        variant: "destructive",
      });
    }
  };

  const isSaving = createProgram.isPending || updateProgram.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-xl font-heading">
            {program ? "Editar Programa" : "Crear Programa"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Program structure */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 space-y-4 border-b border-border">
              {/* Basic fields - Row 1 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nombre">Nombre del programa *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Programa de 8 semanas"
                    className="bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dificultad">Dificultad *</Label>
                  <Select
                    value={formData.dificultad}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      dificultad: value as DificultadRutina 
                    }))}
                  >
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFICULTADES_RUTINA.map((dif) => (
                        <SelectItem key={dif} value={dif}>
                          {dif}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Description and Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción del programa (opcional)"
                    className="bg-card border-border resize-none"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración (semanas) *</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        duracion_semanas: Math.max(1, prev.duracion_semanas - 1) 
                      }))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="duracion"
                      type="number"
                      min={1}
                      max={52}
                      value={formData.duracion_semanas}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        duracion_semanas: Math.max(1, parseInt(e.target.value) || 1) 
                      }))}
                      className="bg-card border-border text-center w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        duracion_semanas: prev.duracion_semanas + 1 
                      }))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Row 3: Cover and Radar */}
              <div className="grid grid-cols-2 gap-4">
                {/* Cover Photo */}
                <div className="space-y-2">
                  <Label>Portada del programa</Label>
                  <div className="flex gap-2">
                    {/* Cover preview or drop zone */}
                    <div 
                      className={`h-20 w-20 rounded-lg border-2 border-dashed flex-shrink-0 flex items-center justify-center overflow-hidden transition-colors ${
                        formData.portada_url ? "border-border" : "border-border/50 hover:border-primary/50"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (files.length > 0 && files[0].type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({ 
                              ...prev, 
                              portada_url: event.target?.result as string,
                              portada_type: "external"
                            }));
                          };
                          reader.readAsDataURL(files[0]);
                        }
                      }}
                    >
                      {formData.portada_url ? (
                        <img 
                          src={formData.portada_url} 
                          alt="Portada"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-center p-1">
                          <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground">Drop image</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Options */}
                    <div className="flex-1 space-y-1.5">
                      <Select
                        value={formData.portada_type}
                        onValueChange={(value) => {
                          if (value === "routine" && availableRoutines && availableRoutines.length > 0) {
                            const routineWithThumb = availableRoutines.find(r => r.portada_url);
                            if (routineWithThumb) {
                              setFormData(prev => ({ 
                                ...prev, 
                                portada_type: "routine",
                                portada_url: routineWithThumb.portada_url || "",
                                portada_routine_id: routineWithThumb.id
                              }));
                            }
                          } else if (value === "external") {
                            setFormData(prev => ({ ...prev, portada_type: "external", portada_url: "", portada_routine_id: undefined }));
                          } else {
                            setFormData(prev => ({ ...prev, portada_type: "", portada_url: "", portada_routine_id: undefined }));
                          }
                        }}
                      >
                        <SelectTrigger className="bg-card border-border h-8 text-xs">
                          <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">De una rutina</SelectItem>
                          <SelectItem value="external">Imagen externa</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {formData.portada_type === "routine" && (
                        <Select
                          value={formData.portada_routine_id || ""}
                          onValueChange={(routineId) => {
                            const routine = availableRoutines?.find(r => r.id === routineId);
                            if (routine) {
                              setFormData(prev => ({ 
                                ...prev, 
                                portada_url: routine.portada_url || "",
                                portada_routine_id: routineId
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="bg-card border-border h-8 text-xs">
                            <SelectValue placeholder="Seleccionar rutina..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(availableRoutines || []).filter(r => r.portada_url).map((routine) => (
                              <SelectItem key={routine.id} value={routine.id}>
                                {routine.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {formData.portada_type === "external" && (
                        <Input
                          value={formData.portada_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, portada_url: e.target.value }))}
                          placeholder="URL o arrastra imagen..."
                          className="bg-card border-border h-8 text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Radar - more compact */}
                <div className="space-y-1">
                  <Label className="text-xs">Aptitudes físicas (promedio)</Label>
                  <div className="flex items-start gap-3">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden">
                      {hasAptitudes ? (
                        <ObjectiveRadarChart objetivo={calculatedObjetivo} />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full border-2 border-dashed border-border/50 rounded text-muted-foreground text-[10px] text-center p-1">
                          Sin rutinas
                        </div>
                      )}
                    </div>
                    {hasAptitudes && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0 text-xs flex-1">
                        {APTITUDES_KEYS.map(key => (
                          <div key={key} className="flex items-center justify-between py-0.5">
                            <span className="text-muted-foreground capitalize text-[10px]">{key.slice(0, 4)}.</span>
                            <span className="font-medium text-foreground text-xs">{calculatedObjetivo[key]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Weeks - Grid layout for better visibility */}
            <ScrollArea className="flex-1 p-3">
              <div className="grid grid-cols-2 gap-3">
                {formData.weeks.map((week, weekIndex) => (
                  <div
                    key={week.id}
                    className={`border rounded-lg p-3 transition-colors min-h-[120px] ${
                      draggedRoutine ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnWeek(weekIndex)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => moveWeek(weekIndex, "up")}
                            className="text-muted-foreground hover:text-foreground p-0.5 disabled:opacity-30"
                            disabled={weekIndex === 0}
                          >
                            <ChevronUp className="h-2.5 w-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveWeek(weekIndex, "down")}
                            className="text-muted-foreground hover:text-foreground p-0.5 disabled:opacity-30"
                            disabled={weekIndex === formData.weeks.length - 1}
                          >
                            <ChevronDown className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <span className="font-semibold text-foreground text-sm">
                          S{week.week_number}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {week.routines.length}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          {formData.weeks.map((_, targetIndex) => (
                            targetIndex !== weekIndex && (
                              <DropdownMenuItem
                                key={targetIndex}
                                onClick={() => duplicateWeekToPosition(weekIndex, targetIndex + 1)}
                              >
                                Copiar a S{targetIndex + 1}
                              </DropdownMenuItem>
                            )
                          ))}
                          <DropdownMenuItem onClick={() => duplicateWeekToNewWeek(weekIndex)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Nueva semana
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {week.routines.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-xs border border-dashed border-border/50 rounded">
                        Arrastra rutinas
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {week.routines.map((routine, routineIndex) => (
                          <div
                            key={routine.id}
                            className="flex items-center gap-1 p-1.5 bg-card rounded border border-border group text-xs"
                          >
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => moveRoutineInWeek(weekIndex, routineIndex, routineIndex - 1)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                disabled={routineIndex === 0}
                              >
                                <ChevronUp className="h-2.5 w-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRoutineInWeek(weekIndex, routineIndex, routineIndex + 1)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                disabled={routineIndex === week.routines.length - 1}
                              >
                                <ChevronDown className="h-2.5 w-2.5" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-medium truncate text-xs">
                                  {routine.nombre}
                                </span>
                                {routine.isCustomized && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                    Ed
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">{routine.categoria}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setEditingRoutine({
                                  weekIndex,
                                  routineIndex,
                                  routineId: routine.routine_id,
                                  customData: routine.custom_data,
                                });
                              }}
                            >
                              <Edit className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeRoutineFromWeek(weekIndex, routineIndex)}
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add week button */}
              <Button
                variant="outline"
                className="w-full border-dashed mt-3"
                onClick={addNewWeek}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar semana
              </Button>
            </ScrollArea>
          </div>

          {/* Right: Routine library */}
          <div className="w-80 border-l border-border flex flex-col">
            <div className="p-4 border-b border-border space-y-3">
              <h3 className="font-semibold text-sm text-foreground">
                Biblioteca de Rutinas
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar rutina..."
                  className="pl-9 bg-card border-border"
                />
              </div>
              <div className="flex gap-1">
                {["", "Funcional", "Kinesiología"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategoria(cat)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      filterCategoria === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat || "Todas"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Solo rutinas publicadas • Arrastra para agregar
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {loadingRoutines ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRoutines.length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">
                    No hay rutinas disponibles
                  </p>
                ) : (
                  filteredRoutines.map((routine) => (
                    <div
                      key={routine.id}
                      draggable
                      onDragStart={() => handleDragStart(routine)}
                      onDragEnd={handleDragEnd}
                      className="p-3 bg-card border border-border rounded-lg cursor-grab hover:border-primary/50 active:cursor-grabbing transition-colors"
                    >
                      <div className="font-medium text-sm truncate">
                        {routine.nombre}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `hsl(var(--category-${routine.categoria.toLowerCase()})/.2)`,
                            color: `hsl(var(--category-${routine.categoria.toLowerCase()}))`,
                          }}
                        >
                          {routine.categoria}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {routine.dificultad}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar como borrador
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar y publicar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Edit routine modal */}
      {editingRoutine && (
        <EditProgramRoutineModal
          open={!!editingRoutine}
          onOpenChange={(open) => !open && setEditingRoutine(null)}
          routineId={editingRoutine.routineId}
          currentCustomData={editingRoutine.customData}
          onSave={handleRoutineCustomDataSave}
        />
      )}
    </Dialog>
  );
}
