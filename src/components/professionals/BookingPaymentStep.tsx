import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, CreditCard, Calendar, Clock, User, Loader2, CheckCircle } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Professional } from "@/hooks/useProfessionals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingPaymentStepProps {
  professional: Professional;
  appointmentId: string;
  selectedDate: Date;
  selectedTime: string;
  onComplete: (meetLink?: string) => void;
  onBack: () => void;
  onClose: () => void;
}

const PRICE_CLP = 45000;
const PRICE_USD = 50;

type PaymentMethod = 'mercadopago' | 'paypal';

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
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');

  // Detect user country for payment routing
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // First try to get from user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('country')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.country) {
            setUserCountry(profile.country);
            setPaymentMethod(profile.country.toLowerCase() === 'chile' ? 'mercadopago' : 'paypal');
            return;
          }
        }
        
        // Fallback to geolocation API
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          setUserCountry(data.country_name);
          setPaymentMethod(data.country_code === 'CL' ? 'mercadopago' : 'paypal');
        }
      } catch (error) {
        console.error('Error detecting country:', error);
        // Default to MercadoPago
        setPaymentMethod('mercadopago');
      }
    };
    
    detectCountry();
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const successUrl = `${window.location.origin}/profesionales?payment=success&appointment=${appointmentId}`;
      const cancelUrl = `${window.location.origin}/profesionales?payment=cancelled&appointment=${appointmentId}`;
      
      const { data, error } = await supabase.functions.invoke('appointment-payment-create', {
        body: {
          appointmentId,
          paymentMethod,
          successUrl,
          cancelUrl
        }
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        // Redirect to payment provider
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Error al procesar el pago. Inténtalo de nuevo.");
      setIsProcessing(false);
    }
  };

  const formatPrice = () => {
    if (paymentMethod === 'paypal') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(PRICE_USD);
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(PRICE_CLP);
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
                {formatPrice()}
              </span>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="bg-card border-border p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground">Método de pago</h3>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              {paymentMethod === 'mercadopago' ? (
                <span className="text-white font-bold text-xs">MP</span>
              ) : (
                <span className="text-white font-bold text-xs">PP</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'PayPal'}
              </p>
              <p className="text-sm text-muted-foreground">
                {paymentMethod === 'mercadopago' 
                  ? 'Tarjeta, transferencia o efectivo'
                  : 'Tarjeta o cuenta PayPal'
                }
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-success" />
          </div>

          {userCountry && (
            <p className="text-xs text-muted-foreground text-center">
              Detectamos que estás en {userCountry}
            </p>
          )}
        </Card>

        {/* Security Note */}
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Pago 100% seguro</p>
            <p className="text-muted-foreground">
              La cita se confirma automáticamente al completar el pago. Recibirás un link de Google Meet para tu sesión.
            </p>
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
              Redirigiendo al pago...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pagar {formatPrice()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
