import { useState, useMemo, useEffect } from "react";
import { Search, ArrowLeft, Filter, X, Loader2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LibraryCard } from "@/components/library/LibraryCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePublishedRoutines, routineToLibraryCard } from "@/hooks/useRoutines";

// Category info
const categoryInfo = {
  funcional: {
    title: "Funcional",
    description: "Rutinas diseñadas para mejorar el rendimiento físico general mediante movimientos compuestos y funcionales.",
    color: "text-primary",
  },
  kinesiologia: {
    title: "Kinesiología",
    description: "Sesiones enfocadas en rehabilitación, prevención de lesiones y mejora de la movilidad articular.",
    color: "text-[hsl(280,70%,60%)]",
  },
  activacion: {
    title: "Activación",
    description: "Rutinas cortas de calentamiento y activación muscular para preparar el cuerpo antes de la actividad.",
    color: "text-warning",
  },
};

// Filter options
const difficulties = [
  { id: "Principiante", label: "Principiante" },
  { id: "Intermedio", label: "Intermedio" },
  { id: "Avanzado", label: "Avanzado" },
];

const durations = [
  { id: "short", label: "< 15 min" },
  { id: "medium", label: "15-30 min" },
  { id: "long", label: "> 30 min" },
];

const aptitudes = [
  { id: "Fuerza", label: "Fuerza" },
  { id: "Potencia", label: "Potencia" },
  { id: "Agilidad", label: "Agilidad" },
  { id: "Coordinación", label: "Coordinación" },
  { id: "Estabilidad", label: "Estabilidad" },
  { id: "Velocidad", label: "Velocidad" },
  { id: "Resistencia", label: "Resistencia" },
  { id: "Movilidad", label: "Movilidad" },
];

const equipmentOptions = [
  { id: "Sin implemento", label: "Sin implemento" },
  { id: "Mancuerna", label: "Mancuerna" },
  { id: "Banda", label: "Banda" },
  { id: "Miniband", label: "Miniband" },
  { id: "Barra", label: "Barra" },
  { id: "Pesa rusa", label: "Pesa rusa" },
  { id: "Foam roller", label: "Foam roller" },
  { id: "Banda elástica", label: "Banda elástica" },
];

