import { useState, useMemo } from "react";
import { Search, Library, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryCarousel } from "@/components/library/CategoryCarousel";
import { usePublishedRoutines, routineToLibraryCard } from "@/hooks/useRoutines";

// Category descriptions for info tooltips
const categoryDescriptions = {
  Funcional: "Rutinas diseñadas para mejorar el rendimiento físico general mediante movimientos compuestos y funcionales.",
  Kinesiología: "Sesiones enfocadas en rehabilitación, prevención de lesiones y mejora de la movilidad articular.",
  Activación: "Rutinas cortas de calentamiento y activación muscular para preparar el cuerpo antes de la actividad.",
};

const Entrenamiento = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: routines, isLoading, error } = usePublishedRoutines();

  // Transform to library card format
  const libraryRoutines = useMemo(() => {
    return (routines || []).map(routineToLibraryCard);
  }, [routines]);

  // Filter routines by search only
  const filteredRoutines = useMemo(() => {
    if (!searchQuery) return libraryRoutines;
    
    const query = searchQuery.toLowerCase();
    return libraryRoutines.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.subtitle?.toLowerCase().includes(query)
    );
  }, [searchQuery, libraryRoutines]);

  // Group by category
  const routinesByCategory = useMemo(() => {
    return {
      funcional: filteredRoutines.filter((r) => r.category === "funcional"),
      kinesiologia: filteredRoutines.filter((r) => r.category === "kinesiologia"),
      activacion: filteredRoutines.filter((r) => r.category === "activacion"),
    };
  }, [filteredRoutines]);

  const handleRoutineClick = (id: string | number) => {
    navigate(`/rutina/${id}`, { state: { from: "/entrenamiento" } });
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

        {/* Empty State - No routines yet */}
        {!isLoading && !error && libraryRoutines.length === 0 && (
          <div className="px-4">
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">
                No hay rutinas disponibles todavía. Crea rutinas desde el panel de administración.
              </p>
            </div>
          </div>
        )}

        {/* Categories with Carousels */}
        {!isLoading && !error && libraryRoutines.length > 0 && (
          <div className="space-y-4">
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
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Entrenamiento;
