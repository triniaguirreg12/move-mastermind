import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Video, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { 
  useAllProfessionals, 
  useAllAppointments,
  useUpdateAppointmentStatus,
  useUpdateAppointmentMeetLink,
  type Appointment,
  type Professional
} from "@/hooks/useProfessionals";
import { AppointmentDetailModal } from "@/components/admin/appointments/AppointmentDetailModal";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  name: string;
  email: string;
}

const AdminAgenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const weekStart = startOfWeek(currentDate, { locale: es });

  const { data: professionals = [], isLoading: loadingProfessionals } = useAllProfessionals();
  const { data: appointments = [], isLoading: loadingAppointments } = useAllAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const updateMeetLink = useUpdateAppointmentMeetLink();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getProfessional = (id: string) =>
    professionals.find((p) => p.id === id);

  const getAppointmentsByDay = (date: Date) =>
    appointments.filter(
      (a) => a.appointment_date === format(date, "yyyy-MM-dd") && a.status !== 'cancelled'
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/20 text-success';
      case 'pending_payment':
        return 'bg-warning/20 text-warning';
      case 'completed':
        return 'bg-primary/20 text-primary';
      case 'missed':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending_payment':
        return 'Pendiente';
      case 'completed':
        return 'Completada';
      case 'missed':
        return 'No realizada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const isLoading = loadingProfessionals || loadingAppointments;

  const getProfessionalColor = (index: number) => {
    const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-destructive'];
    return colors[index % colors.length];
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedProfessional(getProfessional(appointment.professional_id) || null);
    
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('user_id', appointment.user_id)
      .single();
    
    setSelectedUserProfile(profile);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (appointmentId: string, status: 'completed' | 'missed', meetLink?: string) => {
    await updateStatus.mutateAsync({ appointmentId, status, meetLink });
  };

  const handleUpdateMeetLink = async (appointmentId: string, meetLink: string) => {
    await updateMeetLink.mutateAsync({ appointmentId, meetLink });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setSelectedProfessional(null);
    setSelectedUserProfile(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">Gestión de citas y sesiones</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Professionals */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando profesionales...
          </div>
        ) : professionals.length === 0 ? (
          <p className="text-muted-foreground">No hay profesionales registrados.</p>
        ) : (
          professionals.map((p, index) => (
            <Card
              key={p.id}
              className="bg-card border-border p-4 min-w-[200px] hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${getProfessionalColor(index)} flex items-center justify-center`}
                >
                  <span className="text-white text-sm font-medium">
                    {p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.title}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentDate(addDays(currentDate, -7))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-heading font-semibold text-foreground">
          {format(weekStart, "d 'de' MMMM", { locale: es })} -{" "}
          {format(addDays(weekStart, 6), "d 'de' MMMM, yyyy", { locale: es })}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentDate(addDays(currentDate, 7))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayAppointments = getAppointmentsByDay(day);
          const isToday =
            format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div
                className={`text-center p-2 rounded-lg ${
                  isToday ? "bg-primary text-primary-foreground" : "bg-card"
                }`}
              >
                <p className="text-xs uppercase">
                  {format(day, "EEE", { locale: es })}
                </p>
                <p className="text-lg font-bold">{format(day, "d")}</p>
              </div>

              <div className="space-y-2 min-h-[300px]">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  dayAppointments.map((appointment) => {
                    const professional = getProfessional(appointment.professional_id);
                    const profIndex = professionals.findIndex(p => p.id === appointment.professional_id);
                    return (
                      <Card
                        key={appointment.id}
                        className="bg-card border-border p-3 hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => handleAppointmentClick(appointment as Appointment)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-6 h-6 rounded-full ${getProfessionalColor(profIndex)} flex items-center justify-center`}
                          >
                            <span className="text-white text-[10px] font-medium">
                              {professional?.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {professional?.name.split(" ")[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          {appointment.start_time.substring(0, 5)} (60min)
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {appointment.consultation_goal.length > 20 
                              ? `${appointment.consultation_goal.substring(0, 20)}...`
                              : appointment.consultation_goal}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {appointment.google_meet_link && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                              <Video className="h-2 w-2" /> Meet
                            </Badge>
                          )}
                          <Badge
                            className={`text-[10px] ${getStatusColor(appointment.status)}`}
                          >
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        professional={selectedProfessional}
        userProfile={selectedUserProfile}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateStatus}
        onUpdateMeetLink={handleUpdateMeetLink}
      />
    </div>
  );
};

export default AdminAgenda;
