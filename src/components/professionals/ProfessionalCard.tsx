import { Button } from "@/components/ui/button";
import { MapPin, Award, Calendar } from "lucide-react";
import { Professional } from "@/hooks/useProfessionals";

interface ProfessionalCardProps {
  professional: Professional;
  onSchedule?: () => void;
}

export function ProfessionalCard({
  professional,
  onSchedule,
}: ProfessionalCardProps) {
  const { name, title, specialty, description, avatar_url } = professional;
  
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted">
            {avatar_url ? (
              <img
                src={avatar_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground font-display font-bold text-2xl">
                {name.charAt(0)}
              </div>
            )}
          </div>
          {/* Available indicator */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-card" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground text-lg">{name}</h3>
          <p className="text-accent text-sm font-medium">{title}</p>
          {specialty && (
            <p className="text-muted-foreground text-sm mt-1">{specialty}</p>
          )}
        </div>
      </div>

      {/* Action */}
      <Button
        variant="accent"
        className="w-full gap-2"
        onClick={onSchedule}
      >
        <Calendar className="w-4 h-4" />
        Solicitar Programa Personalizado
      </Button>
    </div>
  );
}
