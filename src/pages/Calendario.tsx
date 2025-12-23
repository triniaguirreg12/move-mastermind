import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Trash2, Video, ExternalLink, CheckCircle, Puzzle, Lock, UserPlus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/layout/BottomNav";
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
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import {
  useUserEvents,
  useCleanupMissedEvents,
  useDeleteEvent,
  useUpdateEventStatus,
  getActivityDotsForDate,
  getDotColorClass,
  UserEvent,
  EventType,
} from "@/hooks/useUserEvents";
import { useUserAccess } from "@/hooks/useUserAccess";
import { AgendarPadelModal } from "@/components/calendario/AgendarPadelModal";

const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const Calendario = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPadelModalOpen, setIsPadelModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<UserEvent | null>(null);
  const navigate = useNavigate();

  const { level: accessLevel, isGuest, canAccessFullContent } = useUserAccess();
  const { data: events = [], isLoading } = useUserEvents();
  const cleanupMissedEvents = useCleanupMissedEvents();
  const deleteEvent = useDeleteEvent();
  const updateEventStatus = useUpdateEventStatus();

  // Cleanup missed scheduled entrenamientos on mount
  useEffect(() => {
    cleanupMissedEvents.mutate();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getActivityDots = (date: Date): EventType[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return getActivityDotsForDate(events, dateKey);
  };

  const getActivitiesForDate = (date: Date): UserEvent[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return events.filter((e) => e.event_date === dateKey);
  };

  const selectedActivities = useMemo(
    () => getActivitiesForDate(selectedDate),
    [selectedDate, events]
  );

  const handleActivityClick = (event: UserEvent) => {
    if (event.type === "entrenamiento" && event.metadata?.routine_id) {
      navigate(`/rutina/${event.metadata.routine_id}`, { state: { from: "/calendario" } });
    }
  };

  const formatEventTime = (event: UserEvent) => {
    if (event.time_start && event.time_end) {
      return `${event.time_start.slice(0, 5)} - ${event.time_end.slice(0, 5)}`;
    }
    if (event.time_start) {
      return event.time_start.slice(0, 5);
    }
    return null;
  };

  const handleDeleteClick = (e: React.MouseEvent, event: UserEvent) => {
    e.stopPropagation();
    setEventToDelete(event);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEvent.mutate(eventToDelete.id);
      setEventToDelete(null);
    }
  };

  const getStatusBadge = (event: UserEvent) => {
    if (event.status === "completed") {
      return (
        <Badge className="text-xs bg-activity-training/20 text-activity-training border-activity-training/30">
          Completado
        </Badge>
      );
    }
    if (event.status === "missed") {
      return (
        <Badge className="text-xs bg-destructive/20 text-destructive border-destructive/30">
          No realizada
        </Badge>
      );
    }
    return null;
  };

  const getMeetLink = (event: UserEvent): string | null => {
    if (event.type === "profesional" && event.metadata?.google_meet_link) {
      return event.metadata.google_meet_link as string;
    }
    return null;
  };

  // Show blocked overlay for non-subscribed users with calendar preview
  if (!canAccessFullContent) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Header */}
        <header className="px-4 pt-4 pb-2 flex items-center">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground ml-2">Calendario</h1>
        </header>

        {/* Calendar Preview (faded) */}
        <div className="opacity-85 pointer-events-none">
          {/* Month Navigation */}
          <div className="px-4 py-4 flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-base font-medium text-foreground min-w-[140px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </span>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="px-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {days.map((date, index) => {
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isTodayDate = isToday(date);

                return (
                  <div key={index} className="flex flex-col items-center py-1">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium",
                        !isCurrentMonth && "text-muted-foreground/40",
                        isCurrentMonth && "text-foreground",
                        isTodayDate && "bg-muted"
                      )}
                    >
                      {format(date, "d")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blocking Overlay */}
        <div className="absolute inset-0 top-16 flex flex-col items-center justify-center px-6 text-center bg-background/70 backdrop-blur-sm">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-4",
            isGuest ? "bg-primary/10" : "bg-warning/10"
          )}>
            {isGuest ? (
              <CalendarIcon className="w-8 h-8 text-primary" />
            ) : (
              <Lock className="w-8 h-8 text-warning" />
            )}
          </div>
          
          <h2 className="text-lg font-bold text-foreground mb-2">
            {isGuest ? "Tu calendario personal" : "Calendario bloqueado"}
          </h2>
          
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            {isGuest 
              ? "Crea tu cuenta para agendar entrenamientos, partidos de pádel y citas con profesionales."
              : "Con tu suscripción podrás agendar actividades, ver tu progreso y organizar tu semana de entrenamiento."
            }
          </p>

          <div className="flex flex-col gap-2 w-full max-w-xs">
            {isGuest ? (
              <>
                <Button onClick={() => navigate("/login", { state: { mode: "signup" } })}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear cuenta
                </Button>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Iniciar sesión
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate("/configuracion", { state: { scrollTo: "plan-actual" } })}>
                  Ver planes de suscripción
                </Button>
                <Button variant="ghost" onClick={() => navigate("/")}>
                  Volver al inicio
                </Button>
              </>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground ml-2">Calendario</h1>
      </header>

      {/* Month Navigation */}
      <div className="px-4 py-4 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-base font-medium text-foreground min-w-[140px] text-center capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="px-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const dots = getActivityDots(date);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center py-1"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && !isSelected && "text-foreground",
                    isSelected && "bg-secondary border-2 border-muted-foreground/50",
                    isTodayDate && !isSelected && "bg-muted"
                  )}
                >
                  {format(date, "d")}
                </div>
                <div className="flex gap-0.5 h-2 mt-0.5">
                  {dots.map((type, i) => (
                    <div
                      key={i}
                      className={cn("w-1.5 h-1.5 rounded-full", getDotColorClass(type))}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Legend */}
      <div className="px-4 py-3 flex justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-activity-training" />
          <span className="text-xs text-muted-foreground">Entrenamiento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-activity-padel" />
          <span className="text-xs text-muted-foreground">Pádel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-activity-custom" />
          <span className="text-xs text-muted-foreground">Profesional</span>
        </div>
      </div>

      {/* Selected Date Activities */}
      <div className="flex-1 px-4 py-4 pb-24">
        <h2 className="text-base font-semibold text-foreground mb-3 capitalize">
          {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
        </h2>

        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Cargando eventos...
          </div>
        ) : selectedActivities.length > 0 ? (
          <div className="space-y-3">
            {selectedActivities.map((event) => {
              const meetLink = getMeetLink(event);
              return (
                <div
                  key={event.id}
                  onClick={() => handleActivityClick(event)}
                  className={cn(
                    "bg-card rounded-xl p-4 border border-border flex items-center gap-3 transition-colors",
                    event.type === "entrenamiento" && event.metadata?.routine_id
                      ? "hover:border-primary/30 cursor-pointer"
                      : ""
                  )}
                >
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full flex-shrink-0",
                      getDotColorClass(event.type)
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {event.title}
                      </span>
                      {getStatusBadge(event)}
                    </div>
                    {/* Program badge for routines from programs */}
                    {event.type === "entrenamiento" && event.metadata?.source === "program" && event.metadata?.program_name && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge 
                          variant="outline" 
                          className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary bg-primary/5"
                        >
                          <Puzzle className="h-2 w-2 mr-0.5" />
                          {event.metadata.program_name}
                        </Badge>
                      </div>
                    )}
                    {formatEventTime(event) && (
                      <span className="text-xs text-muted-foreground">
                        {formatEventTime(event)}
                      </span>
                    )}
                    {meetLink && (
                      <a
                        href={meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <Video className="h-3 w-3" />
                        Unirse a Google Meet
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {event.type === "padel" && event.status === "scheduled" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateEventStatus.mutate({ eventId: event.id, status: "completed" });
                      }}
                      className="p-2 rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors flex-shrink-0"
                      title="Marcar como completado"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteClick(e, event)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    title="Eliminar evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {event.type === "entrenamiento" && event.metadata?.routine_id && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay actividades para este día
          </p>
        )}

        {/* Add Padel Button */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => setIsPadelModalOpen(true)}
            className="w-full h-12 rounded-full border-2 border-activity-padel/50 text-activity-padel hover:bg-activity-padel/10"
          >
            + Agendar Pádel
          </Button>
        </div>
      </div>

      {/* Padel Modal */}
      <AgendarPadelModal
        isOpen={isPadelModalOpen}
        onClose={() => setIsPadelModalOpen(false)}
        initialDate={selectedDate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {eventToDelete?.type === "profesional" 
                ? "¿Deseas eliminar esta cita definitivamente o prefieres reagendarla?"
                : `¿Estás segura de que quieres eliminar "${eventToDelete?.title}"? Esta acción no se puede deshacer.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={eventToDelete?.type === "profesional" ? "flex-col sm:flex-row gap-2" : ""}>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            {eventToDelete?.type === "profesional" && (
              <AlertDialogAction
                onClick={() => {
                  if (eventToDelete?.metadata?.professional_id && eventToDelete?.metadata?.appointment_id) {
                    navigate(`/profesionales?reschedule=${eventToDelete.metadata.professional_id}&appointment=${eventToDelete.metadata.appointment_id}`);
                    setEventToDelete(null);
                  }
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Reagendar
              </AlertDialogAction>
            )}
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eventToDelete?.type === "profesional" ? "Eliminar definitivamente" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Calendario;
