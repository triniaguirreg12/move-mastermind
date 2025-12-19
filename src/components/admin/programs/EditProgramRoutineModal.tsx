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
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ObjectiveRadarChart from "@/components/admin/routines/ObjectiveRadarChart";
import {
  RutinaObjetivo,
  APTITUDES_KEYS,
  APTITUDES_LABELS,
  createEmptyObjetivo,
  DIFICULTADES_RUTINA,
  type DificultadRutina,
} from "@/components/admin/routines/types";
import type { Json } from "@/integrations/supabase/types";

interface ProgramRoutineCustomData {
  nombre?: string;
  descripcion?: string;
  dificultad?: string;
  objetivo?: RutinaObjetivo;
  descanso_entre_bloques?: number;
  // Block-level customizations could be added here
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
  
  // Fetch the original routine data
  const { data: originalRoutine, isLoading } = useQuery({
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

  const [customData, setCustomData] = useState<ProgramRoutineCustomData>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (open && originalRoutine) {
      const parsed = currentCustomData as ProgramRoutineCustomData | null;
      setCustomData(parsed || {});
      setHasChanges(false);
    }
  }, [open, originalRoutine, currentCustomData]);

  // Get effective values (custom or original)
  const getEffectiveValue = <T,>(field: keyof ProgramRoutineCustomData, originalValue: T): T => {
    const customValue = customData[field];
    return customValue !== undefined ? (customValue as T) : originalValue;
  };

  const handleFieldChange = <K extends keyof ProgramRoutineCustomData>(
    field: K,
    value: ProgramRoutineCustomData[K]
  ) => {
    setCustomData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
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
    setHasChanges(true);
  };

  const resetAllChanges = () => {
    setCustomData({});
    setHasChanges(true);
  };

  const handleSave = () => {
    // Only save non-empty customizations
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

    onSave(Object.keys(cleanCustomData).length > 0 ? cleanCustomData : {});
    toast({
      title: "Cambios guardados",
      description: "La rutina dentro del programa ha sido actualizada",
    });
    onOpenChange(false);
  };

  const hasAnyCustomization = Object.keys(customData).length > 0;

  if (isLoading || !originalRoutine) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
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

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Alert about isolated changes */}
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700">Edición aislada</p>
                <p className="text-amber-600/80 mt-0.5">
                  Estos cambios SOLO aplican a esta rutina dentro de este programa. 
                  La rutina original en la biblioteca no será modificada.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="nombre">Nombre de la rutina</Label>
                {customData.nombre !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => resetField("nombre")}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restaurar
                  </Button>
                )}
              </div>
              <Input
                id="nombre"
                value={effectiveNombre}
                onChange={(e) => handleFieldChange("nombre", e.target.value)}
                placeholder="Nombre de la rutina"
                className={`bg-card border-border ${customData.nombre !== undefined ? "ring-2 ring-amber-500/30" : ""}`}
              />
              {customData.nombre === undefined && (
                <p className="text-xs text-muted-foreground">Original: {originalRoutine.nombre}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="descripcion">Descripción</Label>
                {customData.descripcion !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => resetField("descripcion")}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restaurar
                  </Button>
                )}
              </div>
              <Textarea
                id="descripcion"
                value={effectiveDescripcion}
                onChange={(e) => handleFieldChange("descripcion", e.target.value)}
                placeholder="Descripción de la rutina"
                className={`bg-card border-border resize-none ${customData.descripcion !== undefined ? "ring-2 ring-amber-500/30" : ""}`}
                rows={3}
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Dificultad</Label>
                {customData.dificultad !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => resetField("dificultad")}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restaurar
                  </Button>
                )}
              </div>
              <Select
                value={effectiveDificultad}
                onValueChange={(value) => handleFieldChange("dificultad", value)}
              >
                <SelectTrigger className={`bg-card border-border ${customData.dificultad !== undefined ? "ring-2 ring-amber-500/30" : ""}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFICULTADES_RUTINA.map((dif) => (
                    <SelectItem key={dif} value={dif}>
                      {dif}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customData.dificultad === undefined && (
                <p className="text-xs text-muted-foreground">Original: {originalRoutine.dificultad}</p>
              )}
            </div>

            {/* Rest between blocks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descanso entre bloques (segundos)</Label>
                {customData.descanso_entre_bloques !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => resetField("descanso_entre_bloques")}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restaurar
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[effectiveDescanso]}
                  onValueChange={([value]) => handleFieldChange("descanso_entre_bloques", value)}
                  min={0}
                  max={180}
                  step={5}
                  className={`flex-1 ${customData.descanso_entre_bloques !== undefined ? "[&_[role=slider]]:ring-2 [&_[role=slider]]:ring-amber-500/30" : ""}`}
                />
                <span className="text-sm font-medium w-12 text-right">{effectiveDescanso}s</span>
              </div>
            </div>

            {/* Objetivos / Aptitudes */}
            {originalRoutine.categoria !== "Activación" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Aptitudes físicas</Label>
                  {customData.objetivo !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground"
                      onClick={() => resetField("objetivo")}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restaurar
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Radar Chart */}
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-[200px]">
                      <ObjectiveRadarChart objetivo={effectiveObjetivo} />
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3">
                    {APTITUDES_KEYS.map((key) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{APTITUDES_LABELS[key]}</span>
                          <span className="font-medium">{effectiveObjetivo[key]}</span>
                        </div>
                        <Slider
                          value={[effectiveObjetivo[key]]}
                          onValueChange={([value]) => handleObjetivoChange(key, value)}
                          min={0}
                          max={10}
                          step={1}
                          className="h-2"
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
          <div className="flex items-center gap-2">
            {hasAnyCustomization && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllChanges}
                className="text-muted-foreground"
              >
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
