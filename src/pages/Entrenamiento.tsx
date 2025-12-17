import { useState, useMemo } from "react";
import { Search, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryCarousel } from "@/components/library/CategoryCarousel";

// Category descriptions for info tooltips
const categoryDescriptions = {
  Funcional: "Rutinas diseñadas para mejorar el rendimiento físico general mediante movimientos compuestos y funcionales.",
  Kinesiología: "Sesiones enfocadas en rehabilitación, prevención de lesiones y mejora de la movilidad articular.",
  Activación: "Rutinas cortas de calentamiento y activación muscular para preparar el cuerpo antes de la actividad.",
};

// Mock data with aptitudes
const mockRoutines = [
  {
    id: "1",
    title: "Fuerza Upper Body",
    subtitle: "Tren superior intenso",
    duration: "25 min",
    difficulty: "Avanzado" as const,
    equipment: ["Mancuerna", "Barra"],
    rating: 4.6,
    category: "funcional" as const,
    aptitudes: [
      { name: "Fuerza", value: 9 },
      { name: "Potencia", value: 6 },
      { name: "Estabilidad", value: 5 },
      { name: "Resistencia", value: 4 },
    ],
  },
  {
    id: "2",
    title: "Core & Estabilidad",
    subtitle: "Fortalece tu centro",
    duration: "20 min",
    difficulty: "Intermedio" as const,
    equipment: ["Banda", "Miniband"],
    rating: 4.8,
    category: "funcional" as const,
    aptitudes: [
      { name: "Estabilidad", value: 10 },
      { name: "Fuerza", value: 6 },
      { name: "Coordinación", value: 5 },
    ],
  },
  {
    id: "3",
    title: "Piernas Explosivas",
    subtitle: "Potencia y velocidad",
    duration: "30 min",
    difficulty: "Avanzado" as const,
    equipment: ["Mancuerna", "Pesa rusa"],
    rating: 4.3,
    category: "funcional" as const,
    aptitudes: [
      { name: "Potencia", value: 9 },
      { name: "Velocidad", value: 8 },
      { name: "Fuerza", value: 7 },
    ],
  },
  {
    id: "4",
    title: "Full Body Funcional",
    subtitle: "Entrena todo el cuerpo",
    duration: "35 min",
    difficulty: "Intermedio" as const,
    equipment: ["Mancuerna"],
    rating: 4.5,
    category: "funcional" as const,
    aptitudes: [
      { name: "Resistencia", value: 8 },
      { name: "Fuerza", value: 7 },
      { name: "Coordinación", value: 6 },
    ],
  },
  {
    id: "5",
    title: "Recuperación Activa",
    subtitle: "Movilidad y estiramiento",
    duration: "15 min",
    difficulty: "Principiante" as const,
    equipment: ["Sin implemento"],
    rating: 4.9,
    category: "kinesiologia" as const,
    aptitudes: [
      { name: "Movilidad", value: 10 },
      { name: "Estabilidad", value: 5 },
    ],
  },
  {
    id: "6",
    title: "Liberación Miofascial",
    subtitle: "Foam roller session",
    duration: "20 min",
    difficulty: "Principiante" as const,
    equipment: ["Foam roller"],
    rating: 4.7,
    category: "kinesiologia" as const,
    aptitudes: [
      { name: "Movilidad", value: 9 },
      { name: "Estabilidad", value: 4 },
    ],
  },
  {
    id: "7",
    title: "Hombro Saludable",
    subtitle: "Prevención de lesiones",
    duration: "18 min",
    difficulty: "Principiante" as const,
    equipment: ["Banda"],
    rating: 4.6,
    category: "kinesiologia" as const,
    aptitudes: [
      { name: "Movilidad", value: 8 },
      { name: "Estabilidad", value: 7 },
      { name: "Coordinación", value: 4 },
    ],
  },
  {
    id: "8",
    title: "Activación Pre-Padel",
    subtitle: "Prepara tu cuerpo",
    duration: "10 min",
    difficulty: "Principiante" as const,
    equipment: ["Banda elástica"],
    rating: 4.4,
    category: "activacion" as const,
    aptitudes: [
      { name: "Agilidad", value: 8 },
      { name: "Velocidad", value: 7 },
      { name: "Coordinación", value: 6 },
    ],
  },
  {
    id: "9",
    title: "Warm Up Dinámico",
    subtitle: "Calentamiento completo",
    duration: "12 min",
    difficulty: "Principiante" as const,
    equipment: ["Sin implemento"],
    rating: 4.5,
    category: "activacion" as const,
    aptitudes: [
      { name: "Movilidad", value: 7 },
      { name: "Agilidad", value: 6 },
      { name: "Velocidad", value: 5 },
    ],
  },
  {
    id: "10",
    title: "Activación Neuromuscular",
    subtitle: "Despierta tus músculos",
    duration: "8 min",
    difficulty: "Intermedio" as const,
    equipment: ["Miniband"],
    rating: 4.2,
    category: "activacion" as const,
    aptitudes: [
      { name: "Coordinación", value: 8 },
      { name: "Estabilidad", value: 6 },
      { name: "Velocidad", value: 5 },
    ],
  },
];

