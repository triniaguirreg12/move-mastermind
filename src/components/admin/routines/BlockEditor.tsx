import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  GripVertical,
  Clock,
  Repeat,
  Plus,
  Dumbbell,
} from "lucide-react";
import { RutinaBloque, RutinaEjercicio } from "./types";
import { Ejercicio } from "@/components/admin/CreateExerciseModal";

interface BlockEditorProps {
  bloque: RutinaBloque;
  index: number;
  onUpdate: (bloque: RutinaBloque) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDrop: (e: React.DragEvent) => void;
}

const BlockEditor = ({
  bloque,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDrop,
}: BlockEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e);
  };

  const updateEjercicio = (ejIndex: number, updates: Partial<RutinaEjercicio>) => {
    const newEjercicios = [...bloque.ejercicios];
    newEjercicios[ejIndex] = { ...newEjercicios[ejIndex], ...updates };
    onUpdate({ ...bloque, ejercicios: newEjercicios });
  };

  const removeEjercicio = (ejIndex: number) => {
    const newEjercicios = bloque.ejercicios.filter((_, i) => i !== ejIndex);
    onUpdate({ ...bloque, ejercicios: newEjercicios });
  };

  const moveEjercicio = (ejIndex: number, direction: "up" | "down") => {
    const newEjercicios = [...bloque.ejercicios];
    const newIndex = direction === "up" ? ejIndex - 1 : ejIndex + 1;
    [newEjercicios[ejIndex], newEjercicios[newIndex]] = [newEjercicios[newIndex], newEjercicios[ejIndex]];
    onUpdate({ ...bloque, ejercicios: newEjercicios });
  };

  const totalTime = bloque.ejercicios.reduce((sum, ej) => {
    if (ej.tipoEjecucion === "tiempo") {
      return sum + ej.tiempo + (ej.descansoOverride ?? bloque.descansoEntreEjercicios);
    }
    return sum + 30 + (ej.descansoOverride ?? bloque.descansoEntreEjercicios); // estimate 30s for reps
  }, 0) * (bloque.repetirBloque ? bloque.series : 1);

  return (
    <Card
      className={`border transition-all ${isDragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Block Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <Badge variant="outline" className="font-mono text-xs">
          Bloque {index + 1}
        </Badge>

        <Input
          placeholder="Nombre del bloque (opcional)"
          value={bloque.nombre}
          onChange={(e) => onUpdate({ ...bloque, nombre: e.target.value })}
          className="h-8 flex-1 max-w-[200px] text-sm bg-background border-border"
        />

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Dumbbell className="h-3 w-3" />
            <span>{bloque.ejercicios.length}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>~{Math.round(totalTime / 60)}min</span>
          </div>
          {bloque.repetirBloque && (
            <Badge variant="secondary" className="text-xs">
              <Repeat className="h-3 w-3 mr-1" />
              {bloque.series}x
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-4">
          {/* Block Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Descanso entre ejercicios</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  value={bloque.descansoEntreEjercicios}
                  onChange={(e) => onUpdate({ ...bloque, descansoEntreEjercicios: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm bg-background border-border"
                />
                <span className="text-xs text-muted-foreground">seg</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                <Switch
                  checked={bloque.repetirBloque}
                  onCheckedChange={(checked) => onUpdate({ ...bloque, repetirBloque: checked, series: checked ? Math.max(2, bloque.series) : 1 })}
                />
                Repetir bloque
              </Label>
              {bloque.repetirBloque && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={2}
                    value={bloque.series}
                    onChange={(e) => onUpdate({ ...bloque, series: Math.max(2, parseInt(e.target.value) || 2) })}
                    className="h-8 text-sm bg-background border-border w-20"
                  />
                  <span className="text-xs text-muted-foreground">series</span>
                </div>
              )}
            </div>

            {bloque.repetirBloque && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <Switch
                      checked={bloque.usarMismoDescanso}
                      onCheckedChange={(checked) => onUpdate({ ...bloque, usarMismoDescanso: checked })}
                    />
                    Mismo descanso entre series
                  </Label>
                </div>

                {!bloque.usarMismoDescanso && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descanso entre series</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={bloque.descansoEntreSeries}
                        onChange={(e) => onUpdate({ ...bloque, descansoEntreSeries: parseInt(e.target.value) || 0 })}
                        className="h-8 text-sm bg-background border-border"
                      />
                      <span className="text-xs text-muted-foreground">seg</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Exercises List */}
          <div className="space-y-2">
            {bloque.ejercicios.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg transition-all ${
                  isDragOver ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Arrastra ejercicios aquí</p>
              </div>
            ) : (
              bloque.ejercicios.map((ej, ejIndex) => (
                <div
                  key={ej.id}
                  className="flex items-center gap-2 p-2 bg-background border border-border rounded-lg group"
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => moveEjercicio(ejIndex, "up")}
                      disabled={ejIndex === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => moveEjercicio(ejIndex, "down")}
                      disabled={ejIndex === bloque.ejercicios.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                    {ejIndex + 1}
                  </Badge>

                  {ej.ejercicio.thumbnail ? (
                    <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                      <img
                        src={ej.ejercicio.thumbnail}
                        alt={ej.ejercicio.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ej.ejercicio.nombre}</p>
                    <div className="flex flex-wrap gap-1">
                      {ej.ejercicio.aptitudesPrimarias.slice(0, 2).map((a) => (
                        <Badge key={a} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Select
                    value={ej.tipoEjecucion}
                    onValueChange={(v) => updateEjercicio(ejIndex, { tipoEjecucion: v as "tiempo" | "repeticiones" })}
                  >
                    <SelectTrigger className="h-8 w-[100px] text-xs bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiempo">Tiempo</SelectItem>
                      <SelectItem value="repeticiones">Reps</SelectItem>
                    </SelectContent>
                  </Select>

                  {ej.tipoEjecucion === "tiempo" ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={ej.tiempo}
                        onChange={(e) => updateEjercicio(ejIndex, { tiempo: parseInt(e.target.value) || 0 })}
                        className="h-8 w-16 text-sm text-center bg-card border-border"
                      />
                      <span className="text-xs text-muted-foreground">seg</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={ej.repeticiones}
                        onChange={(e) => updateEjercicio(ejIndex, { repeticiones: parseInt(e.target.value) || 0 })}
                        className="h-8 w-16 text-sm text-center bg-card border-border"
                      />
                      <span className="text-xs text-muted-foreground">reps</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeEjercicio(ejIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {isDragOver && bloque.ejercicios.length > 0 && (
            <div className="flex items-center justify-center py-2 border-2 border-dashed border-primary rounded-lg bg-primary/10">
              <p className="text-xs text-primary">Soltar aquí para agregar</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default BlockEditor;
