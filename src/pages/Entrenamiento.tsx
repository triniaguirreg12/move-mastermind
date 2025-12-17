import { useState, useMemo } from "react";
import { Search, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryCarousel } from "@/components/library/CategoryCarousel";
import { LibraryFilters } from "@/components/library/LibraryFilters";

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
  const [filters, setFilters] = useState({
    category: [] as string[],
    difficulty: [] as string[],
    equipment: [] as string[],
    duration: "",
    aptitude: [] as string[],
    sortBy: "",
  });

  // Filter and sort routines
  const filteredRoutines = useMemo(() => {
    let result = [...mockRoutines];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.subtitle?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category.length > 0) {
      result = result.filter((r) => filters.category.includes(r.category));
    }

    // Difficulty filter
    if (filters.difficulty.length > 0) {
      result = result.filter((r) => filters.difficulty.includes(r.difficulty));
    }

    // Duration filter
    if (filters.duration) {
      result = result.filter((r) => {
        const mins = parseInt(r.duration);
        if (filters.duration === "short") return mins < 15;
        if (filters.duration === "medium") return mins >= 15 && mins <= 30;
        if (filters.duration === "long") return mins > 30;
        return true;
      });
    }

    // Aptitude filter
    if (filters.aptitude.length > 0) {
      result = result.filter((r) => {
        const topAptitude = r.aptitudes.sort((a, b) => b.value - a.value)[0];
        return filters.aptitude.includes(topAptitude?.name);
      });
    }

    // Sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case "rating-desc":
            return (b.rating || 0) - (a.rating || 0);
          case "duration-asc":
            return parseInt(a.duration) - parseInt(b.duration);
          case "duration-desc":
            return parseInt(b.duration) - parseInt(a.duration);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [searchQuery, filters]);

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

  const hasActiveFilters =
    filters.category.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.equipment.length > 0 ||
    filters.aptitude.length > 0 ||
    filters.duration ||
    filters.sortBy;

  return (
    <AppLayout>
      <div className="min-h-screen pb-8 space-y-6">
        {/* Header */}
        <header className="px-4 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                Biblioteca
              </h1>
            </div>
            <LibraryFilters filters={filters} onFiltersChange={setFilters} />
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
          {/* Show filtered view or category carousels */}
          {hasActiveFilters || searchQuery ? (
            // Filtered results - show all matching
            <div className="px-4">
              <p className="text-sm text-muted-foreground mb-4">
                {filteredRoutines.length} resultado{filteredRoutines.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {filteredRoutines.map((routine) => (
                  <div key={routine.id} className="flex justify-center">
                    <div className="w-full max-w-[160px]">
                      <button
                        onClick={() => handleRoutineClick(routine.id)}
                        className="w-full group focus:outline-none"
                      >
                        {/* Reusing card structure inline for grid view */}
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border/30 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <div className={`absolute inset-0 bg-gradient-to-br ${
                            routine.category === "funcional"
                              ? "from-primary/80 to-primary/20"
                              : routine.category === "kinesiologia"
                              ? "from-[hsl(280,70%,60%)]/80 to-[hsl(280,70%,60%)]/20"
                              : "from-warning/80 to-warning/20"
                          }`} />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
                          
                          {/* Top overlay */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                            <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                              <span className="text-[10px] font-semibold text-white">
                                {routine.rating?.toFixed(1) || "—"}
                              </span>
                            </div>
                            <div className="bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex gap-0.5">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full border border-white/50 ${
                                    i <= (routine.difficulty === "Principiante" ? 1 : routine.difficulty === "Intermedio" ? 2 : 3)
                                      ? "bg-white"
                                      : "bg-transparent"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Bottom info */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-white bg-black/40 px-1.5 py-0.5 rounded">
                                {routine.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-left">
                          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                            {routine.title}
                          </h3>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Default view - category carousels
            <>
              <CategoryCarousel
                title="Funcional"
                description={categoryDescriptions.Funcional}
                routines={routinesByCategory.funcional}
                onRoutineClick={handleRoutineClick}
              />

              <CategoryCarousel
                title="Kinesiología"
                description={categoryDescriptions.Kinesiología}
                routines={routinesByCategory.kinesiologia}
                onRoutineClick={handleRoutineClick}
              />

              <CategoryCarousel
                title="Activación"
                description={categoryDescriptions.Activación}
                routines={routinesByCategory.activacion}
                onRoutineClick={handleRoutineClick}
              />
            </>
          )}
        </div>

        {/* Empty state */}
        {filteredRoutines.length === 0 && (
          <div className="px-4">
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">
                No se encontraron rutinas con esos criterios
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Entrenamiento;