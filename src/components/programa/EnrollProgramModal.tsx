import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnrollInProgram } from "@/hooks/useUserPrograms";
import { toast } from "sonner";

interface EnrollProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName: string;
  totalWeeks: number;
  onEnrollSuccess?: () => void;
}

export function EnrollProgramModal({
  open,
  onOpenChange,
  programId,
  programName,
  totalWeeks,
  onEnrollSuccess,
}: EnrollProgramModalProps) {
  const navigate = useNavigate();
  const [startWeek, setStartWeek] = useState("1");
  const enrollMutation = useEnrollInProgram();

  const handleEnroll = async (navigateToRoutine: boolean = false) => {
    try {
      await enrollMutation.mutateAsync({
        programId,
        startWeek: parseInt(startWeek),
      });
      
      toast.success("¡Te has inscrito en el programa!");
      onOpenChange(false);
      
      if (navigateToRoutine) {
        onEnrollSuccess?.();
      }
    } catch (error) {
      toast.error("Error al inscribirse en el programa");
      console.error(error);
    }
  };

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Inscribirse en programa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Te inscribirás en <span className="font-medium text-foreground">{programName}</span>. 
            El programa aparecerá en tu Home como programa activo.
          </p>

          <div className="space-y-2">
            <Label htmlFor="start-week">Semana de inicio</Label>
            <Select value={startWeek} onValueChange={setStartWeek}>
              <SelectTrigger id="start-week">
                <SelectValue placeholder="Selecciona semana" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Semana {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Puedes comenzar desde cualquier semana del programa
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => handleEnroll(true)}
              disabled={enrollMutation.isPending}
              className="w-full"
            >
              {enrollMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Comenzar ahora
            </Button>
            <Button
              variant="outline"
              onClick={() => handleEnroll(false)}
              disabled={enrollMutation.isPending}
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Inscribirse y ver después
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
