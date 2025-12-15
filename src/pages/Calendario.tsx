import { useState } from "react";
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
import { Link } from "react-router-dom";

// Activity types with colors
// Verde: Rutinas (funcional, kinesiología) - affects radar
// Amarillo: Padel (tracking días/horas) - calendar only
// Rosa: Personalizado (sesiones con profesional)

interface Activity {
  id: number;
  type: "rutina" | "padel" | "personalizado";
  title: string;
  time?: string;
}

// Mock calendar data
const calendarActivities: Record<string, Activity[]> = {
  "2025-08-04": [
    { id: 1, type: "rutina", title: "Rutina Funcional" },
    { id: 2, type: "rutina", title: "Activación matutina" },
  ],
  "2025-08-05": [{ id: 3, type: "rutina", title: "Kinesiología" }],
  "2025-08-06": [{ id: 4, type: "rutina", title: "Rutina Core" }],
  "2025-08-07": [{ id: 5, type: "padel", title: "Partido de Padel", time: "10:00 - 11:00" }],
  "2025-08-09": [
    { id: 6, type: "rutina", title: "Rutina Full Body" },
    { id: 7, type: "padel", title: "Padel", time: "18:00 - 19:00" },
  ],
  "2025-08-11": [
    { id: 8, type: "rutina", title: "Rutina" },
    { id: 9, type: "rutina", title: "Kinesiología" },
  ],
  "2025-08-12": [
    { id: 10, type: "rutina", title: "Rutina" },
    { id: 11, type: "padel", title: "Partido de Padel", time: "13:00 - 14:00" },
    { id: 12, type: "personalizado", title: "Sesión con Kinesióloga" },
  ],
  "2025-08-13": [{ id: 13, type: "rutina", title: "Rutina Funcional" }],
  "2025-08-14": [{ id: 14, type: "padel", title: "Padel", time: "19:00 - 20:00" }],
  "2025-08-18": [
    { id: 15, type: "rutina", title: "Rutina" },
    { id: 16, type: "rutina", title: "Rutina" },
    { id: 17, type: "personalizado", title: "Consulta" },
  ],
  "2025-08-19": [{ id: 18, type: "rutina", title: "Kinesiología" }],
  "2025-08-20": [{ id: 19, type: "rutina", title: "Rutina" }],
  "2025-08-21": [{ id: 20, type: "padel", title: "Padel", time: "17:00 - 18:00" }],
  "2025-08-23": [
    { id: 21, type: "rutina", title: "Rutina" },
    { id: 22, type: "rutina", title: "Rutina" },
  ],
  "2025-08-25": [
    { id: 23, type: "rutina", title: "Rutina" },
    { id: 24, type: "padel", title: "Padel", time: "10:00 - 11:00" },
  ],
  "2025-08-26": [{ id: 25, type: "rutina", title: "Kinesiología" }],
  "2025-08-27": [{ id: 26, type: "rutina", title: "Rutina" }],
  "2025-08-28": [{ id: 27, type: "padel", title: "Padel", time: "19:00 - 20:00" }],
  "2025-08-30": [
    { id: 28, type: "rutina", title: "Rutina" },
    { id: 29, type: "rutina", title: "Rutina" },
  ],
};

const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const Calendario = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 7, 1)); // August 2025
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 7, 12));

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

  const getActivityDots = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const activities = calendarActivities[dateKey] || [];
    
    // Get unique types
    const types = [...new Set(activities.map((a) => a.type))];
    return types.slice(0, 3); // Max 3 dots
  };

  const getActivitiesForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return calendarActivities[dateKey] || [];
  };

  const getDotColor = (type: string) => {
    switch (type) {
      case "rutina":
        return "bg-activity-training"; // Verde
      case "padel":
        return "bg-activity-padel"; // Amarillo
      case "personalizado":
        return "bg-activity-custom"; // Rosa
      default:
        return "bg-muted-foreground";
    }
  };

  const selectedActivities = getActivitiesForDate(selectedDate);

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
                      className={cn("w-1.5 h-1.5 rounded-full", getDotColor(type))}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Activities */}
      <div className="flex-1 px-4 py-4 pb-24">
        <h2 className="text-base font-semibold text-foreground mb-3 capitalize">
          {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
        </h2>

        {selectedActivities.length > 0 ? (
          <div className="space-y-3">
            {selectedActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", getDotColor(activity.type))} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{activity.title}</span>
                  {activity.time && (
                    <span className="text-sm text-muted-foreground ml-2">{activity.time}</span>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
            className="w-full h-12 rounded-full border-2 border-muted-foreground/30 text-foreground hover:bg-muted"
          >
            + Agendar Padel
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Calendario;
