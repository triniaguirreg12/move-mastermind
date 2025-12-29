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
import { Search, MoreHorizontal, Mail, Star, Activity, DollarSign, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Plan names mapping
const PLAN_NAMES: Record<string, string> = {
  globo: "Globo",
  volea: "Volea",
  bandeja: "Bandeja",
  smash: "Smash",
};

const AdminUsuarios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("todos");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");

  // Fetch profiles with subscriptions
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['admin-usuarios'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch subscriptions for each user
      const usersWithSubs = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .eq('user_id', profile.user_id)
            .eq('status', 'activa')
            .maybeSingle();

          return {
            ...profile,
            plan: subscription?.plan || null,
            subscriptionStatus: subscription?.status || null,
          };
        })
      );

      return usersWithSubs;
    },
  });

  const getPlanColor = (plan: string | null) => {
    const colors: Record<string, string> = {
      smash: "bg-primary/20 text-primary",
      bandeja: "bg-accent/20 text-accent",
      volea: "bg-success/20 text-success",
      globo: "bg-warning/20 text-warning",
    };
    return plan ? colors[plan] || "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground";
  };

  // Filter users
  const filteredUsuarios = usuarios?.filter((usuario) => {
    const matchesSearch = 
      usuario.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter === "todos" || usuario.plan === planFilter;
    const matchesEstado = estadoFilter === "todos" || 
      (estadoFilter === "suscrito" && usuario.plan) ||
      (estadoFilter === "gratis" && !usuario.plan);

    return matchesSearch && matchesPlan && matchesEstado;
  }) || [];

  // Count stats
  const totalUsers = usuarios?.length || 0;
  const subscribedUsers = usuarios?.filter(u => u.plan)?.length || 0;
  const planCounts = usuarios?.reduce((acc, u) => {
    if (u.plan) acc[u.plan] = (acc[u.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios ({totalUsers} registrados)</p>
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
            <span className="text-sm">Total Usuarios</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Star className="h-4 w-4" />
            <span className="text-sm">Suscritos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{subscribedUsers}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Plan Smash</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{planCounts.smash || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4 text-success" />
            <span className="text-sm">Gratuitos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalUsers - subscribedUsers}</p>
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
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="globo">Globo</SelectItem>
            <SelectItem value="volea">Volea</SelectItem>
            <SelectItem value="bandeja">Bandeja</SelectItem>
            <SelectItem value="smash">Smash</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="suscrito">Suscrito</SelectItem>
            <SelectItem value="gratis">Gratis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Usuario</TableHead>
                <TableHead className="text-muted-foreground">País</TableHead>
                <TableHead className="text-muted-foreground">Plan</TableHead>
                <TableHead className="text-muted-foreground">Registro</TableHead>
                <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary text-xs font-medium">
                            {usuario.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{usuario.name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">{usuario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {usuario.country || "-"}
                    </TableCell>
                    <TableCell>
                      {usuario.plan ? (
                        <Badge className={getPlanColor(usuario.plan)}>
                          {PLAN_NAMES[usuario.plan] || usuario.plan}
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground">Gratis</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(usuario.created_at).toLocaleDateString('es-CL')}
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
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
