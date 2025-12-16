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
import { Plus, Search, Edit, Trash2, Star, Clock, Copy, Dumbbell, Timer } from "lucide-react";
import CreateRoutineModal from "@/components/admin/routines/CreateRoutineModal";
import { Rutina, calcularDuracionRutina, obtenerImplementosRutina } from "@/components/admin/routines/types";
import { useToast } from "@/hooks/use-toast";

// Mock exercises for demo purposes
const mockEjercicio = {
  id: 1,
  nombre: "Sentadilla",
  tips: "",
  dificultad: "Intermedio" as const,
  mecanicas: ["Compuesto"],
  grupoMuscular: ["Tren Inferior"],
  musculosPrincipales: ["Cuádriceps", "Glúteos"],
  aptitudesPrimarias: ["Fuerza"],
  aptitudesSecundarias: ["Estabilidad"],
  implementos: ["Mancuerna"],
  video: null,
  thumbnail: null,
};

const mockEjercicio2 = {
  id: 2,
  nombre: "Plancha",
  tips: "",
  dificultad: "Principiante" as const,
  mecanicas: ["Anti-movimiento"],
  grupoMuscular: ["Core"],
  musculosPrincipales: ["Zona media"],
  aptitudesPrimarias: ["Estabilidad"],
  aptitudesSecundarias: ["Resistencia"],
  implementos: ["Sin implemento"],
  video: null,
  thumbnail: null,
};

const mockEjercicio3 = {
  id: 3,
  nombre: "Saltos",
  tips: "",
  dificultad: "Avanzado" as const,
  mecanicas: ["Locomoción"],
  grupoMuscular: ["Full Body"],
  musculosPrincipales: ["Cuádriceps"],
  aptitudesPrimarias: ["Potencia"],
  aptitudesSecundarias: ["Agilidad"],
  implementos: ["Banda"],
  video: null,
  thumbnail: null,
};

const rutinasIniciales: Rutina[] = [
  {
    id: 1,
    nombre: "Full Body Strength",
    descripcion: "Rutina completa de fuerza para todo el cuerpo",
    categoria: "Funcional",
    dificultad: "Intermedio",
    dificultadMode: "auto",
    objetivoMode: "auto",
    objetivo: { fuerza: 8, potencia: 6, agilidad: 4, coordinacion: 5, velocidad: 3, estabilidad: 7, movilidad: 4, resistencia: 6 },
    bloques: [
      {
        id: "b1",
        nombre: "Bloque principal",
        ejercicios: [
          { id: "e1", ejercicio: mockEjercicio, tipoEjecucion: "tiempo", tiempo: 45, repeticiones: 0 },
          { id: "e2", ejercicio: mockEjercicio3, tipoEjecucion: "tiempo", tiempo: 30, repeticiones: 0 },
        ],
        repetirBloque: true,
        series: 3,
        descansoEntreEjercicios: 30,
        descansoEntreSeries: 60,
        usarMismoDescanso: false,
      }
    ],
    estado: "publicada",
    descansoEntreBloques: 60,
    portadaType: "",
    calificacion: 4.6,
    vecesRealizada: 127,
  },
  {
    id: 2,
    nombre: "Activación Matutina",
    descripcion: "Rutina corta para comenzar el día con energía",
    categoria: "Activación",
    dificultad: "Principiante",
    dificultadMode: "manual",
    objetivoMode: "manual",
    objetivo: { fuerza: 3, potencia: 2, agilidad: 5, coordinacion: 4, velocidad: 3, estabilidad: 4, movilidad: 7, resistencia: 4 },
    bloques: [
      {
        id: "b2",
        nombre: "Activación",
        ejercicios: [
          { id: "e3", ejercicio: mockEjercicio2, tipoEjecucion: "tiempo", tiempo: 60, repeticiones: 0 },
        ],
        repetirBloque: false,
        series: 1,
        descansoEntreEjercicios: 15,
        descansoEntreSeries: 30,
        usarMismoDescanso: true,
      }
    ],
    estado: "publicada",
    descansoEntreBloques: 30,
    portadaType: "",
    calificacion: 4.2,
    vecesRealizada: 89,
  },
  {
    id: 3,
    nombre: "Recuperación Kinesiológica",
    descripcion: "Ejercicios de recuperación y movilidad guiados",
    categoria: "Kinesiología",
    dificultad: "Principiante",
    dificultadMode: "auto",
    objetivoMode: "auto",
    objetivo: { fuerza: 2, potencia: 1, agilidad: 3, coordinacion: 4, velocidad: 2, estabilidad: 6, movilidad: 9, resistencia: 3 },
    bloques: [
      {
        id: "b3",
        nombre: "Movilidad",
        ejercicios: [
          { id: "e4", ejercicio: mockEjercicio2, tipoEjecucion: "repeticiones", tiempo: 0, repeticiones: 12 },
        ],
        repetirBloque: true,
        series: 2,
        descansoEntreEjercicios: 20,
        descansoEntreSeries: 45,
        usarMismoDescanso: false,
      }
    ],
    estado: "borrador",
    descansoEntreBloques: 45,
    portadaType: "",
    calificacion: undefined,
    vecesRealizada: 0,
  },
  {
    id: 4,
    nombre: "HIIT Funcional",
    descripcion: "Entrenamiento de alta intensidad",
    categoria: "Funcional",
    dificultad: "Avanzado",
    dificultadMode: "auto",
    objetivoMode: "auto",
    objetivo: { fuerza: 6, potencia: 8, agilidad: 7, coordinacion: 6, velocidad: 8, estabilidad: 5, movilidad: 3, resistencia: 9 },
    bloques: [
      {
        id: "b4",
        nombre: "HIIT",
        ejercicios: [
          { id: "e5", ejercicio: mockEjercicio, tipoEjecucion: "tiempo", tiempo: 40, repeticiones: 0 },
          { id: "e6", ejercicio: mockEjercicio3, tipoEjecucion: "tiempo", tiempo: 40, repeticiones: 0 },
        ],
        repetirBloque: true,
        series: 4,
        descansoEntreEjercicios: 20,
        descansoEntreSeries: 60,
        usarMismoDescanso: false,
      }
    ],
    estado: "publicada",
    descansoEntreBloques: 90,
    portadaType: "",
    calificacion: 4.8,
    vecesRealizada: 203,
  },
];

