import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Professional, AppointmentFormData } from "@/hooks/useProfessionals";
import { BookingFormStep } from "./BookingFormStep";
import { BookingCalendarStep } from "./BookingCalendarStep";
import { BookingPaymentStep } from "./BookingPaymentStep";
import { BookingConfirmation } from "./BookingConfirmation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingFlowProps {
  professional: Professional;
  isOpen: boolean;
  onClose: () => void;
}

export type BookingStep = 'form' | 'calendar' | 'payment' | 'confirmation';

export interface BookingData {
  formData: AppointmentFormData | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  appointmentId: string | null;
}

export function BookingFlow({ professional, isOpen, onClose }: BookingFlowProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<BookingStep>('form');
  const [bookingData, setBookingData] = useState<BookingData>({
    formData: null,
    selectedDate: null,
    selectedTime: null,
    appointmentId: null
  });

  // Handle payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const appointmentId = searchParams.get('appointment');

    if (paymentStatus && appointmentId) {
      if (paymentStatus === 'success') {
        // Fetch appointment details and show confirmation
        fetchAppointmentAndShowConfirmation(appointmentId);
      } else if (paymentStatus === 'cancelled') {
        toast.error("El pago fue cancelado. Puedes intentarlo de nuevo.");
      }
      // Clear query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchAppointmentAndShowConfirmation = async (appointmentId: string) => {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('appointment_date, start_time')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      setBookingData({
        formData: null,
        selectedDate: new Date(appointment.appointment_date + 'T00:00:00'),
        selectedTime: appointment.start_time.slice(0, 5),
        appointmentId
      });
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error("Error al cargar los detalles de la cita.");
    }
  };

  const handleFormComplete = (formData: AppointmentFormData) => {
    setBookingData(prev => ({ ...prev, formData }));
    setCurrentStep('calendar');
  };

  const handleCalendarComplete = (date: Date, time: string, appointmentId: string) => {
    setBookingData(prev => ({ 
      ...prev, 
      selectedDate: date, 
      selectedTime: time,
      appointmentId 
    }));
    setCurrentStep('payment');
  };

  const handlePaymentComplete = (meetLink?: string) => {
    setCurrentStep('confirmation');
  };

  const handleClose = () => {
    // Reset state when closing
    setCurrentStep('form');
    setBookingData({
      formData: null,
      selectedDate: null,
      selectedTime: null,
      appointmentId: null
    });
    onClose();
  };

  const handleBack = () => {
    if (currentStep === 'calendar') {
      setCurrentStep('form');
    } else if (currentStep === 'payment') {
      setCurrentStep('calendar');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {currentStep === 'form' && (
            <BookingFormStep 
              professional={professional}
              onComplete={handleFormComplete}
              onClose={handleClose}
            />
          )}
          
          {currentStep === 'calendar' && bookingData.formData && (
            <BookingCalendarStep 
              professional={professional}
              formData={bookingData.formData}
              onComplete={handleCalendarComplete}
              onBack={handleBack}
              onClose={handleClose}
            />
          )}
          
          {currentStep === 'payment' && bookingData.appointmentId && bookingData.selectedDate && bookingData.selectedTime && (
            <BookingPaymentStep 
              professional={professional}
              appointmentId={bookingData.appointmentId}
              selectedDate={bookingData.selectedDate}
              selectedTime={bookingData.selectedTime}
              onComplete={handlePaymentComplete}
              onBack={handleBack}
              onClose={handleClose}
            />
          )}
          
          {currentStep === 'confirmation' && bookingData.selectedDate && bookingData.selectedTime && (
            <BookingConfirmation 
              professional={professional}
              selectedDate={bookingData.selectedDate}
              selectedTime={bookingData.selectedTime}
              appointmentId={bookingData.appointmentId || undefined}
              onClose={handleClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
