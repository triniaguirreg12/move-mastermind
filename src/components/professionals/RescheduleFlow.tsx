import { Professional } from "@/hooks/useProfessionals";
import { RescheduleCalendarStep } from "./RescheduleCalendarStep";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface RescheduleFlowProps {
  professional: Professional;
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RescheduleFlow({ professional, appointmentId, isOpen, onClose }: RescheduleFlowProps) {
  const handleComplete = () => {
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <RescheduleCalendarStep 
            professional={professional}
            appointmentId={appointmentId}
            onComplete={handleComplete}
            onClose={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}