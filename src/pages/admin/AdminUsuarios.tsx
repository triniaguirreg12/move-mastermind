import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, Mail, Star, Activity, DollarSign, Loader2, Send, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComposeEmailModal } from "@/components/admin/email/ComposeEmailModal";
import { EmailHistoryTab } from "@/components/admin/email/EmailHistoryTab";
import { BulkEmailConfirmDialog } from "@/components/admin/email/BulkEmailConfirmDialog";

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
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [emailAudienceType, setEmailAudienceType] = useState<"single" | "selected" | "filtered">("selected");
  const [singleUserEmail, setSingleUserEmail] = useState<string | null>(null);

  const { data: usuarios, isLoading, refetch } = useQuery({
    queryKey: ['admin-usuarios'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

  const totalUsers = usuarios?.length || 0;
  const subscribedUsers = usuarios?.filter(u => u.plan)?.length || 0;
  const planCounts = usuarios?.reduce((acc, u) => {
    if (u.plan) acc[u.plan] = (acc[u.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const allSelected = filteredUsuarios.length > 0 && filteredUsuarios.every(u => selectedUsers.has(u.user_id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsuarios.map(u => u.user_id)));
    }
  };

  const toggleUser = (userId: string) => {
    const next = new Set(selectedUsers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedUsers(next);
  };

  const openComposeForSelected = () => {
    if (selectedUsers.size === 0) return;
    setEmailAudienceType("selected");
    setSingleUserEmail(null);
    setComposeOpen(true);
  };

  const openComposeForFiltered = () => {
    if (filteredUsuarios.length === 0) return;
    setBulkConfirmOpen(true);
  };

  const confirmBulkSend = () => {
    setBulkConfirmOpen(false);
    setEmailAudienceType("filtered");
    setSingleUserEmail(null);
    setComposeOpen(true);
  };

  const openComposeForSingle = (userId: string) => {
    setEmailAudienceType("single");
    setSingleUserEmail(userId);
    setSelectedUsers(new Set([userId]));
    setComposeOpen(true);
  };

  const getFilters = () => ({
    country: undefined,
    plan: planFilter !== "todos" ? planFilter : undefined,
    subscription_status: estadoFilter !== "todos" ? (estadoFilter === "suscrito" ? "active" : "none") : undefined,
  });

  const recipientCount = emailAudienceType === "filtered" 
    ? filteredUsuarios.length 
    : selectedUsers.size;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios ({totalUsers} registrados)</p>
        </div>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="correos" className="gap-2">
            <Mail className="h-4 w-4" />
            Correos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-6 mt-4">
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

          {/* Filters & Actions */}
          <div className="flex flex-wrap gap-3 items-center">
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

            {selectedUsers.size > 0 && (
              <Button onClick={openComposeForSelected} className="gap-2">
                <Send className="h-4 w-4" />
                Enviar correo ({selectedUsers.size})
              </Button>
            )}
            <Button variant="outline" onClick={openComposeForFiltered} disabled={filteredUsuarios.length === 0} className="gap-2">
              <Mail className="h-4 w-4" />
              Enviar a todos ({filteredUsuarios.length})
            </Button>
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
                    <TableHead className="w-12">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id} className="border-border">
                        <TableCell>
                          <Checkbox 
                            checked={selectedUsers.has(usuario.user_id)} 
                            onCheckedChange={() => toggleUser(usuario.user_id)} 
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-primary text-xs font-medium">
                                {usuario.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{usuario.name || "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground">{usuario.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{usuario.country || "-"}</TableCell>
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
                              <DropdownMenuItem onClick={() => openComposeForSingle(usuario.user_id)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar correo
                              </DropdownMenuItem>
                              <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                              <DropdownMenuItem>Asignar programa</DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="correos" className="mt-4">
          <EmailHistoryTab />
        </TabsContent>
      </Tabs>

      <ComposeEmailModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        recipientCount={recipientCount}
        audienceType={emailAudienceType}
        selectedUserIds={Array.from(selectedUsers)}
        filters={getFilters()}
        onSuccess={() => {
          setSelectedUsers(new Set());
          refetch();
        }}
      />

      <BulkEmailConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        recipientCount={filteredUsuarios.length}
        onConfirm={confirmBulkSend}
      />
    </div>
  );
};

export default AdminUsuarios;
