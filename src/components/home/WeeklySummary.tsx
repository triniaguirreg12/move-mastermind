import { ProgressRing } from "./ProgressRing";
import { Info } from "lucide-react";

interface GoalData {
  label: string;
  current: number;
  target: number;
  color: "functional" | "padel" | "kine";
}

const goals: GoalData[] = [
  { label: "Funcional", current: 2, target: 4, color: "functional" },
  { label: "Padel", current: 3, target: 5, color: "padel" },
  { label: "Kine", current: 1, target: 2, color: "kine" },
];

export function WeeklySummary() {
  // Calculate overall progress
  const totalCurrent = goals.reduce((acc, g) => acc + g.current, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target, 0);
  const overallProgress = Math.round((totalCurrent / totalTarget) * 100);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Resumen semanal</h3>
        <button className="p-1.5 rounded-lg hover:bg-border/30 transition-colors">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Main progress ring */}
        <div className="relative">
          <ProgressRing
            progress={overallProgress}
            size={120}
            strokeWidth={10}
            color="functional"
          />
          {/* Inner rings for multiple metrics */}
          <div className="absolute inset-0 flex items-center justify-center">
            <ProgressRing
              progress={(goals[1].current / goals[1].target) * 100}
              size={90}
              strokeWidth={8}
              color="padel"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ProgressRing
              progress={(goals[2].current / goals[2].target) * 100}
              size={60}
              strokeWidth={6}
              color="kine"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          {goals.map((goal) => (
            <div key={goal.label} className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  goal.color === "functional"
                    ? "bg-ring-functional"
                    : goal.color === "padel"
                    ? "bg-ring-padel"
                    : "bg-ring-kine"
                }`}
              />
              <span className="text-sm text-muted-foreground flex-1">{goal.label}</span>
              <span className="font-display font-semibold text-foreground">
                <span className={
                  goal.color === "functional"
                    ? "text-ring-functional"
                    : goal.color === "padel"
                    ? "text-ring-padel"
                    : "text-ring-kine"
                }>
                  {goal.current}
                </span>
                /{goal.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
