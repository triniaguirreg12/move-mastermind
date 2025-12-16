import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, User, Target, CreditCard, LogOut, Moon, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

const Configuracion = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userSex, setUserSex] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("name, sex, email")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setUserSex(data.sex);
        setUserName(data.name || "Usuario");
        setUserEmail(data.email || user.email || "");
      }
    };

    fetchProfile();
  }, [user]);

  const getLogoutMessage = () => {
    if (userSex === "Mujer") {
      return "¿Estás segura de que quieres cerrar sesión?";
    } else if (userSex === "Hombre") {
      return "¿Estás seguro de que quieres cerrar sesión?";
    }
    return "¿Quieres cerrar sesión?";
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
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

        {/* Profile Section */}
        <section className="glass-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-display font-bold text-2xl">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-display font-semibold text-lg text-foreground">
                {userName}
              </h2>
              <p className="text-muted-foreground text-sm">{userEmail}</p>
            </div>
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          </div>
        </section>

        {/* Settings Sections */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Cuenta</h3>
          <div className="space-y-2">
            <SettingsItem
              icon={<User className="w-5 h-5" />}
              label="Datos de la cuenta"
              description="Gestiona tu información personal"
            />
            <SettingsItem
              icon={<Target className="w-5 h-5" />}
              label="Meta de entrenamiento"
              description="Gestiona tu objetivo semanal"
            />
            <SettingsItem
              icon={<CreditCard className="w-5 h-5" />}
              label="Plan actual"
              description="Revisa tu suscripción activa"
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
    </AppLayout>
  );
};

export default Configuracion;
