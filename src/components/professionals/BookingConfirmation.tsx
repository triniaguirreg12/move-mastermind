import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, User, Home, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Professional } from "@/hooks/useProfessionals";
import { useNavigate } from "react-router-dom";

interface BookingConfirmationProps {
  professional: Professional;
  selectedDate: Date;
  selectedTime: string;
  onClose: () => void;
}

export function BookingConfirmation({ 
  professional, 
  selectedDate, 
  selectedTime,
  onClose 
}: BookingConfirmationProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onClose();
    navigate('/');
  };

  const handleGoCalendar = () => {
    onClose();
    navigate('/calendario');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 px-6 py-12 flex flex-col items-center justify-center space-y-8">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center animate-scale-in">
          <CheckCircle className="w-12 h-12 text-success animate-fade-in" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-display text-2xl font-bold text-foreground">
            ¡Tu cita quedó agendada!
          </h2>
          <p className="text-muted-foreground">
            Te hemos enviado un correo con los detalles de tu sesión.
          </p>
        </div>

        {/* Appointment Card */}
        <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Card className="bg-card border-border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">{professional.name}</p>
                <p className="text-sm text-muted-foreground">{professional.title}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{format(selectedDate, "d MMM yyyy", { locale: es })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedTime} hrs</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Note */}
        <p className="text-sm text-muted-foreground text-center max-w-xs animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Tu cita aparecerá en tu calendario y recibirás un recordatorio antes de la sesión.
        </p>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="p-6 bg-background border-t border-border space-y-3">
        <Button 
          onClick={handleGoCalendar}
          className="w-full h-12 text-base font-semibold gap-2"
          size="lg"
        >
          <CalendarDays className="w-5 h-5" />
          Ver en calendario
        </Button>
        <Button 
          onClick={handleGoHome}
          variant="outline"
          className="w-full h-12 text-base font-semibold gap-2 border-border"
          size="lg"
        >
          <Home className="w-5 h-5" />
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
