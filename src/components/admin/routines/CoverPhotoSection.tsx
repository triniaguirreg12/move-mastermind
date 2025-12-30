import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image, Pencil, Wand2 } from "lucide-react";
import { Ejercicio } from "@/components/admin/CreateExerciseModal";
import CoverPhotoModal from "./CoverPhotoModal";

interface CropData {
  x: number;
  y: number;
  scale: number;
}

interface CoverPhotoSectionProps {
  portadaType: "auto" | "ejercicio" | "custom" | "";
  portadaEjercicioId?: number;
  portadaCustomUrl?: string;
  portadaCrop?: CropData;
  ejerciciosEnRutina: Ejercicio[];
  onPortadaChange: (
    type: "auto" | "ejercicio" | "custom" | "",
    ejercicioId?: number,
    customUrl?: string,
    crop?: CropData
  ) => void;
}

const ASPECT_RATIO = 3 / 4; // Vertical 3:4

const CoverPhotoSection = ({
  portadaType,
  portadaEjercicioId,
  portadaCustomUrl,
  portadaCrop,
  ejerciciosEnRutina,
  onPortadaChange,
}: CoverPhotoSectionProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const ejerciciosConThumbnail = ejerciciosEnRutina.filter((ej) => ej.thumbnail);

  // Get current preview image
  const getCurrentImage = (): string | null => {
    if (portadaType === "auto" || portadaType === "") {
      const firstWithThumb = ejerciciosConThumbnail[0];
      return firstWithThumb?.thumbnail || null;
    }
    if (portadaType === "ejercicio") {
      return ejerciciosEnRutina.find((ej) => ej.id === portadaEjercicioId)?.thumbnail || null;
    }
    if (portadaType === "custom") {
      return portadaCustomUrl || null;
    }
    return null;
  };

  const currentImage = getCurrentImage();
  const effectiveType = portadaType || "auto";
  const crop = portadaCrop || { x: 0, y: 0, scale: 1 };

  const getTypeLabel = () => {
    switch (effectiveType) {
      case "auto":
        return "Automática";
      case "ejercicio":
        return "Desde ejercicio";
      case "custom":
        return "Personalizada";
      default:
        return "Sin definir";
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Image className="h-4 w-4 text-primary" />
          Portada
        </Label>

        <div className="flex items-start gap-4">
          {/* Preview Thumbnail */}
          <div
            className="relative overflow-hidden rounded-lg border border-border bg-muted flex-shrink-0"
            style={{ width: 90, height: 90 / ASPECT_RATIO }}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt="Portada preview"
                className="absolute w-full h-full object-cover"
                style={{
                  transform: `translate(${crop.x * 0.5}px, ${crop.y * 0.5}px) scale(${crop.scale})`,
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Info & Actions */}
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel()}
              </Badge>
              {effectiveType === "auto" && (
                <span className="text-xs text-muted-foreground">Recomendado</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {effectiveType === "auto"
                ? "Se usará una imagen de los ejercicios de la rutina"
                : effectiveType === "ejercicio"
                ? "Imagen de un ejercicio de la rutina"
                : "Imagen personalizada subida"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-fit h-7 text-xs gap-1"
              onClick={() => setModalOpen(true)}
            >
              <Pencil className="h-3 w-3" />
              Cambiar portada
            </Button>
          </div>
        </div>
      </div>

      <CoverPhotoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        portadaType={effectiveType}
        portadaEjercicioId={portadaEjercicioId}
        portadaCustomUrl={portadaCustomUrl}
        portadaCrop={portadaCrop}
        ejerciciosEnRutina={ejerciciosEnRutina}
        onSave={onPortadaChange}
      />
    </>
  );
};

export default CoverPhotoSection;
