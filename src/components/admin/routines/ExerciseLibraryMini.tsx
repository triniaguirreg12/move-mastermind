import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, GripVertical, X, Dumbbell } from "lucide-react";
import { Ejercicio } from "@/components/admin/CreateExerciseModal";
import { Button } from "@/components/ui/button";

const MECANICAS = ["Empuje", "Tracción", "Rotacional", "Locomoción", "Anti-movimiento", "Compuesto"];
const GRUPOS_MUSCULARES = ["Tren Superior", "Tren Inferior", "Core", "Full Body"];

interface ExerciseLibraryMiniProps {
  ejercicios: Ejercicio[];
  onDragStart: (e: React.DragEvent, ejercicio: Ejercicio) => void;
}

const ExerciseLibraryMini = ({ ejercicios, onDragStart }: ExerciseLibraryMiniProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMecanica, setFilterMecanica] = useState<string>("");
  const [filterGrupo, setFilterGrupo] = useState<string>("");

  const filteredEjercicios = useMemo(() => {
    return ejercicios.filter((ej) => {
      if (searchTerm && !ej.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterMecanica && !ej.mecanicas.includes(filterMecanica)) {
        return false;
      }
      if (filterGrupo && !ej.grupoMuscular.includes(filterGrupo)) {
        return false;
      }
      return true;
    });
  }, [ejercicios, searchTerm, filterMecanica, filterGrupo]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterMecanica("");
    setFilterGrupo("");
  };

  const hasFilters = searchTerm || filterMecanica || filterGrupo;

  return (
    <div className="flex flex-col h-full border border-border rounded-lg bg-card/50">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Biblioteca de Ejercicios</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {filteredEjercicios.length}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-sm bg-background border-border"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterMecanica} onValueChange={setFilterMecanica}>
            <SelectTrigger className="h-7 text-xs flex-1 bg-background border-border">
              <SelectValue placeholder="Mecánica" />
            </SelectTrigger>
            <SelectContent>
              {MECANICAS.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterGrupo} onValueChange={setFilterGrupo}>
            <SelectTrigger className="h-7 text-xs flex-1 bg-background border-border">
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              {GRUPOS_MUSCULARES.map((g) => (
                <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredEjercicios.map((ejercicio) => (
            <div
              key={ejercicio.id}
              draggable
              onDragStart={(e) => onDragStart(e, ejercicio)}
              className="group relative flex items-center gap-2 p-2 bg-background border border-border rounded-md cursor-grab hover:border-primary/50 hover:bg-primary/5 transition-all active:cursor-grabbing"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
              
              {ejercicio.thumbnail ? (
                <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                  <img
                    src={ejercicio.thumbnail}
                    alt={ejercicio.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{ejercicio.nombre}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {ejercicio.grupoMuscular.slice(0, 1).map((g) => (
                    <Badge key={g} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEjercicios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No se encontraron ejercicios</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Arrastra ejercicios a los bloques
        </p>
      </div>
    </div>
  );
};

export default ExerciseLibraryMini;
