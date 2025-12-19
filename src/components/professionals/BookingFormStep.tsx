import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight } from "lucide-react";
import { Professional, AppointmentFormData } from "@/hooks/useProfessionals";

interface BookingFormStepProps {
  professional: Professional;
  onComplete: (data: AppointmentFormData) => void;
  onClose: () => void;
}

const EQUIPMENT_OPTIONS = [
  "Sin implementos",
  "Mancuernas",
  "Bandas",
  "Miniband",
  "Kettlebell",
  "Barra",
  "Colchoneta",
  "Foam Roller"
];

export function BookingFormStep({ professional, onComplete, onClose }: BookingFormStepProps) {
  const [consultationGoal, setConsultationGoal] = useState("");
  const [injuryCondition, setInjuryCondition] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [additionalComments, setAdditionalComments] = useState("");
  const [errors, setErrors] = useState<{ goal?: string; injury?: string }>({});

  const toggleEquipment = (item: string) => {
    if (item === "Sin implementos") {
      setSelectedEquipment(["Sin implementos"]);
    } else {
      setSelectedEquipment(prev => {
        const filtered = prev.filter(e => e !== "Sin implementos");
        if (filtered.includes(item)) {
          return filtered.filter(e => e !== item);
        }
        return [...filtered, item];
      });
    }
  };

  const handleSubmit = () => {
    const newErrors: { goal?: string; injury?: string } = {};
    
    if (!consultationGoal.trim()) {
      newErrors.goal = "Este campo es obligatorio";
    }
    if (!injuryCondition.trim()) {
      newErrors.injury = "Este campo es obligatorio";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onComplete({
      consultation_goal: consultationGoal.trim(),
      injury_condition: injuryCondition.trim(),
      available_equipment: selectedEquipment,
      additional_comments: additionalComments.trim() || undefined
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm text-muted-foreground">Paso 1 de 3</span>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Antes de agendar, cuéntanos un poco sobre ti
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Con {professional.name}
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto pb-32">
        {/* Consultation Goal */}
        <div className="space-y-2">
          <Label htmlFor="goal" className="text-foreground font-medium">
            Objetivo de la consulta <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            Ej: Rendimiento deportivo, prevención de lesiones, dolor específico, reintegro al entrenamiento
          </p>
          <Textarea
            id="goal"
            value={consultationGoal}
            onChange={(e) => {
              setConsultationGoal(e.target.value);
              setErrors(prev => ({ ...prev, goal: undefined }));
            }}
            placeholder="Describe el objetivo de tu consulta..."
            className={`min-h-[100px] bg-card border-border ${errors.goal ? 'border-destructive' : ''}`}
          />
          {errors.goal && <p className="text-xs text-destructive">{errors.goal}</p>}
        </div>

        {/* Injury/Condition */}
        <div className="space-y-2">
          <Label htmlFor="injury" className="text-foreground font-medium">
            ¿Tienes alguna lesión o condición física? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="injury"
            value={injuryCondition}
            onChange={(e) => {
              setInjuryCondition(e.target.value);
              setErrors(prev => ({ ...prev, injury: undefined }));
            }}
            placeholder="Describe cualquier lesión, dolor o condición física relevante..."
            className={`min-h-[100px] bg-card border-border ${errors.injury ? 'border-destructive' : ''}`}
          />
          {errors.injury && <p className="text-xs text-destructive">{errors.injury}</p>}
        </div>

        {/* Equipment */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            Implementos con los que cuentas
          </Label>
          <p className="text-xs text-muted-foreground">
            Selecciona los implementos que tienes disponibles (opcional)
          </p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((item) => (
              <Badge
                key={item}
                variant={selectedEquipment.includes(item) ? "default" : "outline"}
                className={`cursor-pointer transition-all px-3 py-1.5 ${
                  selectedEquipment.includes(item)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted border-border"
                }`}
                onClick={() => toggleEquipment(item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Additional Comments */}
        <div className="space-y-2">
          <Label htmlFor="comments" className="text-foreground font-medium">
            Comentarios adicionales
          </Label>
          <Textarea
            id="comments"
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            placeholder="Cualquier información adicional que quieras compartir..."
            className="min-h-[80px] bg-card border-border"
          />
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-lg border-t border-border">
        <Button 
          onClick={handleSubmit}
          className="w-full h-12 text-base font-semibold gap-2"
          size="lg"
        >
          Continuar a agenda
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
