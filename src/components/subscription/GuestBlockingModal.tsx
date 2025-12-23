import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface GuestBlockingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function GuestBlockingModal({ 
  isOpen, 
  onClose,
  title = "Crea tu cuenta para continuar",
  description = "Regístrate gratis para explorar rutinas y programas. Con una suscripción tendrás acceso completo."
}: GuestBlockingModalProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[320px] rounded-2xl">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            className="w-full" 
            onClick={() => {
              onClose();
              navigate("/login", { state: { mode: "signup" } });
            }}
          >
            Crear cuenta
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              onClose();
              navigate("/login");
            }}
          >
            Iniciar sesión
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={onClose}
          >
            Seguir explorando
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
