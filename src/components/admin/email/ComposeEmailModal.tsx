import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Save, Eye, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ComposeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientCount: number;
  audienceType: "single" | "selected" | "filtered";
  selectedUserIds?: string[];
  filters?: {
    country?: string;
    plan?: string;
    subscription_status?: string;
  };
  onSuccess?: () => void;
}

const VARIABLES = [
  { key: "{first_name}", label: "Nombre", example: "Juan" },
  { key: "{plan_name}", label: "Plan", example: "Smash" },
  { key: "{country}", label: "País", example: "Chile" },
];

export function ComposeEmailModal({
  open,
  onOpenChange,
  recipientCount,
  audienceType,
  selectedUserIds,
  filters,
  onSuccess,
}: ComposeEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [body, setBody] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  const handleCreateCampaign = async (isTest: boolean) => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Asunto y cuerpo son requeridos");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No hay sesión activa");
        return;
      }

      const response = await supabase.functions.invoke("admin-email-create-campaign", {
        body: {
          subject,
          preheader: preheader || undefined,
          body,
          body_format: "html",
          cta_text: ctaText || undefined,
          cta_url: ctaUrl || undefined,
          audience_type: audienceType,
          selected_user_ids: selectedUserIds,
          filters,
          is_test: isTest,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error creating campaign");
      }

      const result = response.data;

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Process the queue (simulate sending)
      const processResponse = await supabase.functions.invoke("admin-email-process-queue", {
        body: { campaign_id: result.campaign_id },
      });

      if (processResponse.error) {
        console.error("Error processing queue:", processResponse.error);
        toast.warning("Campaña creada, pero hubo un error al procesar");
      } else {
        const processResult = processResponse.data;
        if (isTest) {
          toast.success(`Correo de prueba simulado para ${processResult.sent_count} destinatario(s)`);
        } else {
          toast.success(`Campaña enviada (simulada) a ${processResult.sent_count} destinatarios`);
        }
      }

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear la campaña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubject("");
    setPreheader("");
    setBody("");
    setCtaText("");
    setCtaUrl("");
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + variable);
  };

  // Generate preview with example values
  const getPreviewBody = () => {
    let preview = body
      .replace(/\{first_name\}/g, "Juan")
      .replace(/\{plan_name\}/g, "Smash")
      .replace(/\{country\}/g, "Chile");
    return preview;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Redactar correo</span>
            <Badge variant="secondary">{recipientCount} destinatario(s)</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Asunto *</Label>
              <Input
                placeholder="Asunto del correo..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Preheader (opcional)</Label>
              <Input
                placeholder="Texto que aparece junto al asunto en la bandeja..."
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">{preheader.length}/160</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cuerpo *</Label>
                <div className="flex gap-1">
                  {VARIABLES.map((v) => (
                    <Button
                      key={v.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => insertVariable(v.key)}
                    >
                      {v.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Escribe el contenido del correo..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Soporta HTML básico. Variables: {VARIABLES.map((v) => v.key).join(", ")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Texto CTA (opcional)</Label>
                <Input
                  placeholder="Ver más"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL CTA</Label>
                <Input
                  placeholder="https://..."
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg p-4 bg-white">
              <div className="border-b pb-2 mb-4">
                <p className="text-sm text-muted-foreground">De: Just Muv &lt;noreply@justmuv.cl&gt;</p>
                <p className="font-medium">{subject || "(Sin asunto)"}</p>
                {preheader && <p className="text-sm text-muted-foreground">{preheader}</p>}
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: getPreviewBody() || "<p class='text-muted-foreground'>(Sin contenido)</p>" }}
              />
              {ctaText && ctaUrl && (
                <div className="mt-4">
                  <a
                    href={ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium"
                  >
                    {ctaText}
                  </a>
                </div>
              )}
              <hr className="my-6" />
              <p className="text-xs text-muted-foreground text-center">
                ¿No quieres recibir más correos? <span className="underline">Darte de baja</span>
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleCreateCampaign(true)}
              disabled={isSubmitting || !subject || !body}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Enviar test
            </Button>
            <Button
              onClick={() => handleCreateCampaign(false)}
              disabled={isSubmitting || !subject || !body || recipientCount === 0}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar ({recipientCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
