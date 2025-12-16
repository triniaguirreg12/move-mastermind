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
import { Plus, Search, Edit, Trash2, Play } from "lucide-react";

const ejercicios = [
  {
    id: 1,
    nombre: "Sentadilla con mancuerna",
    musculos: ["Glúteos", "Cuádriceps"],
    mecanica: "Tren Inferior",
    objetivo: "Fuerza",
    implementos: ["Mancuerna"],
    video: "https://www.youtube.com/embed/YaXPRqUwItQ",
    thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=120&h=80&fit=crop",
  },
  {
    id: 2,
    nombre: "Peso muerto rumano",
    musculos: ["Isquiotibiales", "Glúteos"],
    mecanica: "Tren Inferior",
    objetivo: "Fuerza",
    implementos: ["Barra", "Mancuerna"],
    video: "https://www.youtube.com/embed/jEy_czb3RKA",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=80&fit=crop",
  },
  {
    id: 3,
    nombre: "Press de banca",
    musculos: ["Pectorales", "Tríceps"],
    mecanica: "Tren Superior",
    objetivo: "Fuerza",
    implementos: ["Barra", "Banco"],
    video: "https://www.youtube.com/embed/rT7DgCr-3pg",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=80&fit=crop",
  },
  {
    id: 4,
    nombre: "Plancha frontal",
    musculos: ["Core", "Abdominales"],
    mecanica: "Core",
    objetivo: "Resistencia",
    implementos: ["Sin equipamiento"],
    video: "https://www.youtube.com/embed/pSHjTRCQxIw",
    thumbnail: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=120&h=80&fit=crop",
  },
  {
    id: 5,
    nombre: "Burpees",
    musculos: ["Full Body"],
    mecanica: "Full Body",
    objetivo: "Cardio",
    implementos: ["Sin equipamiento"],
    video: "https://www.youtube.com/embed/dZgVxmf6jkA",
    thumbnail: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=120&h=80&fit=crop",
  },
  {
    id: 6,
    nombre: "Elevación de gemelos",
    musculos: ["Gemelos"],
    mecanica: "Tren Inferior",
    objetivo: "Fuerza",
    implementos: ["Mancuerna"],
    video: null,
    thumbnail: null,
  },
];

const AdminEjercicios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; nombre: string } | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Ejercicios</h1>
          <p className="text-muted-foreground">Biblioteca de ejercicios (405)</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Ejercicio
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Músculos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gluteos">Glúteos</SelectItem>
            <SelectItem value="cuadriceps">Cuádriceps</SelectItem>
            <SelectItem value="pectorales">Pectorales</SelectItem>
            <SelectItem value="core">Core</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Mecánica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tren-inferior">Tren Inferior</SelectItem>
            <SelectItem value="tren-superior">Tren Superior</SelectItem>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="full-body">Full Body</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Objetivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fuerza">Fuerza</SelectItem>
            <SelectItem value="resistencia">Resistencia</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="flexibilidad">Flexibilidad</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Implementos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mancuerna">Mancuerna</SelectItem>
            <SelectItem value="barra">Barra</SelectItem>
            <SelectItem value="sin-equipo">Sin equipamiento</SelectItem>
            <SelectItem value="banda">Banda elástica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Video</TableHead>
              <TableHead className="text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-muted-foreground">Músculos Principales</TableHead>
              <TableHead className="text-muted-foreground">Mecánica</TableHead>
              <TableHead className="text-muted-foreground">Objetivo</TableHead>
              <TableHead className="text-muted-foreground">Implementos</TableHead>
              <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ejercicios.map((ejercicio) => (
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
                  <span className="font-medium text-foreground">{ejercicio.nombre}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ejercicio.musculos.map((musculo) => (
                      <Badge key={musculo} variant="secondary" className="text-xs">
                        {musculo}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{ejercicio.mecanica}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      ejercicio.objetivo === "Fuerza"
                        ? "border-primary text-primary"
                        : ejercicio.objetivo === "Cardio"
                        ? "border-accent text-accent"
                        : "border-success text-success"
                    }
                  >
                    {ejercicio.objetivo}
                  </Badge>
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
        Mostrando {ejercicios.length} ejercicios
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
    </div>
  );
};

export default AdminEjercicios;
