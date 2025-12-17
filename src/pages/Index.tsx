import { useState, useMemo, useEffect } from "react";
import { Calendar, Settings, ChevronRight, Info, Trophy, Cone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { RadarChart } from "@/components/home/RadarChart";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import {
  useUserEvents,
  useCleanupMissedEvents,
  getActivityDotsForDate,
  getDotColorClass,
  calculateWeeklyStats,
  UserEvent,
  PadelSubtype,
} from "@/hooks/useUserEvents";

// Import activity images
import padelBallImg from "@/assets/padel-ball.png";
import agilityImg from "@/assets/agility-routine.png";

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

const radarData = [
  { label: "Fu", value: 85 },  // Fuerza
  { label: "Po", value: 70 },  // Potencia
  { label: "Ag", value: 75 },  // Agilidad
  { label: "Co", value: 60 },  // Coordinación
  { label: "Es", value: 80 },  // Estabilidad
  { label: "Ve", value: 65 },  // Velocidad
  { label: "Re", value: 72 },  // Resistencia
  { label: "Mo", value: 78 },  // Movilidad
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summaryPeriod, setSummaryPeriod] = useState<"semanal" | "mensual">("semanal");
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const { data: events = [] } = useUserEvents();
  const cleanupMissedEvents = useCleanupMissedEvents();

  // Cleanup missed scheduled entrenamientos on mount
  useEffect(() => {
    cleanupMissedEvents.mutate();
  }, []);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter events for current week
  const weekEvents = useMemo(() => {
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");
    return events.filter(
      (e) => e.event_date >= startStr && e.event_date <= endStr
    );
  }, [events, weekStart, weekEnd]);

  // Filter events for current month
  const monthEvents = useMemo(() => {
    const startStr = format(monthStart, "yyyy-MM-dd");
    const endStr = format(monthEnd, "yyyy-MM-dd");
    return events.filter(
      (e) => e.event_date >= startStr && e.event_date <= endStr
    );
  }, [events, monthStart, monthEnd]);

  // Calculate stats based on selected period
  const periodStats = useMemo(
    () => calculateWeeklyStats(summaryPeriod === "semanal" ? weekEvents : monthEvents),
    [weekEvents, monthEvents, summaryPeriod]
  );

  // Get activity dots for a date
  const getActivityDots = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return getActivityDotsForDate(events, dateKey);
  };

  // Get activities for today
  const todayActivities = useMemo(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return events.filter((e) => e.event_date === dateKey);
  }, [events, selectedDate]);

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

  const getEventImage = (event: UserEvent) => {
    if (event.type === "entrenamiento") return agilityImg;
    return agilityImg;
  };

  // Get padel icon based on subtype
  const getPadelIcon = (subtype: PadelSubtype | undefined) => {
    switch (subtype) {
      case "torneo":
        return <Trophy className="h-6 w-6 text-activity-padel" />;
      case "clase":
        return <Cone className="h-6 w-6 text-activity-padel" />;
      case "partido":
      default:
        return (
          <img 
            src={padelBallImg} 
            alt="Partido de Pádel" 
            className="w-full h-full object-cover"
          />
        );
    }
  };

  const isPadelWithIcon = (event: UserEvent) => {
    return event.type === "padel" && 
      (event.metadata?.padel_subtype === "torneo" || event.metadata?.padel_subtype === "clase");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <Logo size="lg" />
        <div className="flex items-center gap-1">
          <Link to="/calendario">
            <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
              <Calendar className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/configuracion">
            <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Week Calendar */}
      <div className="px-4 py-3">
        <div className="flex justify-between">
          {dates.map((date, index) => {
            const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            const dots = getActivityDots(date);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <span className="text-xs text-muted-foreground font-medium">
                  {weekDays[index]}
                </span>
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isSelected
                      ? "border-2 border-muted-foreground/50 text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {format(date, "d")}
                </div>
                <div className="flex gap-0.5 h-2 items-center">
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

      {/* Summary Card */}
      <div className="px-4 py-2">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Resumen</h2>
              <button className="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center">
                <Info className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
            </div>
            <Select value={summaryPeriod} onValueChange={(v) => setSummaryPeriod(v as "semanal" | "mensual")}>
              <SelectTrigger className="w-[100px] h-7 text-xs bg-secondary border-0 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            {/* Radar Chart */}
            <div className="w-40 h-40 flex-shrink-0">
              <RadarChart data={radarData} />
            </div>

            {/* Legend with dynamic stats */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-activity-training flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Entrenamiento</span>
                <span className="text-xs font-medium text-foreground">{periodStats.entrenamiento}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-activity-padel flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Pádel</span>
                <span className="text-xs font-medium text-foreground">
                  {periodStats.padelCompleted}/{periodStats.padelTotal}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-activity-custom flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Profesional</span>
                <span className="text-xs font-medium text-foreground">{periodStats.profesional}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="flex-1 px-4 py-3 pb-24 overflow-y-auto">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Actividades de hoy
        </h2>

        {todayActivities.length === 0 ? (
          <div className="p-6 rounded-xl bg-card/50 border border-dashed border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              No tienes actividades programadas para hoy
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {todayActivities.map((event) => (
              <div
                key={event.id}
                onClick={() => handleActivityClick(event)}
                className={cn(
                  "bg-card rounded-xl p-3 border border-border flex items-center gap-3 transition-colors",
                  event.type === "entrenamiento" && event.metadata?.routine_id
                    ? "hover:border-primary/30 cursor-pointer"
                    : ""
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center",
                  isPadelWithIcon(event) ? "bg-activity-padel/10" : "bg-secondary"
                )}>
                  {event.type === "padel" ? (
                    getPadelIcon(event.metadata?.padel_subtype as PadelSubtype)
                  ) : (
                    <img
                      src={getEventImage(event)}
                      alt={event.title || "Actividad"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {event.title}
                    </h3>
                    {event.status === "completed" && (
                      <span className="text-[10px] bg-activity-training/20 text-activity-training px-1.5 py-0.5 rounded-full">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatEventTime(event) || (event.status === "scheduled" ? "Programado" : "Completado")}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0",
                    getDotColorClass(event.type)
                  )}
                />
                {event.type === "entrenamiento" && event.metadata?.routine_id && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
