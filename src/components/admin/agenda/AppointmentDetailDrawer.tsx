import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Calendar,
  Clock,
  User,
  Mail,
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
  RefreshCw,
  CreditCard,
  Ban,
} from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  useUpdateAppointmentStatus,
  useCancelAppointment,
  type Appointment,
  type Professional,
} from "@/hooks/useProfessionals";

interface UserProfile {
  name: string;
  email: string;
  sex?: string;
  birth_date?: string;
}

interface AppointmentDetailDrawerProps {
  appointment: Appointment | null;
  professional: Professional | undefined;
  userProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentDetailDrawer = ({
  appointment,
  professional,
  userProfile,
  isOpen,
  onClose,
}: AppointmentDetailDrawerProps) => {
  const [confirmDialog, setConfirmDialog] = useState<
    "completed" | "missed" | "cancel" | null
  >(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = useUpdateAppointmentStatus();
  const cancelAppointment = useCancelAppointment();

  if (!appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/20 text-success border-success/30";
      case "pending_payment":
        return "bg-warning/20 text-warning border-warning/30";
      case "completed":
        return "bg-primary/20 text-primary border-primary/30";
      case "missed":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "cancelled":
        return "bg-muted text-muted-foreground";
      case "reschedule_requested":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending_payment":
        return "Pago pendiente";
      case "completed":
        return "Completada";
      case "missed":
        return "No realizada";
      case "cancelled":
        return "Cancelada";
      case "reschedule_requested":
        return "Reagendar solicitado";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagado";
      case "pending":
        return "Pendiente";
      case "failed":
        return "Fallido";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number, currency: string = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCopyLink = () => {
    if (appointment.google_meet_link) {
      navigator.clipboard.writeText(appointment.google_meet_link);
      toast.success("Link copiado al portapapeles");
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    setIsUpdating(true);
    try {
      if (confirmDialog === "completed") {
        await updateStatus.mutateAsync({
          appointmentId: appointment.id,
          status: "completed",
        });
        toast.success("Cita marcada como completada");
      } else if (confirmDialog === "missed") {
        await updateStatus.mutateAsync({
          appointmentId: appointment.id,
          status: "missed",
        });
        toast.success("Cita marcada como no realizada");
      } else if (confirmDialog === "cancel") {
        await cancelAppointment.mutateAsync(appointment.id);
        toast.success("Cita cancelada");
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
      case "completed":
        return {
          title: "¿Confirmar cita realizada?",
          description:
            "Esta acción marcará la cita como completada exitosamente.",
          actionLabel: "Sí, cita realizada",
          actionClass: "bg-primary hover:bg-primary/90",
        };
      case "missed":
        return {
          title: "¿Confirmar cita no realizada?",
          description:
            "Esta acción marcará la cita como no realizada. Esto puede deberse a que el usuario no se presentó.",
          actionLabel: "Sí, no realizada",
          actionClass: "bg-destructive hover:bg-destructive/90",
        };
      case "cancel":
        return {
          title: "¿Cancelar esta cita?",
          description:
            "Esta acción cancelará la cita. El usuario será notificado y el evento será eliminado del calendario.",
          actionLabel: "Sí, cancelar cita",
          actionClass: "bg-destructive hover:bg-destructive/90",
        };
      default:
        return { title: "", description: "", actionLabel: "", actionClass: "" };
    }
  };

  const dialogContent = getConfirmDialogContent();
  const aptWithExtras = appointment as Appointment & {
    currency?: string;
    payment_provider?: string;
    calendar_event_id?: string;
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Detalle de Cita</span>
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Fecha y Hora */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {format(
                      parseISO(appointment.appointment_date),
                      "EEEE d 'de' MMMM, yyyy",
                      { locale: es }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    {appointment.start_time.substring(0, 5)} -{" "}
                    {appointment.end_time.substring(0, 5)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Zona horaria: America/Santiago
              </p>
            </div>

            {/* Usuario */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Usuario
              </h4>
              {userProfile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {userProfile.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {userProfile.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {userProfile.sex && (
                      <span>
                        Sexo: <span className="text-foreground">{userProfile.sex}</span>
                      </span>
                    )}
                    {userProfile.birth_date && (
                      <span>
                        Edad: <span className="text-foreground">
                          {differenceInYears(new Date(), parseISO(userProfile.birth_date))} años
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Usuario no encontrado
                </p>
              )}
            </div>

            <Separator />

            {/* Información de la Consulta */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Información de la Consulta
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Objetivo de la consulta
                    </p>
                    <p className="text-sm text-foreground">
                      {appointment.consultation_goal}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Lesiones o condiciones
                    </p>
                    <p className="text-sm text-foreground">
                      {appointment.injury_condition}
                    </p>
                  </div>
                </div>

                {appointment.available_equipment &&
                  appointment.available_equipment.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Dumbbell className="h-4 w-4 text-accent mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Equipamiento disponible
                        </p>
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
                      <p className="text-xs text-muted-foreground">
                        Comentarios adicionales
                      </p>
                      <p className="text-sm text-foreground">
                        {appointment.additional_comments}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Información de Pago */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Información de Pago
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge
                    variant="outline"
                    className={
                      appointment.payment_status === "paid"
                        ? "border-success text-success"
                        : "border-warning text-warning"
                    }
                  >
                    {getPaymentStatusLabel(appointment.payment_status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monto:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      appointment.price_amount,
                      aptWithExtras.currency || "CLP"
                    )}
                  </span>
                </div>
                {aptWithExtras.payment_provider && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Pasarela:
                    </span>
                    <span className="text-sm">
                      {aptWithExtras.payment_provider === "mercadopago"
                        ? "MercadoPago"
                        : aptWithExtras.payment_provider}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Google Meet */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Video className="h-4 w-4" />
                Google Meet
              </h4>
              {appointment.google_meet_link ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Link
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={appointment.google_meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay link de Meet generado
                </p>
              )}
            </div>

            {/* Actions */}
            {(appointment.status === "confirmed" ||
              appointment.status === "pending_payment") && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Acciones
                  </h4>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => setConfirmDialog("completed")}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Realizada
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setConfirmDialog("missed")}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4" />
                      No Realizada
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => setConfirmDialog("cancel")}
                    disabled={isUpdating}
                  >
                    <Ban className="h-4 w-4" />
                    Cancelar Cita
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={() => setConfirmDialog(null)}
      >
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
