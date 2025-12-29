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
import { AlertCircle } from "lucide-react";

interface BulkEmailConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientCount: number;
  onConfirm: () => void;
}

export function BulkEmailConfirmDialog({
  open,
  onOpenChange,
  recipientCount,
  onConfirm,
}: BulkEmailConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Confirmar envío masivo
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Estás a punto de enviar un correo a <strong className="text-foreground">{recipientCount} usuarios</strong> que coinciden con los filtros actuales.
            </p>
            <p>
              Los usuarios que se han dado de baja serán excluidos automáticamente.
            </p>
            <p className="text-warning">
              Esta acción no se puede deshacer.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Sí, enviar a {recipientCount} usuarios
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
