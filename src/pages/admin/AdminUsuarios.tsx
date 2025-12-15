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
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Mail, Star, Activity, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const usuarios = [
  {
    id: 1,
    nombre: "Pepito Pérez",
    email: "pepito@email.com",
    pais: "Chile",
    plan: "Premium",
    rutinasCompletadas: 156,
    gastoTotal: 3200,
    calificacion: 4.9,
    estado: "activo",
    ultimaActividad: "Hace 2 horas",
  },
  {
    id: 2,
    nombre: "Rosario González",
    email: "rosario@email.com",
    pais: "Argentina",
    plan: "Premium",
    rutinasCompletadas: 142,
    gastoTotal: 2800,
    calificacion: 4.8,
    estado: "activo",
    ultimaActividad: "Hace 1 día",
  },
  {
    id: 3,
    nombre: "María Fernández",
    email: "maria@email.com",
    pais: "México",
    plan: "Básico",
    rutinasCompletadas: 89,
    gastoTotal: 450,
    calificacion: 4.5,
    estado: "activo",
    ultimaActividad: "Hace 3 días",
  },
  {
    id: 4,
    nombre: "Carlos López",
    email: "carlos@email.com",
    pais: "Chile",
    plan: "Premium",
    rutinasCompletadas: 115,
    gastoTotal: 2100,
    calificacion: 4.6,
    estado: "activo",
    ultimaActividad: "Hace 5 horas",
  },
  {
    id: 5,
    nombre: "Ana Martínez",
    email: "ana@email.com",
    pais: "Colombia",
    plan: "Básico",
    rutinasCompletadas: 45,
    gastoTotal: 280,
    calificacion: 4.2,
    estado: "inactivo",
    ultimaActividad: "Hace 2 semanas",
  },
  {
    id: 6,
    nombre: "Diego Soto",
    email: "diego@email.com",
    pais: "Chile",
    plan: "Gratis",
    rutinasCompletadas: 12,
    gastoTotal: 0,
    calificacion: null,
    estado: "activo",
    ultimaActividad: "Hace 1 hora",
  },
];

const AdminUsuarios = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      Premium: "bg-primary/20 text-primary",
      Básico: "bg-accent/20 text-accent",
      Gratis: "bg-muted text-muted-foreground",
    };
    return colors[plan] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios (5,280 activos)</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          Exportar Lista
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Usuarios Activos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">5,280</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Star className="h-4 w-4" />
            <span className="text-sm">Nuevos (este mes)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">950</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Premium</span>
          </div>
          <p className="text-2xl font-bold text-foreground">1,245</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4 text-destructive" />
            <span className="text-sm">Churn Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">4.2%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chile">Chile</SelectItem>
            <SelectItem value="argentina">Argentina</SelectItem>
            <SelectItem value="mexico">México</SelectItem>
            <SelectItem value="colombia">Colombia</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="basico">Básico</SelectItem>
            <SelectItem value="gratis">Gratis</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Usuario</TableHead>
              <TableHead className="text-muted-foreground">País</TableHead>
              <TableHead className="text-muted-foreground">Plan</TableHead>
              <TableHead className="text-muted-foreground text-right">Rutinas</TableHead>
              <TableHead className="text-muted-foreground text-right">Gasto</TableHead>
              <TableHead className="text-muted-foreground text-right">Calificación</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">
                        {usuario.nombre
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{usuario.nombre}</p>
                      <p className="text-xs text-muted-foreground">{usuario.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{usuario.pais}</TableCell>
                <TableCell>
                  <Badge className={getPlanColor(usuario.plan)}>{usuario.plan}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {usuario.rutinasCompletadas}
                </TableCell>
                <TableCell className="text-right font-medium text-success">
                  ${usuario.gastoTotal.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {usuario.calificacion ? (
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium text-foreground">{usuario.calificacion}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      usuario.estado === "activo"
                        ? "border-success text-success"
                        : "border-muted-foreground text-muted-foreground"
                    }
                  >
                    {usuario.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                      <DropdownMenuItem>Enviar mensaje</DropdownMenuItem>
                      <DropdownMenuItem>Asignar programa</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Suspender cuenta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsuarios;
