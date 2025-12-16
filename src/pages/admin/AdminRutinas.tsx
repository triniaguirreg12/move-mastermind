import { useState } from "react";
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
import { Plus, Search, Edit, Trash2, Star, Clock, Copy } from "lucide-react";
import CreateRoutineModal from "@/components/admin/routines/CreateRoutineModal";
import { Rutina } from "@/components/admin/routines/types";
import { useToast } from "@/hooks/use-toast";

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
    bloques: [],
    estado: "publicada",
    descansoEntreBloques: 60,
    portadaType: "",
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
    bloques: [],
    estado: "publicada",
    descansoEntreBloques: 30,
    portadaType: "",
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
    bloques: [],
    estado: "borrador",
    descansoEntreBloques: 45,
    portadaType: "",
  },
];

const AdminRutinas = () => {
  const { toast } = useToast();
  const [rutinas, setRutinas] = useState<Rutina[]>(rutinasIniciales);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRutina, setEditingRutina] = useState<Rutina | null>(null);

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Funcional: "bg-primary/20 text-primary",
      Kinesiología: "bg-accent/20 text-accent",
      Activación: "bg-warning/20 text-warning",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  const handleSaveRutina = (rutina: Rutina, publish: boolean) => {
    if (rutina.id === 0) {
      // Create new
      const newRutina = { ...rutina, id: Date.now() };
      setRutinas([...rutinas, newRutina]);
    } else {
      // Update existing
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

  const filteredRutinas = rutinas.filter((rutina) => {
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

  return (
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
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRutinas.map((rutina) => (
          <Card
            key={rutina.id}
            className="bg-card border-border p-5 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={getCategoriaColor(rutina.categoria)}>{rutina.categoria}</Badge>
                <Badge
                  variant={rutina.estado === "publicada" ? "default" : "outline"}
                  className={rutina.estado === "borrador" ? "border-warning text-warning" : ""}
                >
                  {rutina.estado === "publicada" ? "Publicada" : "Borrador"}
                </Badge>
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

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {rutina.bloques.length} bloques
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
        ))}
      </div>

      {filteredRutinas.length === 0 && (
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
  );
};

export default AdminRutinas;
