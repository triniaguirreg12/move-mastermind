import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, User, Home, CalendarDays, Video, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Professional } from "@/hooks/useProfessionals";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface BookingConfirmationProps {
  professional: Professional;
  selectedDate: Date;
  selectedTime: string;
  appointmentId?: string;
  onClose: () => void;
}

export function BookingConfirmation({ 
  professional, 
  selectedDate, 
  selectedTime,
  appointmentId,
  onClose 
}: BookingConfirmationProps) {
  const navigate = useNavigate();
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Meet link from appointment
  useEffect(() => {
    const fetchMeetLink = async () => {
      if (!appointmentId) {
        setIsLoading(false);
        return;
      }

      try {
        // Poll for Meet link (it's created async by webhook)
        let attempts = 0;
        const maxAttempts = 10;
        
        const poll = async () => {
          const { data, error } = await supabase
            .from('appointments')
            .select('google_meet_link, status')
            .eq('id', appointmentId)
            .single();

          if (error) {
            console.error('Error fetching appointment:', error);
            setIsLoading(false);
            return;
          }

          if (data?.google_meet_link) {
            setMeetLink(data.google_meet_link);
            setIsLoading(false);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            setIsLoading(false);
          }
        };

        poll();
      } catch (error) {
        console.error('Error fetching meet link:', error);
        setIsLoading(false);
      }
    };

    fetchMeetLink();
  }, [appointmentId]);

  const handleGoHome = () => {
    onClose();
    navigate('/');
  };

  const handleGoCalendar = () => {
    onClose();
    navigate('/calendario');
  };

  const handleOpenMeet = () => {
    if (meetLink) {
      window.open(meetLink, '_blank');
    }
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
            El pago fue exitoso. Te hemos enviado un correo con los detalles de tu sesión.
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

            {/* Google Meet Link */}
            <div className="pt-3 border-t border-border">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generando link de Google Meet...</span>
                </div>
              ) : meetLink ? (
                <button 
                  onClick={handleOpenMeet}
                  className="w-full flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground text-sm">Google Meet</p>
                      <p className="text-xs text-muted-foreground">Enlace para tu sesión virtual</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="flex items-center gap-2 py-3 text-muted-foreground">
                  <Video className="w-4 h-4" />
                  <span className="text-sm">El enlace de Meet será enviado a tu correo</span>
                </div>
              )}
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
