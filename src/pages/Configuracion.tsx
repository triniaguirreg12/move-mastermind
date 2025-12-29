import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, User, Target, CreditCard, LogOut, Moon, Bell, ChevronLeft, Check, MessageCircle, AlertTriangle, Lightbulb, Crown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlanSheet } from "@/components/subscription/PlanSheet";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}

function SettingsItem({ icon, label, description, onClick, trailing }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card/50 hover:bg-card transition-all duration-200 group"
    >
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-accent">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {trailing || (
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      )}
    </button>
  );
}

function PlanSettingsItem({ onOpenPlan }: { onOpenPlan: () => void }) {
  const { data: subscription, isLoading } = useSubscription();
  
  const hasActiveSubscription = subscription && 
    (subscription.status === "activa" || subscription.status === "cancelada") &&
    new Date(subscription.end_date) > new Date();

  const currentPlan = subscription ? PLANS.find(p => p.id === subscription.plan) : null;
  
  let description = "Activa tu suscripción";
  
  if (hasActiveSubscription && currentPlan) {
    const status = subscription.status === "cancelada" ? "Cancelado" : "Activo";
    const endDate = format(new Date(subscription.end_date), "d MMM yyyy", { locale: es });
    description = `${currentPlan.name} · ${status} hasta ${endDate}`;
  }

  return (
    <button
      onClick={onOpenPlan}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card/50 hover:bg-card transition-all duration-200 group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        hasActiveSubscription ? "bg-primary/20 text-primary" : "bg-secondary text-accent"
      }`}>
        {hasActiveSubscription ? <Crown className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">Plan actual</p>
        <p className={`text-sm ${hasActiveSubscription ? "text-primary" : "text-muted-foreground"}`}>
          {isLoading ? "Cargando..." : description}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
    </button>
  );
}

interface UserProfile {
  name: string;
  email: string;
  sex: string;
  birth_date: string;
  country: string | null;
  city: string | null;
  weekly_training_goal: number;
}

const Configuracion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const [supportType, setSupportType] = useState<"problem" | "suggestion">("problem");
  const [supportMessage, setSupportMessage] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const planSectionRef = useRef<HTMLDivElement>(null);
  const { data: subscription, refetch: refetchSubscription } = useSubscription();

  // Handle subscription result from Mercado Pago redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subscriptionResult = params.get('subscription_result');
    const preapprovalId = params.get('preapproval_id');
    
    if (subscriptionResult || preapprovalId) {
      // Clear the URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      if (preapprovalId) {
        // User completed the checkout - subscription is being processed
        toast.success("¡Suscripción en proceso!", {
          description: "Estamos confirmando tu pago. Esto puede tomar unos segundos.",
        });
        // Refetch subscription to check status
        setTimeout(() => {
          refetchSubscription();
          queryClient.invalidateQueries({ queryKey: ["subscription"] });
        }, 2000);
      } else if (subscriptionResult === 'pending') {
        // User cancelled or closed the checkout
        toast.info("Proceso de suscripción cancelado", {
          description: "Puedes intentar de nuevo cuando quieras.",
        });
      }
    }
  }, [location.search, refetchSubscription, queryClient]);

  // Handle scroll to plan-actual from navigation state
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo === "plan-actual") {
      // Small delay to ensure the component is rendered
      setTimeout(() => {
        setShowPlanSheet(true);
      }, 100);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("name, email, sex, birth_date, country, city, weekly_training_goal")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setEditedProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  const getLogoutMessage = () => {
    if (profile?.sex === "Mujer") {
      return "¿Estás segura de que quieres cerrar sesión?";
    } else if (profile?.sex === "Hombre") {
      return "¿Estás seguro de que quieres cerrar sesión?";
    }
    return "¿Quieres cerrar sesión?";
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleSaveProfile = async () => {
    if (!user || !editedProfile) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: editedProfile.name,
        sex: editedProfile.sex,
        birth_date: editedProfile.birth_date,
        country: editedProfile.country,
        city: editedProfile.city,
      })
      .eq("user_id", user.id);
    
    setSaving(false);
    
    if (error) {
      toast.error("Error al guardar los cambios");
    } else {
      setProfile(editedProfile);
      toast.success("Cambios guardados correctamente");
      setShowAccountSheet(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!user || !editedProfile) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        weekly_training_goal: editedProfile.weekly_training_goal,
      })
      .eq("user_id", user.id);
    
    setSaving(false);
    
    if (error) {
      toast.error("Error al guardar el objetivo");
    } else {
      setProfile(prev => prev ? { ...prev, weekly_training_goal: editedProfile.weekly_training_goal } : null);
      // Invalidate radar queries so they recalculate with the new goal
      queryClient.invalidateQueries({ queryKey: ["aptitudes-weekly"] });
      queryClient.invalidateQueries({ queryKey: ["aptitudes-monthly"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Objetivo actualizado");
      setShowGoalSheet(false);
    }
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) {
      toast.error("Por favor escribe un mensaje");
      return;
    }
    
    if (!user) {
      toast.error("Debes iniciar sesión para enviar un ticket");
      return;
    }
    
    setSaving(true);
    
    const { error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        type: supportType,
        message: supportMessage.trim(),
      });
    
    setSaving(false);
    
    if (error) {
      console.error("Error creating support ticket:", error);
      toast.error("Error al enviar el mensaje");
    } else {
      toast.success(
        supportType === "problem" 
          ? "Problema reportado correctamente" 
          : "Sugerencia enviada correctamente"
      );
      setSupportMessage("");
      setShowSupportSheet(false);
    }
  };

  const formatBirthDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <AppLayout>
      <div className="min-h-screen px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <header>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Configuración
          </h1>
        </header>

        {/* Settings Sections */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Cuenta</h3>
          <div className="space-y-2">
            <SettingsItem
              icon={<User className="w-5 h-5" />}
              label="Datos de la cuenta"
              description="Gestiona tu información personal"
              onClick={() => {
                setEditedProfile(profile);
                setShowAccountSheet(true);
              }}
            />
            <SettingsItem
              icon={<Target className="w-5 h-5" />}
              label="Meta de entrenamiento"
              description={profile ? `${profile.weekly_training_goal} entrenamientos por semana` : "Gestiona tu objetivo semanal"}
              onClick={() => {
                setEditedProfile(profile);
                setShowGoalSheet(true);
              }}
            />
            <PlanSettingsItem onOpenPlan={() => setShowPlanSheet(true)} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Preferencias</h3>
          <div className="space-y-2">
            <SettingsItem
              icon={<Bell className="w-5 h-5" />}
              label="Notificaciones"
              description="Gestiona tus alertas"
              trailing={<Switch defaultChecked />}
            />
            <SettingsItem
              icon={<Moon className="w-5 h-5" />}
              label="Modo oscuro"
              description="Siempre activo"
              trailing={<Switch defaultChecked disabled />}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Soporte</h3>
          <div className="space-y-2">
            <SettingsItem
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Reportar un problema"
              description="Cuéntanos si algo no funciona bien"
              onClick={() => {
                setSupportType("problem");
                setSupportMessage("");
                setShowSupportSheet(true);
              }}
            />
            <SettingsItem
              icon={<Lightbulb className="w-5 h-5" />}
              label="Enviar sugerencia"
              description="Comparte tus ideas para mejorar la app"
              onClick={() => {
                setSupportType("suggestion");
                setSupportMessage("");
                setShowSupportSheet(true);
              }}
            />
          </div>
        </section>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Just MUV v1.0.0
        </p>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar sesión</AlertDialogTitle>
            <AlertDialogDescription>
              {getLogoutMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account Data Sheet */}
      <Sheet open={showAccountSheet} onOpenChange={setShowAccountSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-display">Datos de la cuenta</SheetTitle>
          </SheetHeader>
          
          {editedProfile && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  className="bg-secondary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedProfile.email}
                  disabled
                  className="bg-secondary opacity-60"
                />
                <p className="text-xs text-muted-foreground">El correo no puede ser modificado</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select
                  value={editedProfile.sex}
                  onValueChange={(value) => setEditedProfile({ ...editedProfile, sex: value })}
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mujer">Mujer</SelectItem>
                    <SelectItem value="Hombre">Hombre</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                    <SelectItem value="Prefiero no decirlo">Prefiero no decirlo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={editedProfile.birth_date}
                  onChange={(e) => setEditedProfile({ ...editedProfile, birth_date: e.target.value })}
                  className="bg-secondary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={editedProfile.country || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                    className="bg-secondary"
                    placeholder="Ej: Chile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={editedProfile.city || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                    className="bg-secondary"
                    placeholder="Ej: Santiago"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full mt-4"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Training Goal Sheet */}
      <Sheet open={showGoalSheet} onOpenChange={setShowGoalSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-display">Meta de entrenamiento</SheetTitle>
          </SheetHeader>
          
          {editedProfile && (
            <div className="space-y-6">
              <p className="text-muted-foreground text-sm">
                ¿Cuántas veces por semana quieres entrenar? Esta meta se reflejará en el resumen de tu Home.
              </p>
              
              <div className="space-y-4">
                <Label>Entrenamientos por semana</Label>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      onClick={() => setEditedProfile({ ...editedProfile, weekly_training_goal: num })}
                      className={`
                        aspect-square rounded-xl flex items-center justify-center text-lg font-semibold transition-all
                        ${editedProfile.weekly_training_goal === num
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">¿Qué cuenta como entrenamiento?</strong>
                  <br /><br />
                  Solo rutinas de las categorías <span className="text-activity-training font-medium">Funcional</span> y <span className="text-activity-training font-medium">Kinesiología</span> cuentan para esta meta.
                  <br /><br />
                  Las activaciones, pádel y sesiones con profesionales no afectan este conteo.
                </p>
              </div>
              
              <Button
                onClick={handleSaveGoal}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Guardando..." : "Guardar objetivo"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Plan Sheet */}
      <PlanSheet open={showPlanSheet} onOpenChange={setShowPlanSheet} />

      {/* Support Sheet */}
      <Sheet open={showSupportSheet} onOpenChange={setShowSupportSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-display">
              {supportType === "problem" ? "Reportar un problema" : "Enviar sugerencia"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-2">
                {supportType === "problem" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-primary" />
                )}
                <h3 className="font-semibold text-foreground">
                  {supportType === "problem" 
                    ? "¿Encontraste un problema?" 
                    : "¿Tienes una idea?"}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {supportType === "problem"
                  ? "Describe el problema que encontraste y te ayudaremos a resolverlo lo antes posible."
                  : "Nos encanta escuchar tus ideas para mejorar Just MUV. ¡Cuéntanos!"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-message">
                {supportType === "problem" ? "Describe el problema" : "Tu sugerencia"}
              </Label>
              <Textarea
                id="support-message"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder={
                  supportType === "problem"
                    ? "Ej: Al intentar iniciar una rutina, la app no responde..."
                    : "Ej: Sería genial poder compartir mis rutinas con amigos..."
                }
                className="min-h-[150px] bg-secondary resize-none"
              />
            </div>

            {profile?.email && (
              <p className="text-xs text-muted-foreground">
                Te responderemos a: <span className="text-foreground">{profile.email}</span>
              </p>
            )}
            
            <Button
              onClick={handleSendSupport}
              disabled={saving || !supportMessage.trim()}
              className="w-full"
            >
              {saving ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default Configuracion;
