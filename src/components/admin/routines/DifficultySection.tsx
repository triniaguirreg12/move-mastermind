import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, PenLine, Gauge } from "lucide-react";
import { DificultadRutina, DIFICULTADES_RUTINA } from "./types";

interface DifficultySectionProps {
  mode: "manual" | "auto";
  dificultad: DificultadRutina | "";
  calculatedDificultad: DificultadRutina | null;
  onModeChange: (mode: "manual" | "auto") => void;
  onDificultadChange: (dificultad: DificultadRutina) => void;
}

const getDifficultyColor = (dificultad: string) => {
  switch (dificultad) {
    case "Principiante":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Intermedio":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Avanzado":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const DifficultySection = ({
  mode,
  dificultad,
  calculatedDificultad,
  onModeChange,
  onDificultadChange,
}: DifficultySectionProps) => {
  const displayDificultad = mode === "auto" ? calculatedDificultad : dificultad;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Dificultad de la rutina
        </Label>
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as "manual" | "auto")}>
          <TabsList className="h-8">
            <TabsTrigger value="auto" className="text-xs gap-1 h-7 px-2">
              <Sparkles className="h-3 w-3" />
              Auto
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs gap-1 h-7 px-2">
              <PenLine className="h-3 w-3" />
              Manual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === "auto" ? (
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">Dificultad calculada:</span>
          {calculatedDificultad ? (
            <Badge variant="outline" className={getDifficultyColor(calculatedDificultad)}>
              {calculatedDificultad}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              Agrega ejercicios para calcular
            </span>
          )}
          <p className="text-xs text-muted-foreground ml-auto">
            Basado en la dificultad de los ejercicios
          </p>
        </div>
      ) : (
        <Select
          value={dificultad}
          onValueChange={(v) => onDificultadChange(v as DificultadRutina)}
        >
          <SelectTrigger className="bg-card border-border">
            <SelectValue placeholder="Seleccionar dificultad" />
          </SelectTrigger>
          <SelectContent>
            {DIFICULTADES_RUTINA.map((d) => (
              <SelectItem key={d} value={d}>
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    d === "Principiante" ? "bg-green-500" :
                    d === "Intermedio" ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                  {d}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default DifficultySection;
