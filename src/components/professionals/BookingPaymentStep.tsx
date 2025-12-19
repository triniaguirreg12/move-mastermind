import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, CreditCard, Calendar, Clock, User, Loader2, CheckCircle } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Professional, useConfirmAppointmentPayment } from "@/hooks/useProfessionals";
import { toast } from "sonner";

interface BookingPaymentStepProps {
  professional: Professional;
  appointmentId: string;
  selectedDate: Date;
  selectedTime: string;
  onComplete: () => void;
  onBack: () => void;
  onClose: () => void;
}

const APPOINTMENT_PRICE = 35000; // CLP

export function BookingPaymentStep({ 
  professional, 
  appointmentId,
  selectedDate, 
  selectedTime,
  onComplete, 
  onBack, 
  onClose 
}: BookingPaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const confirmPayment = useConfirmAppointmentPayment();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing (in production, integrate with Stripe or payment provider)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await confirmPayment.mutateAsync({
        appointmentId,
        paymentId: `PAY_${Date.now()}`,
        professionalId: professional.id,
        professionalName: professional.name,
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime + ':00',
        endTime: format(addMinutes(parse(selectedTime, 'HH:mm', new Date()), 60), 'HH:mm:ss')
      });
      
      toast.success("¡Pago realizado con éxito!");
      onComplete();
    } catch (error) {
      toast.error("Error al procesar el pago. Inténtalo de nuevo.");
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm text-muted-foreground">Paso 3 de 3</span>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Confirma tu cita
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Revisa los detalles y realiza el pago
        </p>
      </div>

      {/* Payment Content */}
      <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto pb-32">
        {/* Appointment Summary */}
        <Card className="bg-card border-border p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground">Resumen de la cita</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{professional.name}</p>
                <p className="text-sm text-muted-foreground">{professional.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>{format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
            
            <div className="flex items-center gap-3 text-foreground">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span>{selectedTime} hrs (60 min)</span>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sesión personalizada</span>
              <span className="font-display font-bold text-xl text-foreground">
                {formatPrice(APPOINTMENT_PRICE)}
              </span>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="bg-card border-border p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground">Método de pago</h3>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Tarjeta de crédito o débito</p>
              <p className="text-sm text-muted-foreground">Pago seguro con cifrado SSL</p>
            </div>
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
        </Card>

        {/* Security Note */}
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Pago 100% seguro</p>
            <p className="text-muted-foreground">Tu información de pago está protegida con los más altos estándares de seguridad.</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-lg border-t border-border">
        <Button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full h-12 text-base font-semibold gap-2"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando pago...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pagar y confirmar cita
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
