import { Button } from "@/components/ui/button";
import { MapPin, Award } from "lucide-react";

interface ProfessionalCardProps {
  name: string;
  title: string;
  specialty: string;
  experience: string;
  location?: string;
  imageUrl?: string;
  available?: boolean;
  onSchedule?: () => void;
}

export function ProfessionalCard({
  name,
  title,
  specialty,
  experience,
  location,
  imageUrl,
  available = true,
  onSchedule,
}: ProfessionalCardProps) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground font-display font-bold text-2xl">
                {name.charAt(0)}
              </div>
            )}
          </div>
          {available && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-card" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground text-lg">{name}</h3>
          <p className="text-accent text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-sm mt-1">{specialty}</p>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-warning" />
          <span>{experience}</span>
        </div>
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <Button
        variant="accent"
        className="w-full"
        onClick={onSchedule}
      >
        Revisar disponibilidad
      </Button>
    </div>
  );
}
