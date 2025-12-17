import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, User, Target, CreditCard, LogOut, Moon, Bell, ChevronLeft, Check } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { user, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

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
      toast.success("Objetivo actualizado");
      setShowGoalSheet(false);
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
            <SettingsItem
              icon={<CreditCard className="w-5 h-5" />}
              label="Plan actual"
              description="Revisa tu suscripción activa"
              onClick={() => setShowPlanSheet(true)}
            />
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
      <Sheet open={showPlanSheet} onOpenChange={setShowPlanSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-display">Plan actual</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* No active plan state */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-border text-center">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No tienes un plan activo</h3>
              <p className="text-sm text-muted-foreground">
                Elige un plan para desbloquear todas las funcionalidades de Just MUV.
              </p>
            </div>
            
            {/* Available plans */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Planes disponibles</h4>
              
              <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Plan Básico</h3>
                  <span className="text-primary font-bold">$9.990/mes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acceso a rutinas funcionales y seguimiento básico.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-card border-2 border-primary relative hover:bg-card/80 transition-colors cursor-pointer">
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Recomendado
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Plan Pro</h3>
                  <span className="text-primary font-bold">$19.990/mes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Todo lo básico + programas personalizados y acceso a profesionales.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Plan Premium</h3>
                  <span className="text-primary font-bold">$29.990/mes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acceso ilimitado a todo + sesiones 1:1 con kinesiólogos.
                </p>
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Los planes se pueden cancelar en cualquier momento.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default Configuracion;
