import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Clock, User, CheckCircle2, AlertCircle, Lightbulb, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SupportTicket {
  id: string;
  user_id: string;
  type: "problem" | "suggestion";
  message: string;
  status: "open" | "in_progress" | "resolved";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: {
    name: string;
    email: string;
  };
}

const AdminSoporte = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch tickets with user profile info
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data: ticketsData, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each ticket
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return ticketsData.map(ticket => ({
        ...ticket,
        user_profile: profileMap.get(ticket.user_id) || { name: "Usuario desconocido", email: "" }
      })) as SupportTicket[];
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: Record<string, string> = { status };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }
      
      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar el ticket");
    },
  });

  const getTypeIcon = (type: string) => {
    return type === "problem" ? (
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    ) : (
      <Lightbulb className="h-4 w-4 text-primary" />
    );
  };

  const getTypeLabel = (type: string) => {
    return type === "problem" ? "Problema" : "Sugerencia";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "border-destructive text-destructive",
      in_progress: "border-warning text-warning",
      resolved: "border-success text-success",
    };
    return colors[status] || "border-muted-foreground text-muted-foreground";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "Abierto",
      in_progress: "En progreso",
      resolved: "Resuelto",
    };
    return labels[status] || status;
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_profile?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || ticket.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const openTickets = filteredTickets.filter((t) => t.status === "open");
  const inProgressTickets = filteredTickets.filter((t) => t.status === "in_progress");
  const resolvedTickets = filteredTickets.filter((t) => t.status === "resolved");

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || "");
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedTicket) return;
    updateStatusMutation.mutate({ 
      id: selectedTicket.id, 
      status, 
      notes: adminNotes 
    });
    setSelectedTicket({ ...selectedTicket, status: status as SupportTicket["status"] });
  };

  const handleSaveNotes = () => {
    if (!selectedTicket) return;
    updateStatusMutation.mutate({ 
      id: selectedTicket.id, 
      status: selectedTicket.status, 
      notes: adminNotes 
    });
  };

  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <Card 
      className="bg-card border-border p-4 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => handleOpenTicket(ticket)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getTypeIcon(ticket.type)}
          <Badge variant="secondary" className="text-xs">
            {getTypeLabel(ticket.type)}
          </Badge>
        </div>
        <Badge variant="outline" className={getStatusColor(ticket.status)}>
          {getStatusLabel(ticket.status)}
        </Badge>
      </div>

      <p className="text-sm text-foreground mb-3 line-clamp-2">{ticket.message}</p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <User className="h-3 w-3" />
        {ticket.user_profile?.name}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Soporte</h1>
          <p className="text-muted-foreground">Gestión de tickets y consultas de usuarios</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Abiertos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tickets.filter(t => t.status === "open").length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-warning mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">En Progreso</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tickets.filter(t => t.status === "in_progress").length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Resueltos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tickets.filter(t => t.status === "resolved").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mensaje o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="problem">Problemas</SelectItem>
            <SelectItem value="suggestion">Sugerencias</SelectItem>
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
          {openTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay tickets abiertos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {openTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="en_progreso" className="mt-4">
          {inProgressTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay tickets en progreso</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {inProgressTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resueltos" className="mt-4">
          {resolvedTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay tickets resueltos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {resolvedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Sheet */}
      <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedTicket.type)}
                  <SheetTitle className="text-xl font-display">
                    {getTypeLabel(selectedTicket.type)}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTicket.status === "open" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdateStatus("open")}
                      className="flex-1"
                    >
                      Abierto
                    </Button>
                    <Button
                      variant={selectedTicket.status === "in_progress" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdateStatus("in_progress")}
                      className="flex-1"
                    >
                      En Progreso
                    </Button>
                    <Button
                      variant={selectedTicket.status === "resolved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdateStatus("resolved")}
                      className="flex-1"
                    >
                      Resuelto
                    </Button>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{selectedTicket.user_profile?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTicket.user_profile?.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enviado el {format(new Date(selectedTicket.created_at), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Mensaje del usuario</label>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Notas internas</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Agrega notas sobre este ticket..."
                    className="min-h-[100px] bg-secondary resize-none"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSaveNotes}
                    disabled={updateStatusMutation.isPending}
                  >
                    Guardar notas
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminSoporte;