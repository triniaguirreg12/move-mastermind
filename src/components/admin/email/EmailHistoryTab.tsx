import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, Mail, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Borrador", color: "bg-muted text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  queued: { label: "En cola", color: "bg-warning/20 text-warning", icon: <Clock className="h-3 w-3" /> },
  sending: { label: "Enviando", color: "bg-primary/20 text-primary", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  sent: { label: "Enviado", color: "bg-success/20 text-success", icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: "Fallido", color: "bg-destructive/20 text-destructive", icon: <XCircle className="h-3 w-3" /> },
};

const MESSAGE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  queued: { label: "En cola", color: "bg-muted text-muted-foreground" },
  sent: { label: "Enviado", color: "bg-success/20 text-success" },
  failed: { label: "Fallido", color: "bg-destructive/20 text-destructive" },
  skipped_opt_out: { label: "Omitido (opt-out)", color: "bg-warning/20 text-warning" },
};

const AUDIENCE_LABELS: Record<string, string> = {
  single: "Individual",
  selected: "Seleccionados",
  filtered: "Filtrados",
};

export function EmailHistoryTab() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["email-messages", selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return [];
      const { data, error } = await supabase
        .from("email_messages")
        .select("*")
        .eq("campaign_id", selectedCampaign)
        .order("queued_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCampaign,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaigns?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground">Sin campañas</h3>
        <p className="text-sm text-muted-foreground">
          No hay campañas de correo registradas aún.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Fecha</TableHead>
              <TableHead className="text-muted-foreground">Asunto</TableHead>
              <TableHead className="text-muted-foreground">Audiencia</TableHead>
              <TableHead className="text-muted-foreground">Destinatarios</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
              return (
                <TableRow key={campaign.id} className="border-border">
                  <TableCell className="text-muted-foreground">
                    {format(new Date(campaign.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{campaign.subject}</span>
                      {campaign.is_test && (
                        <Badge variant="outline" className="text-xs">Test</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {AUDIENCE_LABELS[campaign.audience_type] || campaign.audience_type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {campaign.total_recipients}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${status.color} gap-1`}>
                      {status.icon}
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCampaign(campaign.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Campaign detail modal */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de campaña</DialogTitle>
          </DialogHeader>

          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">En cola</p>
                  <p className="text-xl font-bold">{messages?.filter(m => m.status === "queued").length || 0}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-muted-foreground">Enviados</p>
                  <p className="text-xl font-bold text-success">{messages?.filter(m => m.status === "sent").length || 0}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-muted-foreground">Fallidos</p>
                  <p className="text-xl font-bold text-destructive">{messages?.filter(m => m.status === "failed").length || 0}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages?.map((msg) => {
                    const msgStatus = MESSAGE_STATUS_CONFIG[msg.status] || MESSAGE_STATUS_CONFIG.queued;
                    return (
                      <TableRow key={msg.id}>
                        <TableCell className="font-mono text-sm">{msg.email_to}</TableCell>
                        <TableCell>
                          <Badge className={msgStatus.color}>{msgStatus.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {msg.provider_name || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {msg.sent_at ? format(new Date(msg.sent_at), "HH:mm:ss") : "-"}
                        </TableCell>
                        <TableCell className="text-destructive text-sm">
                          {msg.error_message || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
