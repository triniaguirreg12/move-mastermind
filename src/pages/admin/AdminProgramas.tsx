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
import { Plus, Search, Edit, Trash2, Star, Calendar, Copy, Loader2 } from "lucide-react";
import CreateProgramModal from "@/components/admin/programs/CreateProgramModal";
import { useToast } from "@/hooks/use-toast";
import { usePrograms, useDeleteProgram, type Program } from "@/hooks/usePrograms";

type SortOption = "none" | "rating-desc" | "rating-asc" | "completed-desc" | "completed-asc";

const AdminProgramas = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const { data: programasData, isLoading, error } = usePrograms();
  const deleteProgramMutation = useDeleteProgram();

  const programas = programasData || [];

  const handleEditPrograma = (program: Program) => {
    setEditingProgram(program);
  };

  const handleDuplicatePrograma = (program: Program) => {
    // Open modal with a copy (without id to create new)
    const duplicated = {
      ...program,
      id: "", // Clear ID to indicate new program
      nombre: `${program.nombre} (copia)`,
      estado: "borrador",
    };
    setEditingProgram(duplicated as Program);
    toast({
      title: "Duplicando programa",
      description: `Guardando como "${duplicated.nombre}"`,
    });
  };

  const handleDeletePrograma = (program: Program) => {
    if (!program.id) return;
    
    deleteProgramMutation.mutate(program.id, {
      onSuccess: () => {
        toast({
          title: "Programa eliminado",
          description: `"${program.nombre}" ha sido eliminado.`,
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
            return ((b as any).calificacion ?? -1) - ((a as any).calificacion ?? -1);
          case "rating-asc":
            return ((a as any).calificacion ?? 999) - ((b as any).calificacion ?? 999);
          case "completed-desc":
            return ((b as any).veces_realizada ?? 0) - ((a as any).veces_realizada ?? 0);
          case "completed-asc":
            return ((a as any).veces_realizada ?? 0) - ((b as any).veces_realizada ?? 0);
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
            const duracionSemanas = programa.duracion_semanas || 4;
            const totalRoutines = (programa.weeks || []).reduce(
              (sum, week) => sum + (week.routines?.length || 0),
              0
            );

            return (
              <Card
                key={programa.id}
                className="bg-card border-border p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-[hsl(var(--category-funcional))]/20 text-[hsl(var(--category-funcional))]">
                      Programa
                    </Badge>
                    <Badge
                      variant={programa.estado === "publicada" ? "default" : "outline"}
                      className={programa.estado === "borrador" ? "border-warning text-warning" : ""}
                    >
                      {programa.estado === "publicada" ? "Publicada" : "Borrador"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {(programa as any).calificacion !== undefined && (programa as any).calificacion !== null ? (
                      <>
                        <span className="font-medium text-foreground">{(programa as any).calificacion.toFixed(1)}</span>
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

                {/* Duration and routines count */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {duracionSemanas} semanas
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{totalRoutines}</span> rutinas
                  </div>
                </div>

                {/* Week summary */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(programa.weeks || []).slice(0, 4).map((week, i) => (
                    <Badge key={week.id || i} variant="secondary" className="text-xs">
                      S{week.week_number}: {week.routines?.length || 0}
                    </Badge>
                  ))}
                  {(programa.weeks || []).length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{(programa.weeks || []).length - 4} más
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicatePrograma(programa)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditPrograma(programa)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeletePrograma(programa)}
                          disabled={deleteProgramMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
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
        <CreateProgramModal
          open={isCreateModalOpen || editingProgram !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              setEditingProgram(null);
            }
          }}
          onSave={() => {
            setEditingProgram(null);
            setIsCreateModalOpen(false);
          }}
          program={editingProgram}
        />
      </div>
    </TooltipProvider>
  );
};

export default AdminProgramas;
