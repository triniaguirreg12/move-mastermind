import { useState } from "react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export function WeekCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className="flex items-center justify-between gap-1 px-2">
      {weekDays.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());

        return (
          <button
            key={date.toISOString()}
            onClick={() => setSelectedDate(date)}
            className={cn(
              "flex flex-col items-center justify-center w-10 h-14 rounded-xl transition-all duration-200",
              isSelected
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
                : isToday
                ? "bg-primary/20 text-foreground"
                : "bg-transparent text-muted-foreground hover:bg-card"
            )}
          >
            <span className="text-[10px] font-medium uppercase">{dayLabels[index]}</span>
            <span className={cn(
              "text-lg font-semibold font-display",
              isSelected ? "text-accent-foreground" : ""
            )}>
              {format(date, 'd')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
