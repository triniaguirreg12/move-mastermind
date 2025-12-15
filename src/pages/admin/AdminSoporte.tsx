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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquare, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";

const tickets = [
  {
    id: 1,
    asunto: "No puedo acceder a mi cuenta",
    usuario: "María Fernández",
    email: "maria@email.com",
    categoria: "Cuenta",
    prioridad: "alta",
    estado: "abierto",
    fecha: "2024-12-15",
    mensajes: 3,
  },
  {
    id: 2,
    asunto: "Error al cargar rutina",
    usuario: "Carlos López",
    email: "carlos@email.com",
    categoria: "Técnico",
    prioridad: "media",
    estado: "en_progreso",
    fecha: "2024-12-14",
    mensajes: 5,
  },
  {
    id: 3,
    asunto: "Solicitud de reembolso",
    usuario: "Ana Martínez",
    email: "ana@email.com",
    categoria: "Pagos",
    prioridad: "alta",
    estado: "abierto",
    fecha: "2024-12-15",
    mensajes: 2,
  },
  {
    id: 4,
    asunto: "Problema con video de ejercicio",
    usuario: "Diego Soto",
    email: "diego@email.com",
    categoria: "Contenido",
    prioridad: "baja",
    estado: "resuelto",
    fecha: "2024-12-13",
    mensajes: 4,
  },
  {
    id: 5,
    asunto: "Cómo cambiar mi plan",
    usuario: "Pepito Pérez",
    email: "pepito@email.com",
    categoria: "Cuenta",
    prioridad: "baja",
    estado: "resuelto",
    fecha: "2024-12-12",
    mensajes: 2,
  },
];

const AdminSoporte = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const getPrioridadColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      alta: "bg-destructive/20 text-destructive",
      media: "bg-warning/20 text-warning",
      baja: "bg-muted text-muted-foreground",
    };
    return colors[prioridad] || "bg-muted text-muted-foreground";
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      abierto: "border-destructive text-destructive",
      en_progreso: "border-warning text-warning",
      resuelto: "border-success text-success",
    };
    return colors[estado] || "border-muted-foreground text-muted-foreground";
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      abierto: "Abierto",
      en_progreso: "En progreso",
      resuelto: "Resuelto",
    };
    return labels[estado] || estado;
  };

  const openTickets = tickets.filter((t) => t.estado === "abierto");
  const inProgressTickets = tickets.filter((t) => t.estado === "en_progreso");
  const resolvedTickets = tickets.filter((t) => t.estado === "resuelto");

  const TicketCard = ({ ticket }: { ticket: (typeof tickets)[0] }) => (
    <Card className="bg-card border-border p-4 hover:border-primary/30 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <Badge className={getPrioridadColor(ticket.prioridad)}>
          {ticket.prioridad.charAt(0).toUpperCase() + ticket.prioridad.slice(1)}
        </Badge>
        <Badge variant="outline" className={getEstadoColor(ticket.estado)}>
          {getEstadoLabel(ticket.estado)}
        </Badge>
      </div>

      <h3 className="font-medium text-foreground mb-2">{ticket.asunto}</h3>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <User className="h-3 w-3" />
        {ticket.usuario}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Badge variant="secondary" className="text-[10px]">
          {ticket.categoria}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(ticket.fecha).toLocaleDateString("es-CL")}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          {ticket.mensajes} mensajes
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Soporte</h1>
          <p className="text-muted-foreground">Gestión de tickets y consultas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Abiertos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{openTickets.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-warning mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">En Progreso</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{inProgressTickets.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Resueltos (este mes)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{resolvedTickets.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cuenta">Cuenta</SelectItem>
            <SelectItem value="tecnico">Técnico</SelectItem>
            <SelectItem value="pagos">Pagos</SelectItem>
            <SelectItem value="contenido">Contenido</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="abiertos" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="abiertos" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Abiertos ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger value="en_progreso" className="gap-2">
            <Clock className="h-4 w-4" />
            En Progreso ({inProgressTickets.length})
          </TabsTrigger>
          <TabsTrigger value="resueltos" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Resueltos ({resolvedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abiertos" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {openTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="en_progreso" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inProgressTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resueltos" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resolvedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSoporte;
