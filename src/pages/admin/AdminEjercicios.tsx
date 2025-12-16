import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Play, X } from "lucide-react";
import CreateExerciseModal from "@/components/admin/CreateExerciseModal";

// Filter options matching the creation modal exactly
const MECANICAS = ["Empuje", "Tracción", "Rotacional", "Locomoción", "Anti-movimiento", "Compuesto"];
const GRUPOS_MUSCULARES = ["Tren Superior", "Tren Inferior", "Core", "Full Body"];
const MUSCULOS_PRINCIPALES = ["Bíceps", "Gemelos", "Glúteos", "Cuádriceps", "Espalda", "Hombros", "Pectoral", "Tríceps", "Zona media"];
const APTITUDES = ["Fuerza", "Potencia", "Agilidad", "Coordinación", "Resistencia", "Estabilidad", "Movilidad", "Velocidad"];
const IMPLEMENTOS = ["Sin implemento", "Banda", "Mancuerna", "Miniband"];

// Updated exercise data structure matching creation modal
interface Ejercicio {
  id: number;
  nombre: string;
  tips: string;
  mecanicas: string[];
  grupoMuscular: string[];
  musculosPrincipales: string[];
  aptitudesPrimarias: string[];
  aptitudesSecundarias: string[];
  implementos: string[];
  video: string | null;
  thumbnail: string | null;
}

const ejercicios: Ejercicio[] = [
  {
    id: 1,
    nombre: "Sentadilla con mancuerna",
    tips: "Mantén la espalda recta. Baja hasta que los muslos estén paralelos al suelo.",
    mecanicas: ["Compuesto"],
    grupoMuscular: ["Tren Inferior"],
    musculosPrincipales: ["Glúteos", "Cuádriceps"],
    aptitudesPrimarias: ["Fuerza"],
    aptitudesSecundarias: ["Estabilidad"],
    implementos: ["Mancuerna"],
    video: "https://www.youtube.com/embed/YaXPRqUwItQ",
    thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=120&h=80&fit=crop",
  },
  {
    id: 2,
    nombre: "Peso muerto rumano",
    tips: "Mantén las rodillas ligeramente flexionadas. Controla el descenso.",
    mecanicas: ["Tracción"],
    grupoMuscular: ["Tren Inferior"],
    musculosPrincipales: ["Glúteos", "Espalda"],
    aptitudesPrimarias: ["Fuerza"],
    aptitudesSecundarias: ["Movilidad"],
    implementos: ["Mancuerna"],
    video: "https://www.youtube.com/embed/jEy_czb3RKA",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=80&fit=crop",
  },
  {
    id: 3,
    nombre: "Press de banca",
    tips: "Baja la barra al pecho con control. No rebotes.",
    mecanicas: ["Empuje"],
    grupoMuscular: ["Tren Superior"],
    musculosPrincipales: ["Pectoral", "Tríceps"],
    aptitudesPrimarias: ["Fuerza", "Potencia"],
    aptitudesSecundarias: [],
    implementos: ["Mancuerna"],
    video: "https://www.youtube.com/embed/rT7DgCr-3pg",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=80&fit=crop",
  },
  {
    id: 4,
    nombre: "Plancha frontal",
    tips: "Mantén el cuerpo en línea recta. No dejes caer las caderas.",
    mecanicas: ["Anti-movimiento"],
    grupoMuscular: ["Core"],
    musculosPrincipales: ["Zona media"],
    aptitudesPrimarias: ["Estabilidad", "Resistencia"],
    aptitudesSecundarias: ["Fuerza"],
    implementos: ["Sin implemento"],
    video: "https://www.youtube.com/embed/pSHjTRCQxIw",
    thumbnail: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=120&h=80&fit=crop",
  },
  {
    id: 5,
    nombre: "Burpees",
    tips: "Explosivo en la subida. Controla la caída al suelo.",
    mecanicas: ["Compuesto", "Locomoción"],
    grupoMuscular: ["Full Body"],
    musculosPrincipales: ["Cuádriceps", "Pectoral", "Zona media"],
    aptitudesPrimarias: ["Resistencia", "Potencia"],
    aptitudesSecundarias: ["Agilidad", "Coordinación"],
    implementos: ["Sin implemento"],
    video: "https://www.youtube.com/embed/dZgVxmf6jkA",
    thumbnail: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=120&h=80&fit=crop",
  },
  {
    id: 6,
    nombre: "Elevación de gemelos",
    tips: "Sube hasta la máxima contracción. Baja controlado.",
    mecanicas: ["Empuje"],
    grupoMuscular: ["Tren Inferior"],
    musculosPrincipales: ["Gemelos"],
    aptitudesPrimarias: ["Fuerza"],
    aptitudesSecundarias: ["Estabilidad"],
    implementos: ["Mancuerna"],
    video: null,
    thumbnail: null,
  },
  {
    id: 7,
    nombre: "Rotación con banda",
    tips: "Controla el movimiento rotacional. Mantén el core activado.",
    mecanicas: ["Rotacional"],
    grupoMuscular: ["Core"],
    musculosPrincipales: ["Zona media", "Espalda"],
    aptitudesPrimarias: ["Coordinación", "Estabilidad"],
    aptitudesSecundarias: ["Fuerza"],
    implementos: ["Banda"],
    video: null,
    thumbnail: null,
  },
  {
    id: 8,
    nombre: "Caminata lateral con miniband",
    tips: "Mantén tensión constante en la banda. Pasos controlados.",
    mecanicas: ["Locomoción"],
    grupoMuscular: ["Tren Inferior"],
    musculosPrincipales: ["Glúteos"],
    aptitudesPrimarias: ["Estabilidad"],
    aptitudesSecundarias: ["Fuerza", "Coordinación"],
    implementos: ["Miniband"],
    video: null,
    thumbnail: null,
  },
];

