import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  User,
  Video,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, parseISO, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useAllAppointments, useAllProfessionals, type Appointment } from "@/hooks/useProfessionals";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentDetailDrawer } from "./AppointmentDetailDrawer";

interface UserProfile {
  name: string;
  email: string;
}

export const AppointmentsTab = () => {
  const { data: appointments = [], isLoading } = useAllAppointments();
  const { data: professionals = [] } = useAllProfessionals();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        return "Pendiente";
      case "completed":
        return "Realizada";
      case "missed":
        return "No realizada";
      case "cancelled":
        return "Cancelada";
      case "reschedule_requested":
        return "Reprogramar";
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success/20 text-success";
      case "pending":
        return "bg-warning/20 text-warning";
      case "failed":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch =
        searchTerm === "" ||
        apt.consultation_goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.appointment_date.includes(searchTerm);

      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const handleAppointmentClick = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", appointment.user_id)
      .maybeSingle();

    setSelectedUserProfile(profile);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedAppointment(null);
    setSelectedUserProfile(null);
  };

  const getProfessional = (id: string) =>
    professionals.find((p) => p.id === id);

  const formatCurrency = (amount: number, currency: string = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por objetivo o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="pending_payment">Pendientes</SelectItem>
              <SelectItem value="completed">Realizadas</SelectItem>
              <SelectItem value="missed">No realizadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
              <SelectItem value="reschedule_requested">Reprogramar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">
            {appointments.filter((a) => a.status === "confirmed").length}
          </div>
          <div className="text-sm text-muted-foreground">Próximas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">
            {appointments.filter((a) => a.status === "completed").length}
          </div>
          <div className="text-sm text-muted-foreground">Realizadas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">
            {appointments.filter((a) => a.status === "cancelled").length}
          </div>
          <div className="text-sm text-muted-foreground">Canceladas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">
            {appointments.filter((a) => a.status === "pending_payment").length}
          </div>
          <div className="text-sm text-muted-foreground">Pendientes</div>
        </Card>
      </div>

      {/* Appointments Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Meet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron citas.
                </TableCell>
              </TableRow>
            ) : (
              paginatedAppointments.map((apt) => {
                const professional = getProfessional(apt.professional_id);
                const aptWithCurrency = apt as Appointment & { currency?: string; payment_provider?: string };
                
                return (
                  <TableRow
                    key={apt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleAppointmentClick(apt as unknown as Appointment)}
                  >
                    <TableCell>
                      <Badge className={getStatusColor(apt.status)}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(parseISO(apt.appointment_date), "d MMM yyyy", {
                              locale: es,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">
                            {(apt as any).user_profile?.name || "Usuario"}
                          </span>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {(apt as any).user_profile?.email || ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">Programa personalizado</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        60 min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getPaymentStatusColor(apt.payment_status)}>
                          {getPaymentStatusLabel(apt.payment_status)}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(apt.price_amount, aptWithCurrency.currency || "CLP")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {apt.google_meet_link ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={apt.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Video className="h-4 w-4 text-primary" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} de{" "}
              {filteredAppointments.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Detail Drawer */}
      <AppointmentDetailDrawer
        appointment={selectedAppointment as Appointment | null}
        professional={getProfessional(selectedAppointment?.professional_id || "")}
        userProfile={selectedUserProfile}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};
