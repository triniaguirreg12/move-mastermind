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
  portadaCropCard?: CropData;
  portadaCropDetail?: CropData;
  ejerciciosEnRutina: Ejercicio[];
  onSave: (
    type: "auto" | "ejercicio" | "custom" | "",
    ejercicioId?: number,
    customUrl?: string,
    cropCard?: CropData,
    cropDetail?: CropData
  ) => void;
}

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Aspect ratios for different views
const CARD_ASPECT_RATIO = 3 / 4; // Vertical 3:4 for library cards
const DETAIL_ASPECT_RATIO = 16 / 10; // Horizontal for routine detail header

interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
}

const DEFAULT_CROP: CropData = { x: 0, y: 0, scale: 1 };

const CoverPhotoModal = ({
  open,
  onOpenChange,
  portadaType,
  portadaEjercicioId,
  portadaCustomUrl,
  portadaCropCard,
  portadaCropDetail,
  ejerciciosEnRutina,
  onSave,
}: CoverPhotoModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for editing
  const [localType, setLocalType] = useState<"auto" | "ejercicio" | "custom" | "">(portadaType || "auto");
  const [localEjercicioId, setLocalEjercicioId] = useState<number | undefined>(portadaEjercicioId);
  const [localCustomUrl, setLocalCustomUrl] = useState<string | undefined>(portadaCustomUrl);
  const [localCropCard, setLocalCropCard] = useState<CropData>(portadaCropCard || DEFAULT_CROP);
  const [localCropDetail, setLocalCropDetail] = useState<CropData>(portadaCropDetail || DEFAULT_CROP);
  
  // Which preview is currently being panned
  const [activePanTarget, setActivePanTarget] = useState<"card" | "detail" | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  
  // Viewport dimensions for card preview
  const CARD_VIEWPORT_WIDTH = 160;
  const CARD_VIEWPORT_HEIGHT = CARD_VIEWPORT_WIDTH / CARD_ASPECT_RATIO;
  
  // Viewport dimensions for detail preview
  const DETAIL_VIEWPORT_WIDTH = 200;
  const DETAIL_VIEWPORT_HEIGHT = DETAIL_VIEWPORT_WIDTH / DETAIL_ASPECT_RATIO;

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalType(portadaType || "auto");
      setLocalEjercicioId(portadaEjercicioId);
      setLocalCustomUrl(portadaCustomUrl);
      setLocalCropCard(portadaCropCard || DEFAULT_CROP);
      setLocalCropDetail(portadaCropDetail || DEFAULT_CROP);
      setImageDimensions(null);
      setActivePanTarget(null);
    }
  }, [open, portadaType, portadaEjercicioId, portadaCustomUrl, portadaCropCard, portadaCropDetail]);

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

  // Calculate min scale for a given viewport
  const getMinScale = useCallback((viewportWidth: number, viewportHeight: number) => {
    if (!imageDimensions) return 1;
    const { naturalWidth, naturalHeight } = imageDimensions;
    const scaleX = viewportWidth / naturalWidth;
    const scaleY = viewportHeight / naturalHeight;
    return Math.max(scaleX, scaleY);
  }, [imageDimensions]);

  // Calculate pan limits for a given viewport and crop
  const getPanLimits = useCallback((viewportWidth: number, viewportHeight: number, crop: CropData) => {
    if (!imageDimensions) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const { naturalWidth, naturalHeight } = imageDimensions;
    const minScale = getMinScale(viewportWidth, viewportHeight);
    const totalScale = minScale * crop.scale;
    
    const scaledWidth = naturalWidth * totalScale;
    const scaledHeight = naturalHeight * totalScale;
    
    const overflowX = Math.max(0, (scaledWidth - viewportWidth) / 2);
    const overflowY = Math.max(0, (scaledHeight - viewportHeight) / 2);
    
    return { minX: -overflowX, maxX: overflowX, minY: -overflowY, maxY: overflowY };
  }, [imageDimensions, getMinScale]);

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
      setLocalCropCard(DEFAULT_CROP);
      setLocalCropDetail(DEFAULT_CROP);
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
    setLocalCropCard(DEFAULT_CROP);
    setLocalCropDetail(DEFAULT_CROP);
    setImageDimensions(null);
  };

  const handleSelectAuto = () => {
    setLocalType("auto");
    setLocalCropCard(DEFAULT_CROP);
    setLocalCropDetail(DEFAULT_CROP);
    setImageDimensions(null);
  };

  const resetCropCard = () => setLocalCropCard(DEFAULT_CROP);
  const resetCropDetail = () => setLocalCropDetail(DEFAULT_CROP);

  // Pan handling for Card
  const handleCardPanStart = (e: React.MouseEvent) => {
    if (localType === "auto") return;
    e.preventDefault();
    setIsPanning(true);
    setActivePanTarget("card");
    setPanStart({ x: e.clientX - localCropCard.x, y: e.clientY - localCropCard.y });
  };

  // Pan handling for Detail
  const handleDetailPanStart = (e: React.MouseEvent) => {
    if (localType === "auto") return;
    e.preventDefault();
    setIsPanning(true);
    setActivePanTarget("detail");
    setPanStart({ x: e.clientX - localCropDetail.x, y: e.clientY - localCropDetail.y });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning || !activePanTarget) return;
    
    const newX = e.clientX - panStart.x;
    const newY = e.clientY - panStart.y;
    
    if (activePanTarget === "card") {
      const limits = getPanLimits(CARD_VIEWPORT_WIDTH, CARD_VIEWPORT_HEIGHT, localCropCard);
      setLocalCropCard(prev => ({
        ...prev,
        x: Math.max(limits.minX, Math.min(limits.maxX, newX)),
        y: Math.max(limits.minY, Math.min(limits.maxY, newY)),
      }));
    } else {
      const limits = getPanLimits(DETAIL_VIEWPORT_WIDTH, DETAIL_VIEWPORT_HEIGHT, localCropDetail);
      setLocalCropDetail(prev => ({
        ...prev,
        x: Math.max(limits.minX, Math.min(limits.maxX, newX)),
        y: Math.max(limits.minY, Math.min(limits.maxY, newY)),
      }));
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    setActivePanTarget(null);
  };

  // Handle scale change for Card
  const handleCardScaleChange = (newScale: number) => {
    if (!imageDimensions) return;
    const limits = getPanLimits(CARD_VIEWPORT_WIDTH, CARD_VIEWPORT_HEIGHT, { ...localCropCard, scale: newScale });
    setLocalCropCard(prev => ({
      scale: newScale,
      x: Math.max(limits.minX, Math.min(limits.maxX, prev.x)),
      y: Math.max(limits.minY, Math.min(limits.maxY, prev.y)),
    }));
  };

  // Handle scale change for Detail
  const handleDetailScaleChange = (newScale: number) => {
    if (!imageDimensions) return;
    const limits = getPanLimits(DETAIL_VIEWPORT_WIDTH, DETAIL_VIEWPORT_HEIGHT, { ...localCropDetail, scale: newScale });
    setLocalCropDetail(prev => ({
      scale: newScale,
      x: Math.max(limits.minX, Math.min(limits.maxX, prev.x)),
      y: Math.max(limits.minY, Math.min(limits.maxY, prev.y)),
    }));
  };

  const handleSave = () => {
    onSave(localType, localEjercicioId, localCustomUrl, localCropCard, localCropDetail);
    onOpenChange(false);
  };

  const showEditor = localType !== "" && currentImage;

  // Calculate total scales
  const cardTotalScale = imageDimensions ? getMinScale(CARD_VIEWPORT_WIDTH, CARD_VIEWPORT_HEIGHT) * localCropCard.scale : 1;
  const detailTotalScale = imageDimensions ? getMinScale(DETAIL_VIEWPORT_WIDTH, DETAIL_VIEWPORT_HEIGHT) * localCropDetail.scale : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Configurar portada</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Options */}
          <div className="w-64 border-r border-border">
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
                    Se usará automáticamente una imagen de los ejercicios
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
                        Agrega ejercicios con miniatura
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
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Vista previa</Label>
            </div>

            {/* Preview Container */}
            <div className="flex-1 flex items-center justify-center overflow-auto">
              {showEditor && imageDimensions ? (
                <div className="space-y-4 w-full">
                  {/* Both Previews Side by Side */}
                  <div className="flex items-start justify-center gap-4">
                    {/* Card Preview (3:4 vertical) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Card Biblioteca</p>
                        {localType !== "auto" && (
                          <Button variant="ghost" size="sm" onClick={resetCropCard} className="h-5 text-[10px] gap-0.5 px-1">
                            <RotateCcw className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                      <div
                        className={`relative mx-auto overflow-hidden rounded-lg border-2 bg-muted transition-colors ${
                          activePanTarget === "card" ? "border-primary" : "border-border"
                        }`}
                        style={{ width: CARD_VIEWPORT_WIDTH, height: CARD_VIEWPORT_HEIGHT }}
                        onMouseDown={handleCardPanStart}
                        onMouseMove={handlePanMove}
                        onMouseUp={handlePanEnd}
                        onMouseLeave={handlePanEnd}
                      >
                        <img
                          src={currentImage}
                          alt="Preview Card"
                          className="absolute select-none"
                          style={{
                            width: imageDimensions.naturalWidth,
                            height: imageDimensions.naturalHeight,
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) translate(${localCropCard.x}px, ${localCropCard.y}px) scale(${cardTotalScale})`,
                            transformOrigin: 'center center',
                            cursor: localType === "auto" ? "default" : isPanning && activePanTarget === "card" ? "grabbing" : "grab",
                          }}
                          draggable={false}
                        />
                        {localType !== "auto" && (
                          <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm rounded px-1 py-0.5 flex items-center gap-0.5 text-[8px] text-muted-foreground pointer-events-none">
                            <Move className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                      {/* Card Zoom Slider */}
                      {localType !== "auto" && (
                        <div className="flex items-center gap-1.5">
                          <ZoomIn className="h-3 w-3 text-muted-foreground" />
                          <Slider
                            value={[localCropCard.scale]}
                            min={1}
                            max={2.5}
                            step={0.05}
                            onValueChange={([value]) => handleCardScaleChange(value)}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-muted-foreground w-8 text-right">
                            {Math.round(localCropCard.scale * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detail Preview (16:10 horizontal) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Detalle Rutina</p>
                        {localType !== "auto" && (
                          <Button variant="ghost" size="sm" onClick={resetCropDetail} className="h-5 text-[10px] gap-0.5 px-1">
                            <RotateCcw className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                      <div
                        className={`relative mx-auto overflow-hidden rounded-lg border-2 bg-muted transition-colors ${
                          activePanTarget === "detail" ? "border-primary" : "border-border"
                        }`}
                        style={{ width: DETAIL_VIEWPORT_WIDTH, height: DETAIL_VIEWPORT_HEIGHT }}
                        onMouseDown={handleDetailPanStart}
                        onMouseMove={handlePanMove}
                        onMouseUp={handlePanEnd}
                        onMouseLeave={handlePanEnd}
                      >
                        <img
                          src={currentImage}
                          alt="Preview Detalle"
                          className="absolute select-none"
                          style={{
                            width: imageDimensions.naturalWidth,
                            height: imageDimensions.naturalHeight,
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) translate(${localCropDetail.x}px, ${localCropDetail.y}px) scale(${detailTotalScale})`,
                            transformOrigin: 'center center',
                            cursor: localType === "auto" ? "default" : isPanning && activePanTarget === "detail" ? "grabbing" : "grab",
                          }}
                          draggable={false}
                        />
                        {/* Gradient overlay like in actual detail page */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
                        {localType !== "auto" && (
                          <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm rounded px-1 py-0.5 flex items-center gap-0.5 text-[8px] text-muted-foreground pointer-events-none">
                            <Move className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                      {/* Detail Zoom Slider */}
                      {localType !== "auto" && (
                        <div className="flex items-center gap-1.5">
                          <ZoomIn className="h-3 w-3 text-muted-foreground" />
                          <Slider
                            value={[localCropDetail.scale]}
                            min={1}
                            max={2.5}
                            step={0.05}
                            onValueChange={([value]) => handleDetailScaleChange(value)}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-muted-foreground w-8 text-right">
                            {Math.round(localCropDetail.scale * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

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