const sortOptions = [
  { id: "rating-desc", label: "Mejor calificadas" },
  { id: "completed-desc", label: "Más realizadas" },
  { id: "duration-asc", label: "Más cortas" },
  { id: "duration-desc", label: "Más largas" },
];

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
      )}
    >
      {children}
    </button>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const BibliotecaCategory = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<"routines" | "programs">("routines");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: [] as string[],
    equipment: [] as string[],
    duration: "",
    aptitude: [] as string[],
    sortBy: "",
  });

  // Apply query param filter for tipo
  useEffect(() => {
    const tipo = searchParams.get("tipo");
    if (tipo === "programa") {
      setContentType("programs");
    } else if (tipo === "rutina") {
      setContentType("routines");
    }
  }, [searchParams]);

  const { data: routines, isLoading, error } = usePublishedRoutines();

  const currentCategory = categoryInfo[category as keyof typeof categoryInfo];

  if (!currentCategory) {
    navigate("/entrenamiento");
    return null;
  }

  const isFuncional = category === "funcional";

  // Transform to library card format and filter by category
  const libraryRoutines = useMemo(() => {
    return (routines || [])
      .map(routineToLibraryCard)
      .filter((r) => r.category === category);
  }, [routines, category]);

  // Filter by content type (rutina vs programa) for Funcional category
  const filteredByType = useMemo(() => {
    if (!isFuncional) return libraryRoutines;
    const tipoFilter = contentType === "routines" ? "rutina" : "programa";
    return libraryRoutines.filter((r) => r.tipo === tipoFilter);
  }, [libraryRoutines, contentType, isFuncional]);

  // Filter and sort routines
  const filteredRoutines = useMemo(() => {
    let result = [...filteredByType];

    // Content type filter (only for funcional) - for now all are routines
    // Programs feature would need a separate table/flag

    // Equipment filter
    if (filters.equipment.length > 0) {
      result = result.filter((r) =>
        r.equipment.some((eq) => filters.equipment.includes(eq))
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.subtitle?.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (filters.difficulty.length > 0) {
      result = result.filter((r) => filters.difficulty.includes(r.difficulty));
    }

    // Duration filter - only applies to routines, not programs
    if (filters.duration) {
      result = result.filter((r) => {
        // Programs don't use minute-based duration filter
        if (r.tipo === "programa") return true;
        const mins = r.durationValue;
        if (!mins) return true; // Include if duration not set
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
            // Programs (weeks) should sort differently than routines (minutes)
            // For now, programs go to end when sorting by duration
            if (a.tipo === "programa" && b.tipo !== "programa") return 1;
            if (b.tipo === "programa" && a.tipo !== "programa") return -1;
            return (a.durationValue || 0) - (b.durationValue || 0);
          case "duration-desc":
            if (a.tipo === "programa" && b.tipo !== "programa") return 1;
            if (b.tipo === "programa" && a.tipo !== "programa") return -1;
            return (b.durationValue || 0) - (a.durationValue || 0);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [filteredByType, searchQuery, filters]);

  const toggleArrayFilter = (key: keyof typeof filters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    setFilters({ ...filters, [key]: newArray });
  };

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      difficulty: [],
      equipment: [],
      duration: "",
      aptitude: [],
      sortBy: "",
    });
  };

  const activeFiltersCount =
    filters.difficulty.length +
    filters.equipment.length +
    filters.aptitude.length +
    (filters.duration ? 1 : 0) +
    (filters.sortBy ? 1 : 0);

  const handleRoutineClick = (id: string | number) => {
    navigate(`/rutina/${id}`, { state: { from: window.location.pathname } });
  };

  return (
    <AppLayout>
      <div className="min-h-screen pb-8 space-y-4">
        {/* Header */}
        <header className="px-4 pt-6 space-y-4">
          {/* Back + Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate("/entrenamiento")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className={cn("font-display text-2xl font-bold", currentCategory.color)}>
              {currentCategory.title}
            </h1>
          </div>

          {/* Search + Filter layout */}
          {isFuncional ? (
            <>
              {/* Full width search for Funcional */}
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

              {/* Rutinas/Programas toggle + Filter */}
              <div className="flex items-center justify-between">
                <div className="flex bg-card rounded-lg p-1 border border-border/50">
                  <button
                    onClick={() => setContentType("routines")}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                      contentType === "routines"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Rutinas
                  </button>
                  <button
                    onClick={() => setContentType("programs")}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                      contentType === "programs"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Programas
                  </button>
                </div>

                {/* Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 relative">
                      <Filter className="w-4 h-4" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                    <SheetHeader className="flex flex-row items-center justify-between">
                      <SheetTitle>Filtros y orden</SheetTitle>
                      {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="w-4 h-4 mr-1" />
                          Limpiar
                        </Button>
                      )}
                    </SheetHeader>

                    <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pb-6">
                      {/* Sort By */}
                      <FilterSection title="Ordenar por">
                        {sortOptions.map((option) => (
                          <FilterChip
                            key={option.id}
                            selected={filters.sortBy === option.id}
                            onClick={() =>
                              setFilter("sortBy", filters.sortBy === option.id ? "" : option.id)
                            }
                          >
                            {option.label}
                          </FilterChip>
                        ))}
                      </FilterSection>

                      {/* Difficulty */}
                      <FilterSection title="Dificultad">
                        {difficulties.map((option) => (
                          <FilterChip
                            key={option.id}
                            selected={filters.difficulty.includes(option.id)}
                            onClick={() => toggleArrayFilter("difficulty", option.id)}
                          >
                            {option.label}
                          </FilterChip>
                        ))}
                      </FilterSection>

                      {/* Equipment */}
                      <FilterSection title="Implementos">
                        {equipmentOptions.map((option) => (
                          <FilterChip
                            key={option.id}
                            selected={filters.equipment.includes(option.id)}
                            onClick={() => toggleArrayFilter("equipment", option.id)}
                          >
                            {option.label}
                          </FilterChip>
                        ))}
                      </FilterSection>

                      {/* Duration */}
                      <FilterSection title="Duración">
                        {durations.map((option) => (
                          <FilterChip
                            key={option.id}
                            selected={filters.duration === option.id}
                            onClick={() =>
                              setFilter("duration", filters.duration === option.id ? "" : option.id)
                            }
                          >
                            {option.label}
                          </FilterChip>
                        ))}
                      </FilterSection>

                      {/* Aptitudes */}
                      <FilterSection title="Aptitud principal">
                        {aptitudes.map((option) => (
                          <FilterChip
                            key={option.id}
                            selected={filters.aptitude.includes(option.id)}
                            onClick={() => toggleArrayFilter("aptitude", option.id)}
                          >
                            {option.label}
                          </FilterChip>
                        ))}
                      </FilterSection>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
                      <SheetClose asChild>
                        <Button className="w-full">Aplicar filtros</Button>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            /* Narrower search with filter button for Kinesiología and Activación */
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar rutinas..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 relative shrink-0">
                    <Filter className="w-4 h-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                  <SheetHeader className="flex flex-row items-center justify-between">
                    <SheetTitle>Filtros y orden</SheetTitle>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-1" />
                        Limpiar
                      </Button>
                    )}
                  </SheetHeader>

                  <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pb-6">
                    {/* Sort By */}
                    <FilterSection title="Ordenar por">
                      {sortOptions.map((option) => (
                        <FilterChip
                          key={option.id}
                          selected={filters.sortBy === option.id}
                          onClick={() =>
                            setFilter("sortBy", filters.sortBy === option.id ? "" : option.id)
                          }
                        >
                          {option.label}
                        </FilterChip>
                      ))}
                    </FilterSection>

                    {/* Difficulty */}
                    <FilterSection title="Dificultad">
                      {difficulties.map((option) => (
                        <FilterChip
                          key={option.id}
                          selected={filters.difficulty.includes(option.id)}
                          onClick={() => toggleArrayFilter("difficulty", option.id)}
                        >
                          {option.label}
                        </FilterChip>
                      ))}
                    </FilterSection>

                    {/* Equipment */}
                    <FilterSection title="Implementos">
                      {equipmentOptions.map((option) => (
                        <FilterChip
                          key={option.id}
                          selected={filters.equipment.includes(option.id)}
                          onClick={() => toggleArrayFilter("equipment", option.id)}
                        >
                          {option.label}
                        </FilterChip>
                      ))}
                    </FilterSection>

                    {/* Duration */}
                    <FilterSection title="Duración">
                      {durations.map((option) => (
                        <FilterChip
                          key={option.id}
                          selected={filters.duration === option.id}
                          onClick={() =>
                            setFilter("duration", filters.duration === option.id ? "" : option.id)
                          }
                        >
                          {option.label}
                        </FilterChip>
                      ))}
                    </FilterSection>

                    {/* Aptitudes */}
                    <FilterSection title="Aptitud principal">
                      {aptitudes.map((option) => (
                        <FilterChip
                          key={option.id}
                          selected={filters.aptitude.includes(option.id)}
                          onClick={() => toggleArrayFilter("aptitude", option.id)}
                        >
                          {option.label}
                        </FilterChip>
                      ))}
                    </FilterSection>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
                    <SheetClose asChild>
                      <Button className="w-full">Aplicar filtros</Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="px-4">
            <div className="glass-card p-8 text-center">
              <p className="text-destructive">Error al cargar las rutinas</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !error && (
          <div className="px-4">
            <p className="text-sm text-muted-foreground mb-4">
              {filteredRoutines.length} resultado{filteredRoutines.length !== 1 ? "s" : ""}
            </p>
            
            {filteredRoutines.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredRoutines.map((routine) => (
                  <div key={routine.id} className="flex justify-center">
                    <div className="w-full max-w-[160px]">
                      <LibraryCard
                        {...routine}
                        onClick={() => handleRoutineClick(routine.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">
                  {libraryRoutines.length === 0 
                    ? "No hay rutinas disponibles en esta categoría. Crea rutinas desde el panel de administración."
                    : "No se encontraron rutinas con esos criterios"
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BibliotecaCategory;
