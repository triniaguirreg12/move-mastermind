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
import { Plus, Search, Edit, Trash2, Star, Calendar, Copy, Dumbbell, Loader2 } from "lucide-react";
import CreateRoutineModal from "@/components/admin/routines/CreateRoutineModal";
import { Rutina, createEmptyRutina } from "@/components/admin/routines/types";
import { useToast } from "@/hooks/use-toast";
import { 
  useAllRoutinesWithDetails, 
  dbRoutineToAdminRutina,
  useDeleteRoutine,
} from "@/hooks/useRoutines";

type SortOption = "none" | "rating-desc" | "rating-asc" | "completed-desc" | "completed-asc";

const AdminProgramas = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState<Rutina | null>(null);

  // Fetch only PROGRAMAS from DB (tipo = "programa")
  const { data: programasData, isLoading, error } = useAllRoutinesWithDetails("programa");
  const deleteRoutineMutation = useDeleteRoutine();

  // Transform DB programs to Admin Rutina format
  const programas = useMemo(() => {
    if (!programasData) return [];
    return programasData.map(programa => {
      const adminRutina = dbRoutineToAdminRutina(programa, programa.blocks || []);
      return {
        ...adminRutina,
        _dbId: programa.id,
        _calculatedDuration: programa.calculatedDuration,
        _calculatedImplements: programa.calculatedImplements,
      };
    });
  }, [programasData]);

  const handleSavePrograma = (programa: Rutina, publish: boolean) => {
    setEditingPrograma(null);
    setIsCreateModalOpen(false);
  };

  const handleEditPrograma = (programa: Rutina & { _dbId?: string }) => {
    setEditingPrograma(programa);
  };

  const handleDuplicatePrograma = (programa: Rutina & { _dbId?: string }) => {
    const duplicado: Rutina = {
      ...programa,
      id: 0,
      nombre: `${programa.nombre} (copia)`,
      estado: "borrador",
      calificacion: undefined,
      vecesRealizada: 0,
    };
    delete (duplicado as any)._dbId;
    setEditingPrograma(duplicado);
    toast({
      title: "Duplicando programa",
      description: `Guardando como "${duplicado.nombre}"`,
    });
  };

  const handleDeletePrograma = (programa: Rutina & { _dbId?: string }) => {
    if (!programa._dbId) return;
    
    deleteRoutineMutation.mutate(programa._dbId, {
      onSuccess: () => {
        toast({
          title: "Programa eliminado",
          description: `"${programa.nombre}" ha sido eliminado.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "No se pudo eliminar el programa",
          variant: "destructive",
        });
      },
    });
  };

  const filteredAndSortedProgramas = useMemo(() => {
    let result = programas.filter((programa) => {
      if (searchTerm && !programa.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterEstado && programa.estado !== filterEstado) {
        return false;
      }
      return true;
    });

    if (sortBy !== "none") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "rating-desc":
            return (b.calificacion ?? -1) - (a.calificacion ?? -1);
          case "rating-asc":
            return (a.calificacion ?? 999) - (b.calificacion ?? 999);
          case "completed-desc":
            return (b.vecesRealizada ?? 0) - (a.vecesRealizada ?? 0);
          case "completed-asc":
            return (a.vecesRealizada ?? 0) - (b.vecesRealizada ?? 0);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [programas, searchTerm, filterEstado, sortBy]);

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
        <p>Error al cargar programas</p>
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
            <h1 className="text-2xl font-heading font-bold text-foreground">Programas</h1>
            <p className="text-muted-foreground">Biblioteca de programas ({programas.length})</p>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear Programa
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar programa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
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
              <SelectItem value="rating-desc">Mejor calificados</SelectItem>
              <SelectItem value="rating-asc">Peor calificados</SelectItem>
              <SelectItem value="completed-desc">Más realizados</SelectItem>
              <SelectItem value="completed-asc">Menos realizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedProgramas.map((programa) => {
            const duracionSemanas = (programa as any).duracionSemanas || 4;
            const implementos = (programa as any)._calculatedImplements || [];

            return (
              <Card
                key={(programa as any)._dbId || programa.id}
                className="bg-card border-border p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-[hsl(var(--category-funcional))]/20 text-[hsl(var(--category-funcional))]">
                      Funcional
                    </Badge>
                    <Badge
                      variant={programa.estado === "publicada" ? "default" : "outline"}
                      className={programa.estado === "borrador" ? "border-warning text-warning" : ""}
                    >
                      {programa.estado === "publicada" ? "Publicada" : "Borrador"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {programa.calificacion !== undefined ? (
                      <>
                        <span className="font-medium text-foreground">{programa.calificacion.toFixed(1)}</span>
                        <Star className="h-4 w-4 fill-warning text-warning" />
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {programa.nombre}
                </h3>

                {programa.descripcion && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {programa.descripcion}
                  </p>
                )}

                {/* Duration in weeks */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {duracionSemanas} semanas
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{programa.vecesRealizada ?? 0}</span> realizados
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
                      implementos.slice(0, 4).map((impl: string) => (
                        <Badge key={impl} variant="outline" className="text-xs border-border">
                          {impl}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs border-border">
                        Sin implemento
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Objective preview */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(programa.objetivo)
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
                      onClick={() => handleDuplicatePrograma(programa)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditPrograma(programa)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeletePrograma(programa)}
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

        {filteredAndSortedProgramas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No se encontraron programas</p>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
              Crear primer programa
            </Button>
          </div>
        )}

        {/* Create/Edit Modal */}
        <CreateRoutineModal
          open={isCreateModalOpen || editingPrograma !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              setEditingPrograma(null);
            }
          }}
          onSave={handleSavePrograma}
          rutina={editingPrograma}
          defaultTipo="programa"
        />
      </div>
    </TooltipProvider>
  );
};

export default AdminProgramas;