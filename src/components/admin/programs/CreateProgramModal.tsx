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
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Minus, 
  Copy, 
  GripVertical, 
  X, 
  Search,
  Edit,
  Loader2,
} from "lucide-react";
import { useAvailableRoutines, useCreateProgram, useUpdateProgram } from "@/hooks/usePrograms";
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
  duracion_semanas: number;
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
    duracion_semanas: 4,
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
  } | null>(null);

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
          })),
        }));

        setFormData({
          id: program.id,
          nombre: program.nombre,
          descripcion: program.descripcion || "",
          portada_url: program.portada_url || "",
          duracion_semanas: program.duracion_semanas || 4,
          estado: program.estado as "borrador" | "publicada",
          weeks: weeks.length > 0 ? weeks : [createEmptyWeek(1)],
        });
      } else {
        // Creating new program
        setFormData({
          nombre: "",
          descripcion: "",
          portada_url: "",
          duracion_semanas: 4,
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
    return true;
  });

  const handleDragStart = (routine: typeof filteredRoutines[0]) => {
    setDraggedRoutine({
      routine_id: routine.id,
      nombre: routine.nombre,
      categoria: routine.categoria,
      dificultad: routine.dificultad,
    });
  };

  const handleDragEnd = () => {
    setDraggedRoutine(null);
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

  const duplicateWeek = (weekIndex: number) => {
    const sourcWeek = formData.weeks[weekIndex];
    const newWeek: ProgramWeek = {
      id: crypto.randomUUID(),
      week_number: formData.duracion_semanas + 1,
      routines: sourcWeek.routines.map(r => ({
        ...r,
        id: crypto.randomUUID(),
      })),
    };

    setFormData(prev => ({
      ...prev,
      duracion_semanas: prev.duracion_semanas + 1,
      weeks: [...prev.weeks, newWeek],
    }));

    toast({
      title: "Semana duplicada",
      description: `Semana ${weekIndex + 1} copiada a Semana ${formData.duracion_semanas + 1}`,
    });
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

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!formData.nombre.trim()) errors.push("El nombre es obligatorio");
    if (formData.duracion_semanas < 1) errors.push("La duración debe ser al menos 1 semana");
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
        dificultad: "Intermedio", // Default for programs
        estado,
        portada_url: formData.portada_url || undefined,
        duracion_semanas: formData.duracion_semanas,
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-xl font-heading">
            {program ? "Editar Programa" : "Crear Programa"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Program structure */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 space-y-4 border-b border-border">
              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
              <div className="space-y-2">
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
                <Label htmlFor="portada">URL de portada</Label>
                <Input
                  id="portada"
                  value={formData.portada_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, portada_url: e.target.value }))}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="bg-card border-border"
                />
              </div>
            </div>

            {/* Weeks */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {formData.weeks.map((week, weekIndex) => (
                  <div
                    key={week.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      draggedRoutine ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnWeek(weekIndex)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">
                        Semana {week.week_number}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateWeek(weekIndex)}
                        className="gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicar
                      </Button>
                    </div>

                    {week.routines.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                        Arrastra rutinas aquí
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {week.routines.map((routine, routineIndex) => (
                          <div
                            key={routine.id}
                            className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border group"
                          >
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => moveRoutineInWeek(weekIndex, routineIndex, routineIndex - 1)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                disabled={routineIndex === 0}
                              >
                                <GripVertical className="h-3 w-3 rotate-90" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRoutineInWeek(weekIndex, routineIndex, routineIndex + 1)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                disabled={routineIndex === week.routines.length - 1}
                              >
                                <GripVertical className="h-3 w-3 -rotate-90" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {routine.nombre}
                                </span>
                                {routine.isCustomized && (
                                  <Badge variant="secondary" className="text-xs">
                                    Editada
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{routine.categoria}</span>
                                <span>•</span>
                                <span>{routine.dificultad}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                toast({
                                  title: "Próximamente",
                                  description: "La edición de rutinas dentro del programa estará disponible pronto",
                                });
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeRoutineFromWeek(weekIndex, routineIndex)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                {["", "Funcional", "Kinesiología", "Activación"].map((cat) => (
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
    </Dialog>
  );
}

