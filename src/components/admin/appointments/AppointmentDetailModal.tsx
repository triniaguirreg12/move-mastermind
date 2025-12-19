import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Target, 
  AlertCircle, 
  Dumbbell,
  MessageSquare,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Appointment, Professional } from "@/hooks/useProfessionals";

interface UserProfile {
  name: string;
  email: string;
}

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  professional: Professional | null;
  userProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (appointmentId: string, status: 'completed' | 'missed' | 'reschedule_requested', meetLink?: string) => Promise<void>;
  onUpdateMeetLink: (appointmentId: string, meetLink: string) => Promise<void>;
}

export const AppointmentDetailModal = ({
  appointment,
  professional,
  userProfile,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateMeetLink,
}: AppointmentDetailModalProps) => {
  const [meetLink, setMeetLink] = useState(appointment?.google_meet_link || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<'completed' | 'missed' | 'reschedule' | null>(null);

  if (!appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/20 text-success border-success/30';
      case 'pending_payment':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'completed':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'missed':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'reschedule_requested':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending_payment':
        return 'Pago pendiente';
      case 'completed':
        return 'Completada';
      case 'missed':
        return 'No realizada';
      case 'cancelled':
        return 'Cancelada';
      case 'reschedule_requested':
        return 'Reagendar solicitado';
      default:
        return status;
    }
  };

  const handleCopyLink = () => {
    if (meetLink) {
      navigator.clipboard.writeText(meetLink);
      toast.success("Link copiado al portapapeles");
    }
  };

  const handleSaveMeetLink = async () => {
    if (!meetLink.trim()) {
      toast.error("Ingresa un link válido");
      return;
    }
    setIsSavingLink(true);
    try {
      await onUpdateMeetLink(appointment.id, meetLink);
      toast.success("Link de Google Meet guardado");
    } catch (error) {
      toast.error("Error al guardar el link");
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    
    setIsUpdating(true);
    try {
      if (confirmDialog === 'completed') {
        await onUpdateStatus(appointment.id, 'completed', meetLink);
        toast.success("Cita marcada como completada");
      } else if (confirmDialog === 'missed') {
        await onUpdateStatus(appointment.id, 'missed');
        toast.success("Cita marcada como no realizada");
      } else if (confirmDialog === 'reschedule') {
        await onUpdateStatus(appointment.id, 'reschedule_requested');
        toast.success("Solicitud de reagendar enviada al usuario");
      }
      setConfirmDialog(null);
      onClose();
    } catch (error) {
      toast.error("Error al actualizar la cita");
    } finally {
      setIsUpdating(false);
    }
  };

  const getConfirmDialogContent = () => {
    switch (confirmDialog) {
      case 'completed':
        return {
          title: "¿Confirmar cita realizada?",
          description: "Esta acción marcará la cita como completada exitosamente. El usuario recibirá una notificación.",
          actionLabel: "Sí, cita realizada",
          actionClass: "bg-primary hover:bg-primary/90"
        };
      case 'missed':
        return {
          title: "¿Confirmar cita no realizada?",
          description: "Esta acción marcará la cita como no realizada. Esto puede deberse a que el usuario no se presentó.",
          actionLabel: "Sí, no realizada",
          actionClass: "bg-destructive hover:bg-destructive/90"
        };
      case 'reschedule':
        return {
          title: "¿Solicitar reagendar cita?",
          description: "Se notificará al usuario que debe reagendar su cita porque el profesional no puede presentarse en el horario acordado.",
          actionLabel: "Sí, solicitar reagendar",
          actionClass: "bg-orange-500 hover:bg-orange-600"
        };
      default:
        return { title: "", description: "", actionLabel: "", actionClass: "" };
    }
  };

  const dialogContent = getConfirmDialogContent();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalle de Cita</span>
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Fecha y Hora */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {format(parseISO(appointment.appointment_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}</span>
                </div>
              </div>
            </div>

            {/* Profesional */}
            {professional && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Profesional</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">
                      {professional.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{professional.name}</p>
                    <p className="text-sm text-muted-foreground">{professional.title}</p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Usuario */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Usuario</h4>
              {userProfile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{userProfile.name}</p>
                    <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Usuario no encontrado</p>
              )}
            </div>

            <Separator />

            {/* Formulario del Usuario */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Información de la Consulta</h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Objetivo de la consulta</p>
                    <p className="text-sm text-foreground">{appointment.consultation_goal}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lesiones o condiciones</p>
                    <p className="text-sm text-foreground">{appointment.injury_condition}</p>
                  </div>
                </div>

                {appointment.available_equipment && appointment.available_equipment.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Dumbbell className="h-4 w-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Equipamiento disponible</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {appointment.available_equipment.map((eq, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {appointment.additional_comments && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Comentarios adicionales</p>
                      <p className="text-sm text-foreground">{appointment.additional_comments}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Link de Google Meet */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Video className="h-4 w-4" />
                Link de Google Meet
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="flex-1"
                />
                {meetLink && (
                  <>
                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={meetLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </>
                )}
              </div>
              {meetLink !== (appointment.google_meet_link || "") && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveMeetLink}
                  disabled={isSavingLink}
                >
                  {isSavingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Guardar Link
                </Button>
              )}
            </div>

            {/* Acciones de confirmación */}
            {(appointment.status === 'confirmed' || appointment.status === 'pending_payment') && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Confirmar resultado de la cita</h4>
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={() => setConfirmDialog('completed')}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Cita Realizada
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1 gap-2"
                      onClick={() => setConfirmDialog('missed')}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4" />
                      No Realizada
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => setConfirmDialog('reschedule')}
                    disabled={isUpdating}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Solicitar Reagendar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isUpdating}
              className={dialogContent.actionClass}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {dialogContent.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
