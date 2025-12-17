import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, Send, X, Clock, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Ejercicio } from "@/components/admin/CreateExerciseModal";
import {
  Rutina,
  RutinaBloque,
  RutinaEjercicio,
  RutinaObjetivo,
  DificultadRutina,
  CATEGORIAS_RUTINA,
  APTITUDES_KEYS,
  createEmptyRutina,
  createEmptyBloque,
} from "./types";
import ObjectiveScoring from "./ObjectiveScoring";
import ObjectiveRadarChart from "./ObjectiveRadarChart";
import DifficultySection from "./DifficultySection";
import CoverPhotoSection from "./CoverPhotoSection";
import BlockEditor from "./BlockEditor";
import ExerciseLibraryMini from "./ExerciseLibraryMini";

// Mock exercises - in real app, this would come from API
const ejerciciosIniciales: Ejercicio[] = [
  { id: 1, nombre: "Sentadilla con mancuerna", tips: "Mantén la espalda recta.", dificultad: "Intermedio", mecanicas: ["Compuesto"], grupoMuscular: ["Tren Inferior"], musculosPrincipales: ["Glúteos", "Cuádriceps"], aptitudesPrimarias: ["Fuerza"], aptitudesSecundarias: ["Estabilidad"], implementos: ["Mancuerna"], video: null, thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&h=150&fit=crop" },
  { id: 2, nombre: "Peso muerto rumano", tips: "Controla el descenso.", dificultad: "Intermedio", mecanicas: ["Tracción"], grupoMuscular: ["Tren Inferior"], musculosPrincipales: ["Glúteos", "Espalda"], aptitudesPrimarias: ["Fuerza"], aptitudesSecundarias: ["Movilidad"], implementos: ["Mancuerna"], video: null, thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=150&fit=crop" },
  { id: 3, nombre: "Press de banca", tips: "No rebotes.", dificultad: "Avanzado", mecanicas: ["Empuje"], grupoMuscular: ["Tren Superior"], musculosPrincipales: ["Pectoral", "Tríceps"], aptitudesPrimarias: ["Fuerza", "Potencia"], aptitudesSecundarias: [], implementos: ["Mancuerna"], video: null, thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop" },
  { id: 4, nombre: "Plancha frontal", tips: "Mantén el cuerpo en línea recta.", dificultad: "Principiante", mecanicas: ["Anti-movimiento"], grupoMuscular: ["Core"], musculosPrincipales: ["Zona media"], aptitudesPrimarias: ["Estabilidad", "Resistencia"], aptitudesSecundarias: ["Fuerza"], implementos: ["Sin implemento"], video: null, thumbnail: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=200&h=150&fit=crop" },
  { id: 5, nombre: "Burpees", tips: "Explosivo en la subida.", dificultad: "Avanzado", mecanicas: ["Compuesto", "Locomoción"], grupoMuscular: ["Full Body"], musculosPrincipales: ["Cuádriceps", "Pectoral", "Zona media"], aptitudesPrimarias: ["Resistencia", "Potencia"], aptitudesSecundarias: ["Agilidad", "Coordinación"], implementos: ["Sin implemento"], video: null, thumbnail: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=200&h=150&fit=crop" },
  { id: 6, nombre: "Elevación de gemelos", tips: "Sube hasta la máxima contracción.", dificultad: "Principiante", mecanicas: ["Empuje"], grupoMuscular: ["Tren Inferior"], musculosPrincipales: ["Gemelos"], aptitudesPrimarias: ["Fuerza"], aptitudesSecundarias: ["Estabilidad"], implementos: ["Mancuerna"], video: null, thumbnail: null },
  { id: 7, nombre: "Rotación con banda", tips: "Mantén el core activado.", dificultad: "Intermedio", mecanicas: ["Rotacional"], grupoMuscular: ["Core"], musculosPrincipales: ["Zona media", "Espalda"], aptitudesPrimarias: ["Coordinación", "Estabilidad"], aptitudesSecundarias: ["Fuerza"], implementos: ["Banda"], video: null, thumbnail: null },
  { id: 8, nombre: "Caminata lateral con miniband", tips: "Mantén tensión constante.", dificultad: "Principiante", mecanicas: ["Locomoción"], grupoMuscular: ["Tren Inferior"], musculosPrincipales: ["Glúteos"], aptitudesPrimarias: ["Estabilidad"], aptitudesSecundarias: ["Fuerza", "Coordinación"], implementos: ["Miniband"], video: null, thumbnail: null },
];

interface CreateRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rutina: Rutina, publish: boolean) => void;
  rutina?: Rutina | null;
  defaultTipo?: "rutina" | "programa";
}

const DIFICULTAD_VALUES = { Principiante: 1, Intermedio: 2, Avanzado: 3 };

const CreateRoutineModal = ({ open, onOpenChange, onSave, rutina, defaultTipo = "rutina" }: CreateRoutineModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Rutina>(createEmptyRutina());
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [draggedEjercicio, setDraggedEjercicio] = useState<Ejercicio | null>(null);

  useEffect(() => {
    if (open) {
      if (rutina) {
        setFormData({ ...rutina });
      } else {
        const empty = createEmptyRutina();
        // Apply defaultTipo for new items
        setFormData({ ...empty, tipo: defaultTipo } as Rutina);
      }
      setHasChanges(false);
    }
  }, [open, rutina, defaultTipo]);

  // Get all exercises in routine
  const ejerciciosEnRutina = useMemo(() => {
    const ejercicios: Ejercicio[] = [];
    formData.bloques.forEach((bloque) => {
      bloque.ejercicios.forEach((ej) => {
        if (!ejercicios.find((e) => e.id === ej.ejercicio.id)) {
          ejercicios.push(ej.ejercicio);
        }
      });
    });
    return ejercicios;
  }, [formData.bloques]);

  // Calculate auto difficulty
  const calculatedDificultad = useMemo((): DificultadRutina | null => {
    let totalWeight = 0;
    let weightedSum = 0;

    formData.bloques.forEach((bloque) => {
      const multiplier = bloque.repetirBloque ? bloque.series : 1;
      bloque.ejercicios.forEach((ej) => {
        const time = ej.tipoEjecucion === "tiempo" ? ej.tiempo : ej.repeticiones * 3;
        const weight = time * multiplier;
        totalWeight += weight;
        weightedSum += DIFICULTAD_VALUES[ej.ejercicio.dificultad] * weight;
      });
    });

    if (totalWeight === 0) return null;
    const score = weightedSum / totalWeight;
    if (score < 1.67) return "Principiante";
    if (score <= 2.33) return "Intermedio";
    return "Avanzado";
  }, [formData.bloques]);

  // Calculate auto objective
  const calculateAutoObjetivo = useMemo((): RutinaObjetivo => {
    const scores: RutinaObjetivo = { fuerza: 0, potencia: 0, agilidad: 0, coordinacion: 0, velocidad: 0, estabilidad: 0, movilidad: 0, resistencia: 0 };
    let totalWeight = 0;

    formData.bloques.forEach((bloque) => {
      const multiplier = bloque.repetirBloque ? bloque.series : 1;
      bloque.ejercicios.forEach((ej) => {
        const weight = (ej.tipoEjecucion === "tiempo" ? ej.tiempo : ej.repeticiones * 3) * multiplier;
        totalWeight += weight;
        ej.ejercicio.aptitudesPrimarias.forEach((apt) => {
          const key = apt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") as keyof RutinaObjetivo;
          if (key in scores) scores[key] += weight * 2;
        });
        ej.ejercicio.aptitudesSecundarias.forEach((apt) => {
          const key = apt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") as keyof RutinaObjetivo;
          if (key in scores) scores[key] += weight;
        });
      });
    });

    if (totalWeight > 0) {
      const maxScore = Math.max(...Object.values(scores));
      if (maxScore > 0) APTITUDES_KEYS.forEach((key) => { scores[key] = Math.round((scores[key] / maxScore) * 10); });
    }
    return scores;
  }, [formData.bloques]);

  useEffect(() => {
    if (formData.objetivoMode === "auto") {
      setFormData((prev) => ({ ...prev, objetivo: calculateAutoObjetivo }));
    }
  }, [calculateAutoObjetivo, formData.objetivoMode]);

  useEffect(() => {
    if (formData.dificultadMode === "auto" && calculatedDificultad) {
      setFormData((prev) => ({ ...prev, dificultad: calculatedDificultad }));
    }
  }, [calculatedDificultad, formData.dificultadMode]);

  const updateFormData = <K extends keyof Rutina>(key: K, value: Rutina[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleClose = () => { if (hasChanges) setShowCloseConfirm(true); else onOpenChange(false); };
  const handleConfirmClose = () => { setShowCloseConfirm(false); onOpenChange(false); };

  const addBloque = () => updateFormData("bloques", [...formData.bloques, createEmptyBloque()]);
  const updateBloque = (index: number, bloque: RutinaBloque) => { const newBloques = [...formData.bloques]; newBloques[index] = bloque; updateFormData("bloques", newBloques); };
  const deleteBloque = (index: number) => updateFormData("bloques", formData.bloques.filter((_, i) => i !== index));
  const moveBloque = (index: number, direction: "up" | "down") => { const newBloques = [...formData.bloques]; const newIndex = direction === "up" ? index - 1 : index + 1; [newBloques[index], newBloques[newIndex]] = [newBloques[newIndex], newBloques[index]]; updateFormData("bloques", newBloques); };

  const handleDragStart = (e: React.DragEvent, ejercicio: Ejercicio) => { setDraggedEjercicio(ejercicio); e.dataTransfer.effectAllowed = "copy"; };

  const handleDropOnBloque = (bloqueIndex: number) => {
    if (!draggedEjercicio) return;
    const newEjercicio: RutinaEjercicio = { id: crypto.randomUUID(), ejercicio: draggedEjercicio, tipoEjecucion: "tiempo", tiempo: 30, repeticiones: 10 };
    const newBloques = [...formData.bloques];
    newBloques[bloqueIndex].ejercicios.push(newEjercicio);
    updateFormData("bloques", newBloques);
    setDraggedEjercicio(null);
    toast({ title: "Ejercicio agregado", description: `"${draggedEjercicio.nombre}" agregado al bloque ${bloqueIndex + 1}` });
  };

  const validateForDraft = (): string[] => {
    const errors: string[] = [];
    if (!formData.nombre.trim()) errors.push("El nombre es obligatorio");
    if (!formData.categoria) errors.push("La categoría es obligatoria");
    if (!formData.dificultad) errors.push("La dificultad es obligatoria");
    return errors;
  };

  const validateForPublish = (): string[] => {
    const errors = validateForDraft();
    if (!formData.portadaType) errors.push("La portada es obligatoria para publicar");
    if (formData.bloques.length === 0) errors.push("Debe contener al menos 1 bloque");
    const totalEjercicios = formData.bloques.reduce((sum, b) => sum + b.ejercicios.length, 0);
    if (totalEjercicios === 0) errors.push("Debe contener al menos 1 ejercicio");
    formData.bloques.forEach((bloque, bi) => {
      bloque.ejercicios.forEach((ej, ei) => {
        if (ej.tipoEjecucion === "tiempo" && ej.tiempo <= 0) errors.push(`Bloque ${bi + 1}, Ejercicio ${ei + 1}: tiempo debe ser > 0`);
        if (ej.tipoEjecucion === "repeticiones" && ej.repeticiones <= 0) errors.push(`Bloque ${bi + 1}, Ejercicio ${ei + 1}: repeticiones deben ser > 0`);
      });
      if (bloque.repetirBloque && bloque.series < 2) errors.push(`Bloque ${bi + 1}: si repite, series debe ser >= 2`);
    });
    return errors;
  };

  const handleSaveDraft = () => {
    const errors = validateForDraft();
    if (errors.length > 0) { toast({ title: "Errores de validación", description: errors.join(". "), variant: "destructive" }); return; }
    onSave({ ...formData, estado: "borrador" }, false);
    toast({ title: "Borrador guardado" });
    onOpenChange(false);
  };

  const handlePublish = () => {
    const errors = validateForPublish();
    if (errors.length > 0) { toast({ title: "Errores de validación", description: errors.slice(0, 3).join(". ") + (errors.length > 3 ? ` (+${errors.length - 3} más)` : ""), variant: "destructive" }); return; }
    onSave({ ...formData, estado: "publicada" }, true);
    toast({ title: "Rutina publicada" });
    onOpenChange(false);
  };

  const totalEjercicios = formData.bloques.reduce((sum, b) => sum + b.ejercicios.length, 0);
  const totalTime = formData.bloques.reduce((bSum, bloque) => {
    const bloqueTime = bloque.ejercicios.reduce((eSum, ej) => eSum + (ej.tipoEjecucion === "tiempo" ? ej.tiempo : 30) + bloque.descansoEntreEjercicios, 0);
    return bSum + (bloqueTime * (bloque.repetirBloque ? bloque.series : 1)) + formData.descansoEntreBloques;
  }, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-heading">{rutina ? "Editar Rutina" : "Crear Rutina"}</DialogTitle>
                <Badge variant={formData.estado === "publicada" ? "default" : "secondary"} className="font-normal">{formData.estado === "publicada" ? "Publicada" : "Borrador"}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Dumbbell className="h-4 w-4" /><span>{totalEjercicios} ejercicios</span></div>
                <span>•</span>
                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>~{Math.round(totalTime / 60)} min</span></div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input id="nombre" value={formData.nombre} onChange={(e) => updateFormData("nombre", e.target.value)} placeholder="Nombre de la rutina" className="bg-card border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría *</Label>
                      <Select value={formData.categoria} onValueChange={(v) => updateFormData("categoria", v as Rutina["categoria"])}>
                        <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                        <SelectContent>{CATEGORIAS_RUTINA.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => updateFormData("descripcion", e.target.value)} placeholder="Descripción de la rutina (opcional)" className="bg-card border-border resize-none" rows={2} />
                  </div>

                  {/* Difficulty */}
                  <DifficultySection
                    mode={formData.dificultadMode}
                    dificultad={formData.dificultad}
                    calculatedDificultad={calculatedDificultad}
                    onModeChange={(mode) => { updateFormData("dificultadMode", mode); if (mode === "auto" && calculatedDificultad) updateFormData("dificultad", calculatedDificultad); }}
                    onDificultadChange={(d) => updateFormData("dificultad", d)}
                  />

                  {/* Objective + Radar Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ObjectiveScoring
                      mode={formData.objetivoMode}
                      objetivo={formData.objetivo}
                      onModeChange={(mode) => { updateFormData("objetivoMode", mode); if (mode === "auto") updateFormData("objetivo", calculateAutoObjetivo); }}
                      onObjetivoChange={(obj) => updateFormData("objetivo", obj)}
                    />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Vista previa del perfil</Label>
                      <div className="border border-border rounded-lg p-2 bg-card/50">
                        <ObjectiveRadarChart objetivo={formData.objetivo} />
                      </div>
                    </div>
                  </div>

                  {/* Cover Photo */}
                  <CoverPhotoSection
                    portadaType={formData.portadaType}
                    portadaEjercicioId={formData.portadaEjercicioId}
                    portadaCustomUrl={formData.portadaCustomUrl}
                    ejerciciosEnRutina={ejerciciosEnRutina}
                    onPortadaChange={(type, ejId, customUrl) => {
                      updateFormData("portadaType", type);
                      updateFormData("portadaEjercicioId", ejId);
                      updateFormData("portadaCustomUrl", customUrl);
                    }}
                  />

                  {/* Rest Between Blocks */}
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Label className="text-sm text-muted-foreground">Descanso entre bloques:</Label>
                    <div className="flex items-center gap-1">
                      <Input type="number" min={0} value={formData.descansoEntreBloques} onChange={(e) => updateFormData("descansoEntreBloques", parseInt(e.target.value) || 0)} className="h-8 w-20 text-sm bg-background border-border" />
                      <span className="text-sm text-muted-foreground">segundos</span>
                    </div>
                  </div>

                  {/* Blocks */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Bloques</Label>
                      <Button variant="outline" size="sm" onClick={addBloque} className="gap-1"><Plus className="h-4 w-4" />Agregar bloque</Button>
                    </div>
                    {formData.bloques.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg">
                        <Plus className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-3">No hay bloques aún</p>
                        <Button variant="outline" onClick={addBloque} className="gap-1"><Plus className="h-4 w-4" />Agregar primer bloque</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.bloques.map((bloque, index) => (
                          <BlockEditor key={bloque.id} bloque={bloque} index={index} onUpdate={(b) => updateBloque(index, b)} onDelete={() => deleteBloque(index)} onMoveUp={() => moveBloque(index, "up")} onMoveDown={() => moveBloque(index, "down")} canMoveUp={index > 0} canMoveDown={index < formData.bloques.length - 1} onDrop={() => handleDropOnBloque(index)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20">
                <Button variant="ghost" onClick={handleClose} className="gap-1"><X className="h-4 w-4" />Cancelar</Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} className="gap-1"><Save className="h-4 w-4" />Guardar como borrador</Button>
                  <Button onClick={handlePublish} className="gap-1"><Send className="h-4 w-4" />Guardar y publicar</Button>
                </div>
              </div>
            </div>

            <div className="w-[320px] border-l border-border bg-muted/10">
              <ExerciseLibraryMini ejercicios={ejerciciosIniciales} onDragStart={handleDragStart} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tienes cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>¿Quieres salir sin guardar los cambios?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Salir sin guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateRoutineModal;
