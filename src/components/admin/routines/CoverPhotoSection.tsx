import { useState, useRef, DragEvent } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Image, Dumbbell, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Ejercicio } from "@/components/admin/CreateExerciseModal";

interface CoverPhotoSectionProps {
  portadaType: "ejercicio" | "custom" | "";
  portadaEjercicioId?: number;
  portadaCustomUrl?: string;
  ejerciciosEnRutina: Ejercicio[];
  onPortadaChange: (type: "ejercicio" | "custom" | "", ejercicioId?: number, customUrl?: string) => void;
}

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CoverPhotoSection = ({
  portadaType,
  portadaEjercicioId,
  portadaCustomUrl,
  ejerciciosEnRutina,
  onPortadaChange,
}: CoverPhotoSectionProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(portadaType || "ejercicio");

  const ejerciciosConThumbnail = ejerciciosEnRutina.filter((ej) => ej.thumbnail);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPG, PNG o WebP.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onPortadaChange("custom", undefined, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSelectEjercicio = (ejercicioId: number) => {
    onPortadaChange("ejercicio", ejercicioId, undefined);
  };

  const clearPortada = () => {
    onPortadaChange("", undefined, undefined);
  };

  const currentPreview = portadaType === "ejercicio" 
    ? ejerciciosEnRutina.find((ej) => ej.id === portadaEjercicioId)?.thumbnail
    : portadaCustomUrl;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Image className="h-4 w-4 text-primary" />
          Portada de la rutina
        </Label>
        {currentPreview && (
          <Button variant="ghost" size="sm" onClick={clearPortada} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            Quitar
          </Button>
        )}
      </div>

      {currentPreview && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
          <img
            src={currentPreview}
            alt="Portada preview"
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm">
            {portadaType === "ejercicio" ? "Desde ejercicio" : "Personalizada"}
          </Badge>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="ejercicio" className="text-xs gap-1">
            <Dumbbell className="h-3 w-3" />
            Usar de ejercicio
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs gap-1">
            <Upload className="h-3 w-3" />
            Subir nueva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ejercicio" className="mt-3">
          {ejerciciosConThumbnail.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-border rounded-lg">
              <Dumbbell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Agrega ejercicios con miniatura<br />para usarlos como portada
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {ejerciciosConThumbnail.map((ej) => (
                <button
                  key={ej.id}
                  onClick={() => handleSelectEjercicio(ej.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    portadaType === "ejercicio" && portadaEjercicioId === ej.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <img
                    src={ej.thumbnail!}
                    alt={ej.nombre}
                    className="w-full h-full object-cover"
                  />
                  {portadaType === "ejercicio" && portadaEjercicioId === ej.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                    <p className="text-[10px] text-white truncate">{ej.nombre}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="mt-3">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className={`h-8 w-8 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className={`text-sm ${isDragging ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {isDragging ? "Suelta la imagen aquí" : "Arrastra o haz clic para subir"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoverPhotoSection;
