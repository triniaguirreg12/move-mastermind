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

const rutinas = [
  {
    id: 1,
    nombre: "Full Body Strength",
    categoria: "Funcional",
    objetivo: "Full Training",
    duracion: "35 min",
    nivel: "Intermedio/Avanzado",
    implementos: ["Mancuernas"],
    calificacion: 4.8,
    completados: 1250,
  },
  {
    id: 2,
    nombre: "HIT Burn",
    categoria: "HIIT",
    objetivo: "Quema de grasa",
    duracion: "25 min",
    nivel: "Avanzado",
    implementos: ["Sin equipamiento"],
    calificacion: 4.7,
    completados: 980,
  },
  {
    id: 3,
    nombre: "Core Challenge",
    categoria: "Core",
    objetivo: "Fortalecimiento",
    duracion: "20 min",
    nivel: "Intermedio",
    implementos: ["Mat"],
    calificacion: 4.6,
    completados: 850,
  },
  {
    id: 4,
    nombre: "Morning Energizer",
    categoria: "Activación",
    objetivo: "Energía matutina",
    duracion: "15 min",
    nivel: "Principiante",
    implementos: ["Sin equipamiento"],
    calificacion: 3.5,
    completados: 420,
  },
  {
    id: 5,
    nombre: "Yoga Flow",
    categoria: "Yoga",
    objetivo: "Flexibilidad",
    duracion: "45 min",
    nivel: "Todos los niveles",
    implementos: ["Mat", "Bloque"],
    calificacion: 4.5,
    completados: 680,
  },
  {
    id: 6,
    nombre: "Piernas de acero",
    categoria: "Funcional",
    objetivo: "Fuerza tren inferior",
    duracion: "40 min",
    nivel: "Avanzado",
    implementos: ["Mancuernas", "Barra"],
    calificacion: 4.4,
    completados: 520,
  },
];

const AdminRutinas = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Funcional: "bg-primary/20 text-primary",
      HIIT: "bg-accent/20 text-accent",
      Core: "bg-success/20 text-success",
      Activación: "bg-warning/20 text-warning",
      Yoga: "bg-purple-500/20 text-purple-400",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Rutinas</h1>
          <p className="text-muted-foreground">Biblioteca de rutinas (105)</p>
        </div>
        <Button className="gap-2">
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
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="funcional">Funcional</SelectItem>
            <SelectItem value="hiit">HIIT</SelectItem>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="activacion">Activación</SelectItem>
            <SelectItem value="yoga">Yoga</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="principiante">Principiante</SelectItem>
            <SelectItem value="intermedio">Intermedio</SelectItem>
            <SelectItem value="avanzado">Avanzado</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Calificación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Mayor a 4.5</SelectItem>
            <SelectItem value="medium">3.5 - 4.5</SelectItem>
            <SelectItem value="low">Menor a 3.5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rutinas.map((rutina) => (
          <Card
            key={rutina.id}
            className="bg-card border-border p-5 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <Badge className={getCategoriaColor(rutina.categoria)}>{rutina.categoria}</Badge>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="text-sm font-medium text-foreground">{rutina.calificacion}</span>
              </div>
            </div>

            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              {rutina.nombre}
            </h3>

            <p className="text-sm text-muted-foreground mb-3">Objetivo: {rutina.objetivo}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {rutina.duracion}
              </div>
              <Badge variant="outline" className="text-xs border-border">
                {rutina.nivel}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {rutina.implementos.map((impl) => (
                <Badge key={impl} variant="secondary" className="text-xs">
                  {impl}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {rutina.completados} completados
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminRutinas;