const AdminEjercicios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; nombre: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter states
  const [filterMecanica, setFilterMecanica] = useState<string>("");
  const [filterGrupoMuscular, setFilterGrupoMuscular] = useState<string>("");
  const [filterMusculo, setFilterMusculo] = useState<string>("");
  const [filterAptitudPrimaria, setFilterAptitudPrimaria] = useState<string>("");
  const [filterAptitudSecundaria, setFilterAptitudSecundaria] = useState<string>("");
  const [filterImplemento, setFilterImplemento] = useState<string>("");

  // Active filters count
  const activeFiltersCount = [
    filterMecanica,
    filterGrupoMuscular,
    filterMusculo,
    filterAptitudPrimaria,
    filterAptitudSecundaria,
    filterImplemento,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterMecanica("");
    setFilterGrupoMuscular("");
    setFilterMusculo("");
    setFilterAptitudPrimaria("");
    setFilterAptitudSecundaria("");
    setFilterImplemento("");
    setSearchTerm("");
  };

  // Filtered exercises
  const filteredEjercicios = useMemo(() => {
    return ejercicios.filter((ejercicio) => {
      // Search filter
      if (searchTerm && !ejercicio.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Mecánica filter
      if (filterMecanica && !ejercicio.mecanicas.includes(filterMecanica)) {
        return false;
      }
      // Grupo muscular filter
      if (filterGrupoMuscular && !ejercicio.grupoMuscular.includes(filterGrupoMuscular)) {
        return false;
      }
      // Músculo principal filter
      if (filterMusculo && !ejercicio.musculosPrincipales.includes(filterMusculo)) {
        return false;
      }
      // Aptitud primaria filter
      if (filterAptitudPrimaria && !ejercicio.aptitudesPrimarias.includes(filterAptitudPrimaria)) {
        return false;
      }
      // Aptitud secundaria filter
      if (filterAptitudSecundaria && !ejercicio.aptitudesSecundarias.includes(filterAptitudSecundaria)) {
        return false;
      }
      // Implemento filter
      if (filterImplemento && !ejercicio.implementos.includes(filterImplemento)) {
        return false;
      }
      return true;
    });
  }, [searchTerm, filterMecanica, filterGrupoMuscular, filterMusculo, filterAptitudPrimaria, filterAptitudSecundaria, filterImplemento]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Ejercicios</h1>
          <p className="text-muted-foreground">Biblioteca de ejercicios ({ejercicios.length})</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Crear Ejercicio
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Mecánica Filter */}
          <Select value={filterMecanica} onValueChange={setFilterMecanica}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Mecánica" />
            </SelectTrigger>
            <SelectContent>
              {MECANICAS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Grupo Muscular Filter */}
          <Select value={filterGrupoMuscular} onValueChange={setFilterGrupoMuscular}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Grupo Muscular" />
            </SelectTrigger>
            <SelectContent>
              {GRUPOS_MUSCULARES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Músculo Principal Filter */}
          <Select value={filterMusculo} onValueChange={setFilterMusculo}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Músculo" />
            </SelectTrigger>
            <SelectContent>
              {MUSCULOS_PRINCIPALES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Aptitudes Filters */}
          <Select value={filterAptitudPrimaria} onValueChange={setFilterAptitudPrimaria}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue placeholder="Aptitud Principal" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground">Aptitudes Principales</SelectLabel>
                {APTITUDES.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={filterAptitudSecundaria} onValueChange={setFilterAptitudSecundaria}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue placeholder="Aptitud Secundaria" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground">Aptitudes Secundarias</SelectLabel>
                {APTITUDES.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Implementos Filter */}
          <Select value={filterImplemento} onValueChange={setFilterImplemento}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Implementos" />
            </SelectTrigger>
            <SelectContent>
              {IMPLEMENTOS.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
              <X className="h-4 w-4" />
              Limpiar filtros ({activeFiltersCount})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Video</TableHead>
              <TableHead className="text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-muted-foreground">Músculos</TableHead>
              <TableHead className="text-muted-foreground">Mecánica</TableHead>
              <TableHead className="text-muted-foreground">Aptitudes</TableHead>
              <TableHead className="text-muted-foreground">Implementos</TableHead>
              <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEjercicios.map((ejercicio) => (
              <TableRow key={ejercicio.id} className="border-border">
                <TableCell>
                  <button
                    onClick={() => ejercicio.video && setSelectedVideo({ url: ejercicio.video, nombre: ejercicio.nombre })}
                    disabled={!ejercicio.video}
                    className="relative group w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ejercicio.thumbnail ? (
                      <img
                        src={ejercicio.thumbnail}
                        alt={ejercicio.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    {ejercicio.video && (
                      <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary transition-colors">
                          <Play className="h-3.5 w-3.5 text-primary-foreground fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium text-foreground">{ejercicio.nombre}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ejercicio.grupoMuscular.join(", ")}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ejercicio.musculosPrincipales.slice(0, 2).map((musculo) => (
                      <Badge key={musculo} variant="secondary" className="text-xs">
                        {musculo}
                      </Badge>
                    ))}
                    {ejercicio.musculosPrincipales.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{ejercicio.musculosPrincipales.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ejercicio.mecanicas.map((mec) => (
                      <Badge key={mec} variant="outline" className="text-xs border-border">
                        {mec}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ejercicio.aptitudesPrimarias.slice(0, 2).map((apt) => (
                      <Badge
                        key={apt}
                        variant="outline"
                        className="text-xs border-primary text-primary"
                      >
                        {apt}
                      </Badge>
                    ))}
                    {ejercicio.aptitudesPrimarias.length > 2 && (
                      <Badge variant="outline" className="text-xs border-primary text-primary">
                        +{ejercicio.aptitudesPrimarias.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ejercicio.implementos.map((impl) => (
                      <Badge key={impl} variant="outline" className="text-xs border-border">
                        {impl}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Mostrando {filteredEjercicios.length} de {ejercicios.length} ejercicios
      </p>

      {/* Video Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{selectedVideo?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            {selectedVideo && (
              <iframe
                src={selectedVideo.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Exercise Modal */}
      <CreateExerciseModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
};

export default AdminEjercicios;
