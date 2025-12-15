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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Trash2, Star, Users, Calendar, Lock, Globe } from "lucide-react";

const programas = [
  {
    id: 1,
    nombre: "Transformación 12 Semanas",
    categoria: "Funcional",
    objetivo: "Full Training",
    duracion: "12 semanas",
    nivel: "Intermedio/Avanzado",
    implementos: ["Mancuernas", "Barra"],
    calificacion: 4.9,
    inscritos: 450,
    tipo: "publico",
  },
  {
    id: 2,
    nombre: "Pérdida de peso",
    categoria: "HIIT",
    objetivo: "Quema de grasa",
    duracion: "8 semanas",
    nivel: "Todos los niveles",
    implementos: ["Sin equipamiento"],
    calificacion: 4.7,
    inscritos: 820,
    tipo: "publico",
  },
  {
    id: 3,
    nombre: "Fuerza Progresiva",
    categoria: "Funcional",
    objetivo: "Ganancia muscular",
    duracion: "16 semanas",
    nivel: "Avanzado",
    implementos: ["Mancuernas", "Barra", "Máquinas"],
    calificacion: 4.8,
    inscritos: 320,
    tipo: "publico",
  },
  {
    id: 4,
    nombre: "Programa Rosario G.",
    categoria: "Personalizado",
    objetivo: "Rehabilitación",
    duracion: "4 semanas",
    nivel: "Adaptado",
    implementos: ["Bandas", "Mat"],
    calificacion: null,
    inscritos: 1,
    tipo: "asignado",
    usuario: "Rosario González",
  },
  {
    id: 5,
    nombre: "Programa Carlos L.",
    categoria: "Personalizado",
    objetivo: "Post-lesión",
    duracion: "6 semanas",
    nivel: "Adaptado",
    implementos: ["Bandas", "Mancuernas livianas"],
    calificacion: null,
    inscritos: 1,
    tipo: "asignado",
    usuario: "Carlos López",
  },
];

const AdminProgramas = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Funcional: "bg-primary/20 text-primary",
      HIIT: "bg-accent/20 text-accent",
      Personalizado: "bg-purple-500/20 text-purple-400",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  const publicPrograms = programas.filter((p) => p.tipo === "publico");
  const assignedPrograms = programas.filter((p) => p.tipo === "asignado");

  const ProgramCard = ({ programa }: { programa: (typeof programas)[0] }) => (
    <Card className="bg-card border-border p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={getCategoriaColor(programa.categoria)}>{programa.categoria}</Badge>
          {programa.tipo === "publico" ? (
            <Globe className="h-4 w-4 text-success" />
          ) : (
            <Lock className="h-4 w-4 text-warning" />
          )}
        </div>
        {programa.calificacion && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="text-sm font-medium text-foreground">{programa.calificacion}</span>
          </div>
        )}
      </div>

      <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{programa.nombre}</h3>

      {programa.tipo === "asignado" && (
        <p className="text-sm text-accent mb-2">Asignado a: {programa.usuario}</p>
      )}

      <p className="text-sm text-muted-foreground mb-3">Objetivo: {programa.objetivo}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {programa.duracion}
        </div>
        <Badge variant="outline" className="text-xs border-border">
          {programa.nivel}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {programa.implementos.map((impl) => (
          <Badge key={impl} variant="secondary" className="text-xs">
            {impl}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {programa.inscritos} inscrito{programa.inscritos !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Programas</h1>
          <p className="text-muted-foreground">Biblioteca de programas (35)</p>
        </div>
        <Button className="gap-2">
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
        <Select>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="funcional">Funcional</SelectItem>
            <SelectItem value="hiit">HIIT</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="publicos" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="publicos" className="gap-2">
            <Globe className="h-4 w-4" />
            Públicos ({publicPrograms.length})
          </TabsTrigger>
          <TabsTrigger value="asignados" className="gap-2">
            <Lock className="h-4 w-4" />
            Asignados ({assignedPrograms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="publicos" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {publicPrograms.map((programa) => (
              <ProgramCard key={programa.id} programa={programa} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="asignados" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignedPrograms.map((programa) => (
              <ProgramCard key={programa.id} programa={programa} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProgramas;
