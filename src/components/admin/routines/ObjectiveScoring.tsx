import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, PenLine } from "lucide-react";
import { RutinaObjetivo, APTITUDES_KEYS, APTITUDES_LABELS } from "./types";

interface ObjectiveScoringProps {
  mode: "manual" | "auto";
  objetivo: RutinaObjetivo;
  onModeChange: (mode: "manual" | "auto") => void;
  onObjetivoChange: (objetivo: RutinaObjetivo) => void;
  disabled?: boolean;
}

const ObjectiveScoring = ({
  mode,
  objetivo,
  onModeChange,
  onObjetivoChange,
  disabled = false,
}: ObjectiveScoringProps) => {
  const handleValueChange = (key: keyof RutinaObjetivo, value: string) => {
    const numValue = Math.min(10, Math.max(0, parseInt(value) || 0));
    onObjetivoChange({
      ...objetivo,
      [key]: numValue,
    });
  };

  const totalScore = APTITUDES_KEYS.reduce((sum, key) => sum + objetivo[key], 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">Objetivo (aptitudes físicas)</Label>
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

      {mode === "auto" && (
        <p className="text-xs text-muted-foreground">
          Los valores se calculan automáticamente según los ejercicios y tiempos. Puedes ajustarlos manualmente si es necesario.
        </p>
      )}

      <div className="grid grid-cols-4 gap-3">
        {APTITUDES_KEYS.map((key) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{APTITUDES_LABELS[key]}</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={10}
                value={objetivo[key]}
                onChange={(e) => handleValueChange(key, e.target.value)}
                disabled={disabled}
                className="h-9 text-center bg-card border-border pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                /10
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">Puntuación total:</span>
        <Badge variant="outline" className="font-mono">
          {totalScore}/80
        </Badge>
      </div>
    </div>
  );
};

export default ObjectiveScoring;
