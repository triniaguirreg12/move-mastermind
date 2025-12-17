import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
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
  getActivityDotsForDate,
  getDotColorClass,
  UserEvent,
  EventType,
} from "@/hooks/useUserEvents";
import { AgendarPadelModal } from "@/components/calendario/AgendarPadelModal";

const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const Calendario = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPadelModalOpen, setIsPadelModalOpen] = useState(false);
  const navigate = useNavigate();

  const { data: events = [], isLoading } = useUserEvents();
  const cleanupMissedEvents = useCleanupMissedEvents();

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
      navigate(`/rutina/${event.metadata.routine_id}`);
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

  const getStatusBadge = (event: UserEvent) => {
    if (event.status === "completed") {
      return (
        <span className="text-xs bg-activity-training/20 text-activity-training px-2 py-0.5 rounded-full">
          Completado
        </span>
      );
    }
    return null;
  };

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
            {selectedActivities.map((event) => (
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </span>
                    {getStatusBadge(event)}
                  </div>
                  {formatEventTime(event) && (
                    <span className="text-xs text-muted-foreground">
                      {formatEventTime(event)}
                    </span>
                  )}
                </div>
                {event.type === "entrenamiento" && event.metadata?.routine_id && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
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

      <BottomNav />
    </div>
  );
};

export default Calendario;
