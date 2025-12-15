import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RoutineCard } from "@/components/training/RoutineCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "Todos" },
  { id: "funcional", label: "Funcional" },
  { id: "activacion", label: "Activación" },
  { id: "kine", label: "Kine" },
];

const tabs = [
  { id: "rutinas", label: "Rutinas" },
  { id: "programas", label: "Programas" },
];

const routines = [
  {
    id: 1,
    title: "Agilidad Upper Body",
    description: "Trabaja piernas con una potente superserie de ejercicios compuestos",
    duration: "15 min",
    level: "Avanzado",
    equipment: ["Mancuernas", "Barra", "Pesa rusa"],
    category: "funcional" as const,
  },
  {
    id: 2,
    title: "Fuerza Tren Inferior",
    description: "Fortalece tu tren inferior con ejercicios de alta intensidad",
    duration: "20 min",
    level: "Intermedio",
    equipment: ["Mancuernas", "Barra"],
    category: "funcional" as const,
  },
  {
    id: 3,
    title: "Activación Pre-Padel",
    description: "Prepara tu cuerpo para un partido de padel intenso",
    duration: "10 min",
    level: "Principiante",
    equipment: ["Banda elástica"],
    category: "activacion" as const,
  },
  {
    id: 4,
    title: "Recuperación Activa",
    description: "Rutina de movilidad y estiramientos para recuperar",
    duration: "15 min",
    level: "Principiante",
    equipment: ["Foam roller"],
    category: "kine" as const,
  },
];

const Entrenamiento = () => {
  const [activeTab, setActiveTab] = useState("rutinas");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredRoutines = routines.filter(
    (routine) => activeCategory === "all" || routine.category === activeCategory
  );

  return (
    <AppLayout>
      <div className="min-h-screen px-4 pt-6 pb-8 space-y-5 max-w-lg mx-auto">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Entrenamiento
            </h1>
            <Button variant="ghost" size="icon">
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar rutinas..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-card/50 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-accent/50"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Routine Grid */}
        <div className="grid gap-4">
          {filteredRoutines.map((routine, index) => (
            <div
              key={routine.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <RoutineCard
                title={routine.title}
                description={routine.description}
                duration={routine.duration}
                level={routine.level}
                equipment={routine.equipment}
                category={routine.category}
              />
            </div>
          ))}
        </div>

        {filteredRoutines.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">
              No se encontraron rutinas en esta categoría
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Entrenamiento;