const Entrenamiento = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter routines by search only
  const filteredRoutines = useMemo(() => {
    if (!searchQuery) return mockRoutines;
    
    const query = searchQuery.toLowerCase();
    return mockRoutines.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.subtitle?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group by category
  const routinesByCategory = useMemo(() => {
    return {
      funcional: filteredRoutines.filter((r) => r.category === "funcional"),
      kinesiologia: filteredRoutines.filter((r) => r.category === "kinesiologia"),
      activacion: filteredRoutines.filter((r) => r.category === "activacion"),
    };
  }, [filteredRoutines]);

  const handleRoutineClick = (id: string | number) => {
    // Navigate to routine detail (to be implemented)
    console.log("Navigate to routine:", id);
  };

  const hasSearchResults = searchQuery && filteredRoutines.length > 0;
  const hasNoResults = searchQuery && filteredRoutines.length === 0;

  return (
    <AppLayout>
      <div className="min-h-screen pb-8 space-y-6">
        {/* Header */}
        <header className="px-4 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Biblioteca
            </h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar rutinas o programas..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </header>

        {/* Categories with Carousels */}
        <div className="space-y-8">
          {hasNoResults ? (
            <div className="px-4">
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">
                  No se encontraron rutinas con esos criterios
                </p>
              </div>
            </div>
          ) : hasSearchResults ? (
            // Search results - show matching routines grouped by category
            <>
              {routinesByCategory.funcional.length > 0 && (
                <CategoryCarousel
                  title="Funcional"
                  description={categoryDescriptions.Funcional}
                  routines={routinesByCategory.funcional}
                  categoryKey="funcional"
                  onRoutineClick={handleRoutineClick}
                />
              )}
              {routinesByCategory.kinesiologia.length > 0 && (
                <CategoryCarousel
                  title="Kinesiología"
                  description={categoryDescriptions.Kinesiología}
                  routines={routinesByCategory.kinesiologia}
                  categoryKey="kinesiologia"
                  onRoutineClick={handleRoutineClick}
                />
              )}
              {routinesByCategory.activacion.length > 0 && (
                <CategoryCarousel
                  title="Activación"
                  description={categoryDescriptions.Activación}
                  routines={routinesByCategory.activacion}
                  categoryKey="activacion"
                  onRoutineClick={handleRoutineClick}
                />
              )}
            </>
          ) : (
            // Default view - all category carousels
            <>
              <CategoryCarousel
                title="Funcional"
                description={categoryDescriptions.Funcional}
                routines={routinesByCategory.funcional}
                categoryKey="funcional"
                onRoutineClick={handleRoutineClick}
              />

              <CategoryCarousel
                title="Kinesiología"
                description={categoryDescriptions.Kinesiología}
                routines={routinesByCategory.kinesiologia}
                categoryKey="kinesiologia"
                onRoutineClick={handleRoutineClick}
              />

              <CategoryCarousel
                title="Activación"
                description={categoryDescriptions.Activación}
                routines={routinesByCategory.activacion}
                categoryKey="activacion"
                onRoutineClick={handleRoutineClick}
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Entrenamiento;