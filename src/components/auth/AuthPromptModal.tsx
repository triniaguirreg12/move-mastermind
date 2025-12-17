import { UserPlus, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  accentColor?: "training" | "padel";
}

export function AuthPromptModal({
  isOpen,
  onClose,
  title = "Crea tu cuenta para continuar",
  description = "Regístrate o inicia sesión para guardar tus actividades y llevar el control de tu entrenamiento.",
  accentColor = "training",
}: AuthPromptModalProps) {
  const navigate = useNavigate();

  const handleNavigateToAuth = (mode: "signup" | "login") => {
    onClose();
    navigate("/login", { state: { mode } });
  };

  const buttonClass = accentColor === "padel" 
    ? "bg-activity-padel text-background hover:bg-activity-padel/90"
    : "bg-activity-training text-background hover:bg-activity-training/90";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center text-xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => handleNavigateToAuth("signup")}
            className={`w-full h-12 text-base font-medium ${buttonClass}`}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Crear cuenta
          </Button>
          <Button
            variant="outline"
            onClick={() => handleNavigateToAuth("login")}
            className="w-full h-12 text-base"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Iniciar sesión
          </Button>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
          >
            Seguir explorando
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
