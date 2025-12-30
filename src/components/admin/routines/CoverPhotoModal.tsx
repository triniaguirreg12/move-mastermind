import { useState, useRef, DragEvent, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Wand2, Dumbbell, RotateCcw, Check, ZoomIn, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Ejercicio } from "@/components/admin/CreateExerciseModal";

interface CropData {
  x: number;
  y: number;
  scale: number;
}

interface CoverPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portadaType: "auto" | "ejercicio" | "custom" | "";
  portadaEjercicioId?: number;
  portadaCustomUrl?: string;
  portadaCrop?: CropData;
  ejerciciosEnRutina: Ejercicio[];
  onSave: (
    type: "auto" | "ejercicio" | "custom" | "",
    ejercicioId?: number,
    customUrl?: string,
    crop?: CropData
  ) => void;
}

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ASPECT_RATIO = 3 / 4; // Vertical 3:4

interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
}

const CoverPhotoModal = ({
  open,
  onOpenChange,
  portadaType,
  portadaEjercicioId,
  portadaCustomUrl,
  portadaCrop,
  ejerciciosEnRutina,
  onSave,
}: CoverPhotoModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for editing
  const [localType, setLocalType] = useState<"auto" | "ejercicio" | "custom" | "">(portadaType || "auto");
  const [localEjercicioId, setLocalEjercicioId] = useState<number | undefined>(portadaEjercicioId);
  const [localCustomUrl, setLocalCustomUrl] = useState<string | undefined>(portadaCustomUrl);
  const [localCrop, setLocalCrop] = useState<CropData>(portadaCrop || { x: 0, y: 0, scale: 1 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Viewport dimensions (the visible crop area)
  const VIEWPORT_WIDTH = 180;
  const VIEWPORT_HEIGHT = VIEWPORT_WIDTH / ASPECT_RATIO;

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalType(portadaType || "auto");
      setLocalEjercicioId(portadaEjercicioId);
      setLocalCustomUrl(portadaCustomUrl);
      setLocalCrop(portadaCrop || { x: 0, y: 0, scale: 1 });
      setImageDimensions(null);
    }
  }, [open, portadaType, portadaEjercicioId, portadaCustomUrl, portadaCrop]);

  const ejerciciosConThumbnail = ejerciciosEnRutina.filter((ej) => ej.thumbnail);

  // Get current preview image
  const getCurrentImage = useCallback((): string | null => {
    if (localType === "auto") {
      const firstWithThumb = ejerciciosConThumbnail[0];
      return firstWithThumb?.thumbnail || null;
    }
    if (localType === "ejercicio") {
      return ejerciciosEnRutina.find((ej) => ej.id === localEjercicioId)?.thumbnail || null;
    }
    if (localType === "custom") {
      return localCustomUrl || null;
    }
    return null;
  }, [localType, localEjercicioId, localCustomUrl, ejerciciosEnRutina, ejerciciosConThumbnail]);

  // Load image dimensions when image changes
  const currentImage = getCurrentImage();
  
  useEffect(() => {
    if (!currentImage) {
      setImageDimensions(null);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };
    img.src = currentImage;
  }, [currentImage]);

  // Calculate image size that fits the viewport while maintaining aspect ratio
  // Image must be at least as large as viewport in both dimensions (cover behavior)
  const getImageDisplaySize = useCallback(() => {
    if (!imageDimensions) return { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT };
    
    const { naturalWidth, naturalHeight } = imageDimensions;
    const imageAspect = naturalWidth / naturalHeight;
    const viewportAspect = ASPECT_RATIO;
    
    let baseWidth: number;
    let baseHeight: number;
    
    // Scale image to cover the viewport (minimum size to fill it)
    if (imageAspect > viewportAspect) {
      // Image is wider - fit to height
      baseHeight = VIEWPORT_HEIGHT;
      baseWidth = baseHeight * imageAspect;
    } else {
      // Image is taller - fit to width
      baseWidth = VIEWPORT_WIDTH;
      baseHeight = baseWidth / imageAspect;
    }
    
    return { width: baseWidth, height: baseHeight };
  }, [imageDimensions]);

  // Calculate pan limits based on image size, viewport, and scale
  const getPanLimits = useCallback(() => {
    const { width: imgWidth, height: imgHeight } = getImageDisplaySize();
    const scaledWidth = imgWidth * localCrop.scale;
    const scaledHeight = imgHeight * localCrop.scale;
    
    // How much the image extends beyond viewport
    const overflowX = Math.max(0, (scaledWidth - VIEWPORT_WIDTH) / 2);
    const overflowY = Math.max(0, (scaledHeight - VIEWPORT_HEIGHT) / 2);
    
    return {
      minX: -overflowX,
      maxX: overflowX,
      minY: -overflowY,
      maxY: overflowY,
    };
  }, [getImageDisplaySize, localCrop.scale]);

  // Clamp position to valid limits
  const clampPosition = useCallback((x: number, y: number) => {
    const limits = getPanLimits();
    return {
      x: Math.max(limits.minX, Math.min(limits.maxX, x)),
      y: Math.max(limits.minY, Math.min(limits.maxY, y)),
    };
  }, [getPanLimits]);

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
      setLocalType("custom");
      setLocalCustomUrl(e.target?.result as string);
      setLocalCrop({ x: 0, y: 0, scale: 1 });
      setImageDimensions(null);
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
    setLocalType("ejercicio");
    setLocalEjercicioId(ejercicioId);
    setLocalCrop({ x: 0, y: 0, scale: 1 });
    setImageDimensions(null);
  };

  const handleSelectAuto = () => {
    setLocalType("auto");
    setLocalCrop({ x: 0, y: 0, scale: 1 });
    setImageDimensions(null);
  };

  const resetCrop = () => {
    setLocalCrop({ x: 0, y: 0, scale: 1 });
  };

  // Pan handling
  const handlePanStart = (e: React.MouseEvent) => {
    if (localType === "auto") return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - localCrop.x, y: e.clientY - localCrop.y });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - panStart.x;
    const newY = e.clientY - panStart.y;
    const clamped = clampPosition(newX, newY);
    setLocalCrop(prev => ({ ...prev, x: clamped.x, y: clamped.y }));
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Handle scale change - also clamp position
  const handleScaleChange = (newScale: number) => {
    setLocalCrop(prev => {
      const newCrop = { ...prev, scale: newScale };
      // Recalculate limits with new scale and clamp position
      const { width: imgWidth, height: imgHeight } = getImageDisplaySize();
      const scaledWidth = imgWidth * newScale;
      const scaledHeight = imgHeight * newScale;
      const overflowX = Math.max(0, (scaledWidth - VIEWPORT_WIDTH) / 2);
      const overflowY = Math.max(0, (scaledHeight - VIEWPORT_HEIGHT) / 2);
      
      return {
        ...newCrop,
        x: Math.max(-overflowX, Math.min(overflowX, prev.x)),
        y: Math.max(-overflowY, Math.min(overflowY, prev.y)),
      };
    });
  };

  const handleSave = () => {
    onSave(localType, localEjercicioId, localCustomUrl, localCrop);
    onOpenChange(false);
  };

  const showEditor = localType !== "" && currentImage;
  const { width: imgWidth, height: imgHeight } = getImageDisplaySize();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Configurar portada</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Options */}
          <div className="w-72 border-r border-border">
            <ScrollArea className="h-[60vh]">
              <div className="p-4 space-y-4">
                {/* Auto Option */}
                <button
                  onClick={handleSelectAuto}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    localType === "auto"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Automática</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Recomendado</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se usará automáticamente una imagen de los ejercicios de la rutina
                  </p>
                </button>

                {/* From Exercises */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Dumbbell className="h-3 w-3" />
                    Elegir desde ejercicios
                  </Label>
                  {ejerciciosConThumbnail.length === 0 ? (
                    <div className="p-4 border border-dashed border-border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">
                        Agrega ejercicios con miniatura para elegir una
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {ejerciciosConThumbnail.map((ej) => (
                        <button
                          key={ej.id}
                          onClick={() => handleSelectEjercicio(ej.id)}
                          className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                            localType === "ejercicio" && localEjercicioId === ej.id
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-transparent hover:border-primary/50"
                          }`}
                        >
                          <img
                            src={ej.thumbnail!}
                            alt={ej.nombre}
                            className="w-full h-full object-cover"
                          />
                          {localType === "ejercicio" && localEjercicioId === ej.id && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Upload className="h-3 w-3" />
                    Subir imagen
                  </Label>
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      isDragging
                        ? "border-primary bg-primary/10"
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
                    <Upload className={`h-6 w-6 mb-1 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    <p className={`text-xs ${isDragging ? "text-primary" : "text-muted-foreground"}`}>
                      Arrastra o haz clic
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right: Preview & Editor */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Vista previa</Label>
              {showEditor && localType !== "auto" && (
                <Button variant="ghost" size="sm" onClick={resetCrop} className="h-7 text-xs gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Restablecer
                </Button>
              )}
            </div>

            {/* Preview Container */}
            <div className="flex-1 flex items-center justify-center">
              {showEditor && imageDimensions ? (
                <div className="space-y-4 w-full max-w-xs">
                  {/* Crop Editor - Viewport acts as a window into the full image */}
                  <div
                    ref={editorRef}
                    className="relative mx-auto overflow-hidden rounded-lg border border-border bg-muted"
                    style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
                    onMouseDown={handlePanStart}
                    onMouseMove={handlePanMove}
                    onMouseUp={handlePanEnd}
                    onMouseLeave={handlePanEnd}
                  >
                    {/* Image positioned absolutely, centered, with pan/zoom transforms */}
                    <img
                      src={currentImage}
                      alt="Preview"
                      className="absolute select-none"
                      style={{
                        width: imgWidth,
                        height: imgHeight,
                        // Center the image, then apply pan offset and scale
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${localCrop.x}px, ${localCrop.y}px) scale(${localCrop.scale})`,
                        transformOrigin: 'center center',
                        cursor: localType === "auto" ? "default" : isPanning ? "grabbing" : "grab",
                      }}
                      draggable={false}
                    />
                    {localType !== "auto" && (
                      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-0.5 flex items-center gap-1 text-[10px] text-muted-foreground pointer-events-none">
                        <Move className="h-3 w-3" />
                        Arrastra para ajustar
                      </div>
                    )}
                  </div>

                  {/* Zoom Slider */}
                  {localType !== "auto" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          value={[localCrop.scale]}
                          min={1}
                          max={2.5}
                          step={0.05}
                          onValueChange={([value]) => handleScaleChange(value)}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {Math.round(localCrop.scale * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {localType === "auto" && "Portada automática"}
                      {localType === "ejercicio" && "Desde ejercicio"}
                      {localType === "custom" && "Imagen personalizada"}
                    </Badge>
                  </div>
                </div>
              ) : showEditor ? (
                <div className="text-center text-muted-foreground">
                  <div className="w-32 h-40 border border-border rounded-lg flex items-center justify-center mx-auto mb-2 animate-pulse bg-muted" />
                  <p className="text-sm">Cargando imagen...</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="w-32 h-40 border-2 border-dashed border-border rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm">Selecciona una opción</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!localType}>
                Guardar portada
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoverPhotoModal;
