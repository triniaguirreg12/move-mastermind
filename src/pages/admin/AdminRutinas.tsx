import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, Edit, Trash2, Star, Clock, Copy, Dumbbell, Timer, Loader2 } from "lucide-react";
import CreateRoutineModal from "@/components/admin/routines/CreateRoutineModal";
import { Rutina, createEmptyRutina } from "@/components/admin/routines/types";
import { useToast } from "@/hooks/use-toast";
import { 
  useAllRoutinesWithDetails, 
  dbRoutineToAdminRutina,
  useDeleteRoutine,
} from "@/hooks/useRoutines";

type SortOption = "none" | "rating-desc" | "rating-asc" | "completed-desc" | "completed-asc";

const AdminRutinas = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRutina, setEditingRutina] = useState<Rutina | null>(null);

  // Fetch real data from DB
  const { data: routinesData, isLoading, error } = useAllRoutinesWithDetails();
  const deleteRoutineMutation = useDeleteRoutine();

  // Transform DB routines to Admin Rutina format
  const rutinas = useMemo(() => {
    if (!routinesData) return [];
    return routinesData.map(routine => {
      const adminRutina = dbRoutineToAdminRutina(routine, routine.blocks || []);
      // Attach calculated values and DB id for reference
      return {
        ...adminRutina,
        _dbId: routine.id,
        _calculatedDuration: routine.calculatedDuration,
        _calculatedImplements: routine.calculatedImplements,
      };
    });
  }, [routinesData]);

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Funcional: "bg-[hsl(var(--category-funcional))]/20 text-[hsl(var(--category-funcional))]",
      Kinesiología: "bg-[hsl(var(--category-kinesiologia))]/20 text-[hsl(var(--category-kinesiologia))]",
      Activación: "bg-[hsl(var(--category-activacion))]/20 text-[hsl(var(--category-activacion))]",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  const formatDuration = (minutos: number): string => {
    return `${minutos} min`;
  };

  const handleSaveRutina = (rutina: Rutina, publish: boolean) => {
    // This will be handled by the modal which uses the mutation hooks
    setEditingRutina(null);
    setIsCreateModalOpen(false);
  };

  const handleEditRutina = (rutina: Rutina & { _dbId?: string }) => {
    // Store the DB id for updates
    setEditingRutina(rutina);
  };

  const handleDuplicateRutina = (rutina: Rutina & { _dbId?: string }) => {
    // Create a copy without the DB id to create a new routine
    const duplicada: Rutina = {
      ...rutina,
      id: 0,
      nombre: `${rutina.nombre} (copia)`,
      estado: "borrador",
      calificacion: undefined,
      vecesRealizada: 0,
    };
    // Remove DB reference
    delete (duplicada as any)._dbId;
    setEditingRutina(duplicada);
    toast({
      title: "Duplicando rutina",
      description: `Guardando como "${duplicada.nombre}"`,
    });
  };

  const handleDeleteRutina = (rutina: Rutina & { _dbId?: string }) => {
    if (!rutina._dbId) return;
    
    deleteRoutineMutation.mutate(rutina._dbId, {
      onSuccess: () => {
        toast({
          title: "Rutina eliminada",
          description: `"${rutina.nombre}" ha sido eliminada.`,
        });
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: "No se pudo eliminar la rutina",
          variant: "destructive",
        });
      },
    });
  };

  const filteredAndSortedRutinas = useMemo(() => {
    // First filter
    let result = rutinas.filter((rutina) => {
      if (searchTerm && !rutina.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterCategoria && rutina.categoria !== filterCategoria) {
        return false;
      }
      if (filterEstado && rutina.estado !== filterEstado) {
        return false;
      }
      return true;
    });

    // Then sort
    if (sortBy !== "none") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "rating-desc":
            const ratingA = a.calificacion ?? -1;
            const ratingB = b.calificacion ?? -1;
            if (ratingA === ratingB) {
              return (b.vecesRealizada ?? 0) - (a.vecesRealizada ?? 0);
            }
            return ratingB - ratingA;
          case "rating-asc":
            const ratingAscA = a.calificacion ?? 999;
            const ratingAscB = b.calificacion ?? 999;
            if (ratingAscA === ratingAscB) {
              return (a.vecesRealizada ?? 0) - (b.vecesRealizada ?? 0);
            }
            return ratingAscA - ratingAscB;
          case "completed-desc":
            const completedA = a.vecesRealizada ?? 0;
            const completedB = b.vecesRealizada ?? 0;
            if (completedA === completedB) {
              return (b.calificacion ?? 0) - (a.calificacion ?? 0);
            }
            return completedB - completedA;
          case "completed-asc":
            const completedAscA = a.vecesRealizada ?? 0;
            const completedAscB = b.vecesRealizada ?? 0;
            if (completedAscA === completedAscB) {
              return (a.calificacion ?? 0) - (b.calificacion ?? 0);
            }
            return completedAscA - completedAscB;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [rutinas, searchTerm, filterCategoria, filterEstado, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <p>Error al cargar rutinas</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Rutinas</h1>
            <p className="text-muted-foreground">Biblioteca de rutinas ({rutinas.length})</p>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear Rutina
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar rutina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Funcional">Funcional</SelectItem>
              <SelectItem value="Kinesiología">Kinesiología</SelectItem>
              <SelectItem value="Activación">Activación</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publicada">Publicada</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[200px] bg-card border-border">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin ordenar</SelectItem>
              <SelectItem value="rating-desc">Mejor calificadas</SelectItem>
              <SelectItem value="rating-asc">Peor calificadas</SelectItem>
              <SelectItem value="completed-desc">Más realizadas</SelectItem>
              <SelectItem value="completed-asc">Menos realizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedRutinas.map((rutina) => {
            // Use pre-calculated values from DB query
            const duracionMinutos = (rutina as any)._calculatedDuration || 0;
            const implementos = (rutina as any)._calculatedImplements || [];
            const totalEjercicios = rutina.bloques.reduce((acc, b) => acc + b.ejercicios.length, 0);

            return (
              <Card
                key={rutina._dbId || rutina.id}
                className="bg-card border-border p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getCategoriaColor(rutina.categoria)}>{rutina.categoria}</Badge>
                    <Badge
                      variant={rutina.estado === "publicada" ? "default" : "outline"}
                      className={rutina.estado === "borrador" ? "border-warning text-warning" : ""}
                    >
                      {rutina.estado === "publicada" ? "Publicada" : "Borrador"}
                    </Badge>
                  </div>
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-sm">
                    {rutina.calificacion !== undefined ? (
                      <>
                        <span className="font-medium text-foreground">{rutina.calificacion.toFixed(1)}</span>
                        <Star className="h-4 w-4 fill-warning text-warning" />
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {rutina.nombre}
                </h3>

                {rutina.descripcion && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {rutina.descripcion}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {rutina.bloques.length} bloques
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    {duracionMinutos > 0 ? formatDuration(duracionMinutos) : "—"}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{rutina.vecesRealizada ?? 0}</span> realizadas
                  </div>
                </div>

                {/* Implements */}
                <div className="flex items-center gap-2 mb-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dumbbell className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Implementos requeridos</TooltipContent>
                  </Tooltip>
                  <div className="flex flex-wrap gap-1">
                    {implementos.length > 0 ? (
                      <>
                        {implementos.slice(0, 4).map((impl: string) => (
                          <Badge key={impl} variant="outline" className="text-xs border-border">
                            {impl}
                          </Badge>
                        ))}
                        {implementos.length > 4 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs border-border">
                                +{implementos.length - 4}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {implementos.slice(4).join(", ")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs border-border">
                        Sin implemento
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Objective preview */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(rutina.objetivo)
                    .filter(([_, value]) => value >= 6)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs capitalize">
                        {key}: {value}
                      </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicateRutina(rutina)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditRutina(rutina)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteRutina(rutina)}
                      disabled={deleteRoutineMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredAndSortedRutinas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No se encontraron rutinas</p>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
              Crear primera rutina
            </Button>
          </div>
        )}

        {/* Create/Edit Modal */}
        <CreateRoutineModal
          open={isCreateModalOpen || editingRutina !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              setEditingRutina(null);
            }
          }}
          onSave={handleSaveRutina}
          rutina={editingRutina}
        />
      </div>
    </TooltipProvider>
  );
};

export default AdminRutinas;
