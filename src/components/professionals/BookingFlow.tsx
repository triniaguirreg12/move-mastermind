import { useState } from "react";
import { Professional, AppointmentFormData } from "@/hooks/useProfessionals";
import { BookingFormStep } from "./BookingFormStep";
import { BookingCalendarStep } from "./BookingCalendarStep";
import { BookingPaymentStep } from "./BookingPaymentStep";
import { BookingConfirmation } from "./BookingConfirmation";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const [currentStep, setCurrentStep] = useState<BookingStep>('form');
  const [bookingData, setBookingData] = useState<BookingData>({
    formData: null,
    selectedDate: null,
    selectedTime: null,
    appointmentId: null
  });

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

  const handlePaymentComplete = () => {
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
              onClose={handleClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
