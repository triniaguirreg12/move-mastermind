import { useState } from "react";
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
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

const activities = [
  {
    id: 1,
    type: "padel",
    title: "Partido de Padel",
    subtitle: "13:00 - 14:00",
    icon: "🎾",
  },
  {
    id: 2,
    type: "program",
    title: "Programa agilidad Upper Body",
    subtitle: "Semana 2",
    hasImage: true,
  },
  {
    id: 3,
    type: "routine",
    title: "Rutina agilidad Upper Body",
    subtitle: "Avanzado - Tren superior | 15 min",
    hasImage: true,
  },
];

const radarData = [
  { label: "Fu", value: 85 },
  { label: "Po", value: 70 },
  { label: "Ag", value: 60 },
  { label: "Po", value: 75 },
  { label: "Po", value: 80 },
];

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getActivityDots = (date: Date) => {
    const day = date.getDate();
    if (day === 11) return ["training", "training"];
    if (day === 14) return ["training", "padel", "custom"];
    if (day === 17) return ["training", "padel", "training"];
    return [];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-4 pb-2 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10">
            <Calendar className="h-5 w-5" />
          </Button>
          <Link to="/configuracion">
            <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Week Calendar */}
      <div className="px-5 py-4">
        <div className="flex justify-between">
          {dates.map((date, index) => {
            const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            const dots = getActivityDots(date);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center gap-1 min-w-[40px]"
              >
                <span className="text-xs text-muted-foreground font-medium">
                  {weekDays[index]}
                </span>
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
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
      <div className="px-5 py-2">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Resumen</h2>
              <button className="w-5 h-5 rounded-full border border-muted-foreground/40 flex items-center justify-center">
                <Info className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <Select defaultValue="semanal">
              <SelectTrigger className="w-[110px] h-8 text-sm bg-secondary border-0 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            {/* Radar Chart */}
            <div className="w-36 h-36 flex-shrink-0">
              <RadarChart data={radarData} />
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full activity-training" />
                <span className="text-sm text-muted-foreground flex-1">Entrenamiento</span>
                <span className="text-sm font-medium text-foreground">3/6</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full activity-padel" />
                <span className="text-sm text-muted-foreground flex-1">Padel</span>
                <span className="text-sm font-medium text-foreground">3/6</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full activity-custom" />
                <span className="text-sm text-muted-foreground flex-1">Personalizado</span>
                <span className="text-sm font-medium text-foreground">1/1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="flex-1 px-5 py-4 pb-24">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Actividades de hoy
        </h2>

        <div className="space-y-3 stagger-children">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer"
            >
              {activity.icon ? (
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                  {activity.icon}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                  <img
                    src="/placeholder.svg"
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {activity.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.subtitle}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