type SortOption = "none" | "rating-desc" | "rating-asc" | "completed-desc" | "completed-asc";

const AdminRutinas = () => {
  const { toast } = useToast();
  const [rutinas, setRutinas] = useState<Rutina[]>(rutinasIniciales);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRutina, setEditingRutina] = useState<Rutina | null>(null);

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Funcional: "bg-[hsl(var(--category-funcional))]/20 text-[hsl(var(--category-funcional))]",
      Kinesiología: "bg-[hsl(var(--category-kinesiologia))]/20 text-[hsl(var(--category-kinesiologia))]",
      Activación: "bg-[hsl(var(--category-activacion))]/20 text-[hsl(var(--category-activacion))]",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  const formatDuration = (segundos: number): string => {
    const minutos = Math.round(segundos / 60);
    return `${minutos} min`;
  };

  const handleSaveRutina = (rutina: Rutina, publish: boolean) => {
    if (rutina.id === 0) {
      const newRutina = { ...rutina, id: Date.now(), vecesRealizada: 0 };
      setRutinas([...rutinas, newRutina]);
    } else {
      setRutinas(rutinas.map((r) => (r.id === rutina.id ? rutina : r)));
    }
    setEditingRutina(null);
  };

  const handleEditRutina = (rutina: Rutina) => {
    setEditingRutina(rutina);
  };

  const handleDuplicateRutina = (rutina: Rutina) => {
    const duplicada: Rutina = {
      ...rutina,
      id: Date.now(),
      nombre: `${rutina.nombre} (copia)`,
      estado: "borrador",
      calificacion: undefined,
      vecesRealizada: 0,
    };
    setRutinas([...rutinas, duplicada]);
    toast({
      title: "Rutina duplicada",
      description: `"${rutina.nombre}" ha sido duplicada como borrador.`,
    });
  };

  const handleDeleteRutina = (rutina: Rutina) => {
    setRutinas(rutinas.filter((r) => r.id !== rutina.id));
    toast({
      title: "Rutina eliminada",
      description: `"${rutina.nombre}" ha sido eliminada.`,
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
            // Higher rating first, undefined ratings last
            const ratingA = a.calificacion ?? -1;
            const ratingB = b.calificacion ?? -1;
            if (ratingA === ratingB) {
              // Tiebreaker: more completed first
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
              // Tiebreaker: higher rating first
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
            const duracion = calcularDuracionRutina(rutina);
            const implementos = obtenerImplementosRutina(rutina);
            const totalEjercicios = rutina.bloques.reduce((acc, b) => acc + b.ejercicios.length, 0);

            return (
              <Card
                key={rutina.id}
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
                    {duracion > 0 ? formatDuration(duracion) : "—"}
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
                        {implementos.slice(0, 4).map((impl) => (
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
