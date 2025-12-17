import { useState, useMemo } from "react";
import { Calendar, Settings, ChevronRight, Info } from "lucide-react";
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
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useScheduledRoutines } from "@/hooks/useScheduledRoutines";

// Import activity images
import padelBallImg from "@/assets/padel-ball.png";
import upperBodyImg from "@/assets/upper-body-workout.png";
import agilityImg from "@/assets/agility-routine.png";

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

// Static activities removed - now using scheduled routines from database

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
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const { data: scheduledRoutines = [] } = useScheduledRoutines();

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get scheduled routines for a specific date
  const getScheduledForDate = (date: Date) => {
    return scheduledRoutines.filter(
      (sr) => sr.scheduled_date === format(date, "yyyy-MM-dd") && sr.status === "programada"
    );
  };

  const getActivityDots = (date: Date) => {
    const scheduled = getScheduledForDate(date);
    const dots: string[] = [];
    
    // Add training dots for scheduled routines
    scheduled.forEach(() => dots.push("training"));
    
    // Keep some mock data for demo purposes (padel, custom)
    const day = date.getDate();
    if (day === 17) dots.push("padel", "custom");
    if (day === 21) dots.push("padel");
    
    return dots;
  };

  // Get activities for today based on scheduled routines
  const todayActivities = useMemo(() => {
    const todayScheduled = getScheduledForDate(selectedDate);
    
    const scheduledActivities = todayScheduled.map((sr) => ({
      id: sr.id,
      type: "routine" as const,
      title: sr.routine?.nombre || "Rutina",
      subtitle: `${sr.routine?.categoria || ""} | ${sr.routine?.dificultad || ""}`,
      image: sr.routine?.portada_url || agilityImg,
      routineId: sr.routine_id,
    }));

    // Keep some mock activities for demo
    const mockActivities = [
      {
        id: "mock-1",
        type: "padel" as const,
        title: "Partido de Padel",
        subtitle: "13:00 - 14:00",
        image: padelBallImg,
        routineId: null,
      },
    ];

    return [...scheduledActivities, ...mockActivities];
  }, [scheduledRoutines, selectedDate]);

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
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        type === "training" && "activity-training",
                        type === "padel" && "activity-padel",
                        type === "custom" && "activity-custom"
                      )}
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
            <Select defaultValue="semanal">
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

            {/* Legend */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full activity-training flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Entrenamiento</span>
                <span className="text-xs font-medium text-foreground">3/6</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full activity-padel flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Padel</span>
                <span className="text-xs font-medium text-foreground">3/6</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full activity-custom flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Personalizado</span>
                <span className="text-xs font-medium text-foreground">1/1</span>
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
            {todayActivities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => {
                  if (activity.routineId) {
                    navigate(`/rutina/${activity.routineId}`);
                  }
                }}
                className="bg-card rounded-xl p-3 border border-border flex items-center gap-3 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {activity.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.subtitle}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
