import { Calendar, Settings } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WeekCalendar } from "@/components/home/WeekCalendar";
import { WeeklySummary } from "@/components/home/WeeklySummary";
import { ActivityCard } from "@/components/home/ActivityCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const todayActivities = [
  {
    id: 1,
    title: "Programa agilidad Upper Body",
    subtitle: "Semana 2",
    duration: "45 min",
    color: "primary" as const,
  },
  {
    id: 2,
    title: "Rutina agilidad Upper Body",
    subtitle: "Avanzado • Tren superior",
    duration: "15 min",
    level: "Avanzado",
    color: "accent" as const,
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="relative min-h-screen">
        {/* Background glow effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-accent/10 via-transparent to-transparent" />
        </div>

        <div className="relative px-4 pt-6 pb-8 space-y-6 stagger-children max-w-lg mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">¡Bienvenido!</p>
              <h1 className="font-display text-2xl font-bold text-foreground">
                ¡Hola, <span className="text-accent">Usuario</span>!
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/calendario")}>
                <Calendar className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/configuracion")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Week Calendar */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <WeekCalendar />
          </div>

          {/* Weekly Summary */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <WeeklySummary />
          </div>

          {/* Today's Activities */}
          <section className="space-y-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">
                Actividades de hoy
              </h2>
              <Button variant="link" className="text-accent text-sm p-0 h-auto">
                Ver todos
              </Button>
            </div>

            {todayActivities.length > 0 ? (
              <div className="space-y-3">
                {todayActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    title={activity.title}
                    subtitle={activity.subtitle}
                    duration={activity.duration}
                    level={activity.level}
                    color={activity.color}
                    onClick={() => navigate("/entrenamiento")}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card p-6 text-center">
                <p className="text-muted-foreground">
                  No hay actividades programadas para hoy
                </p>
                <Button variant="accent" className="mt-4" onClick={() => navigate("/entrenamiento")}>
                  Explorar entrenamientos
                </Button>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="glass"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/entrenamiento")}
              >
                <span className="text-2xl">💪</span>
                <span className="text-sm">Entrenar ahora</span>
              </Button>
              <Button
                variant="glass"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/profesionales")}
              >
                <span className="text-2xl">👨‍⚕️</span>
                <span className="text-sm">Agendar sesión</span>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
