import { useState, useEffect, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Video, Image, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Ejercicio {
  id: number;
  nombre: string;
  tips: string;
  mecanicas: string[];
  grupoMuscular: string[];
  musculosPrincipales: string[];
  aptitudesPrimarias: string[];
  aptitudesSecundarias: string[];
  implementos: string[];
  video: string | null;
  thumbnail: string | null;
}

interface CreateExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ejercicio?: Ejercicio | null;
  onSave?: (ejercicio: Ejercicio) => void;
}

const MECANICAS = [
  "Empuje",
  "Tracción",
  "Rotacional",
  "Locomoción",
  "Anti-movimiento",
  "Compuesto",
];

const GRUPOS_MUSCULARES = ["Tren Superior", "Tren Inferior", "Core", "Full Body"];

const MUSCULOS_PRINCIPALES = [
  "Bíceps",
  "Gemelos",
  "Glúteos",
  "Cuádriceps",
  "Espalda",
  "Hombros",
  "Pectoral",
  "Tríceps",
  "Zona media",
];

const APTITUDES = [
  "Fuerza",
  "Potencia",
  "Agilidad",
  "Coordinación",
  "Resistencia",
  "Estabilidad",
  "Movilidad",
  "Velocidad",
];

const IMPLEMENTOS_INICIALES = ["Sin implemento", "Banda", "Mancuerna", "Miniband"];

const CreateExerciseModal = ({ open, onOpenChange, ejercicio, onSave }: CreateExerciseModalProps) => {
  const { toast } = useToast();
  const isEditMode = !!ejercicio;
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [tips, setTips] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  
  // Drag & drop states
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  
  // Refs for file inputs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Categorization
  const [mecanicas, setMecanicas] = useState<string[]>([]);
  const [gruposMusculares, setGruposMusculares] = useState<string[]>([]);
  const [musculosPrincipales, setMusculosPrincipales] = useState<string[]>([]);
  
  // Aptitudes
  const [aptitudesPrimarias, setAptitudesPrimarias] = useState<string[]>([]);
  const [aptitudesSecundarias, setAptitudesSecundarias] = useState<string[]>([]);
  
  // Implementos
  const [implementos, setImplementos] = useState<string[]>([]);
  const [implementosDisponibles, setImplementosDisponibles] = useState(IMPLEMENTOS_INICIALES);
  const [nuevoImplemento, setNuevoImplemento] = useState("");
  const [showAddImplemento, setShowAddImplemento] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form when editing
  useEffect(() => {
    if (ejercicio && open) {
      setNombre(ejercicio.nombre);
      setTips(ejercicio.tips);
      setMecanicas(ejercicio.mecanicas);
      setGruposMusculares(ejercicio.grupoMuscular);
      setMusculosPrincipales(ejercicio.musculosPrincipales);
      setAptitudesPrimarias(ejercicio.aptitudesPrimarias);
      setAptitudesSecundarias(ejercicio.aptitudesSecundarias);
      setImplementos(ejercicio.implementos);
      setExistingVideo(ejercicio.video);
      setExistingThumbnail(ejercicio.thumbnail);
      setThumbnailPreview(ejercicio.thumbnail);
      
      // Add any custom implementos from the exercise
      const customImplementos = ejercicio.implementos.filter(
        (impl) => !IMPLEMENTOS_INICIALES.includes(impl)
      );
      if (customImplementos.length > 0) {
        setImplementosDisponibles([...IMPLEMENTOS_INICIALES, ...customImplementos]);
      }
    }
  }, [ejercicio, open]);

  // Valid file types
  const VALID_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
  const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processVideoFile(file);
  };

  const processImageFile = (file: File) => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPG, PNG o WebP.",
        variant: "destructive",
      });
      return;
    }
    setThumbnailFile(file);
    setExistingThumbnail(null);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const processVideoFile = (file: File) => {
    if (!VALID_VIDEO_TYPES.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos MP4, MOV o WebM.",
        variant: "destructive",
      });
      return;
    }
    setVideoFile(file);
    setExistingVideo(null);
  };

  // Drag & drop handlers for video
  const handleVideoDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(true);
  };

  const handleVideoDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
  };

  const handleVideoDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleVideoDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processVideoFile(file);
  };

  // Drag & drop handlers for thumbnail
  const handleThumbnailDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumbnail(true);
  };

  const handleThumbnailDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumbnail(false);
  };

  const handleThumbnailDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleThumbnailDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumbnail(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const toggleArrayItem = (
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleAptitudPrimariaToggle = (aptitud: string) => {
    if (aptitudesPrimarias.includes(aptitud)) {
      setAptitudesPrimarias(aptitudesPrimarias.filter((a) => a !== aptitud));
    } else {
      // Remove from secondary if exists
      setAptitudesSecundarias(aptitudesSecundarias.filter((a) => a !== aptitud));
      setAptitudesPrimarias([...aptitudesPrimarias, aptitud]);
    }
  };

  const handleAptitudSecundariaToggle = (aptitud: string) => {
    if (aptitudesSecundarias.includes(aptitud)) {
      setAptitudesSecundarias(aptitudesSecundarias.filter((a) => a !== aptitud));
    } else {
      // Can only be secondary if not primary
      if (!aptitudesPrimarias.includes(aptitud)) {
        setAptitudesSecundarias([...aptitudesSecundarias, aptitud]);
      }
    }
  };

  const handleAddImplemento = () => {
    if (nuevoImplemento.trim() && !implementosDisponibles.includes(nuevoImplemento.trim())) {
      setImplementosDisponibles([...implementosDisponibles, nuevoImplemento.trim()]);
      setImplementos([...implementos, nuevoImplemento.trim()]);
      setNuevoImplemento("");
      setShowAddImplemento(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!tips.trim()) newErrors.tips = "Los tips de ejecución son obligatorios";
    
    // For create mode, require files. For edit mode, accept existing or new
    if (!isEditMode) {
      if (!videoFile) newErrors.video = "El video es obligatorio";
      if (!thumbnailFile) newErrors.thumbnail = "La imagen de portada es obligatoria";
    } else {
      if (!videoFile && !existingVideo) newErrors.video = "El video es obligatorio";
      if (!thumbnailFile && !existingThumbnail) newErrors.thumbnail = "La imagen de portada es obligatoria";
    }
    
    if (aptitudesPrimarias.length === 0) {
      newErrors.aptitudesPrimarias = "Debes seleccionar al menos una aptitud principal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const savedEjercicio: Ejercicio = {
        id: ejercicio?.id || Date.now(),
        nombre,
        tips,
        mecanicas,
        grupoMuscular: gruposMusculares,
        musculosPrincipales,
        aptitudesPrimarias,
        aptitudesSecundarias,
        implementos,
        video: existingVideo || (videoFile ? URL.createObjectURL(videoFile) : null),
        thumbnail: thumbnailPreview,
      };
      
      onSave?.(savedEjercicio);
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset form
    setNombre("");
    setTips("");
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setExistingVideo(null);
    setExistingThumbnail(null);
    setMecanicas([]);
    setGruposMusculares([]);
    setMusculosPrincipales([]);
    setAptitudesPrimarias([]);
    setAptitudesSecundarias([]);
    setImplementos([]);
    setImplementosDisponibles(IMPLEMENTOS_INICIALES);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">
            {isEditMode ? "Editar Ejercicio" : "Crear Nuevo Ejercicio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* INFORMACIÓN BÁSICA */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2">
              Información Básica
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del ejercicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Sentadilla con mancuerna"
                  className={errors.nombre ? "border-destructive" : ""}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nombre}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tips">
                  Tips de ejecución <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="tips"
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  placeholder="Describe los puntos clave para ejecutar correctamente el ejercicio..."
                  rows={4}
                  className={errors.tips ? "border-destructive" : ""}
                />
                {errors.tips && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tips}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* CONTENIDO MULTIMEDIA */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2">
              Contenido Multimedia
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Video Upload */}
              <div className="space-y-2">
                <Label>
                  Video del ejercicio <span className="text-destructive">*</span>
                </Label>
                <div
                  onDragEnter={handleVideoDragEnter}
                  onDragLeave={handleVideoDragLeave}
                  onDragOver={handleVideoDragOver}
                  onDrop={handleVideoDrop}
                  onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                    isDraggingVideo 
                      ? "border-primary bg-primary/10 scale-[1.02]" 
                      : errors.video 
                        ? "border-destructive" 
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  {videoFile ? (
                    <div className="space-y-2">
                      <Video className="h-10 w-10 mx-auto text-primary" />
                      <p className="text-sm text-foreground font-medium truncate">
                        {videoFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : existingVideo ? (
                    <div className="space-y-2">
                      <Video className="h-10 w-10 mx-auto text-primary" />
                      <p className="text-sm text-foreground font-medium">
                        Video actual
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Clic o arrastra para cambiar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className={`h-10 w-10 mx-auto ${isDraggingVideo ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`text-sm ${isDraggingVideo ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {isDraggingVideo ? "Suelta el video aquí" : "Arrastra o haz clic para subir"}
                      </p>
                      <p className="text-xs text-muted-foreground">MP4, MOV, WebM</p>
                    </div>
                  )}
                </div>
                {errors.video && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.video}
                  </p>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>
                  Imagen de portada <span className="text-destructive">*</span>
                </Label>
                <div
                  onDragEnter={handleThumbnailDragEnter}
                  onDragLeave={handleThumbnailDragLeave}
                  onDragOver={handleThumbnailDragOver}
                  onDrop={handleThumbnailDrop}
                  onClick={() => thumbnailInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                    isDraggingThumbnail 
                      ? "border-primary bg-primary/10 scale-[1.02]" 
                      : errors.thumbnail 
                        ? "border-destructive" 
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  {thumbnailPreview ? (
                    <div className="space-y-2">
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="h-20 w-auto mx-auto rounded-lg object-cover"
                      />
                      <p className="text-sm text-foreground font-medium truncate">
                        {thumbnailFile?.name || "Imagen actual"}
                      </p>
                      {(isEditMode || thumbnailFile) && (
                        <p className="text-xs text-muted-foreground">
                          Clic o arrastra para cambiar
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Image className={`h-10 w-10 mx-auto ${isDraggingThumbnail ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`text-sm ${isDraggingThumbnail ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {isDraggingThumbnail ? "Suelta la imagen aquí" : "Arrastra o haz clic para subir"}
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP</p>
                    </div>
                  )}
                </div>
                {errors.thumbnail && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.thumbnail}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* CATEGORIZACIÓN */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2">
              Categorización
            </h3>
            <div className="grid gap-6">
              {/* Mecánica */}
              <div className="space-y-3">
                <Label>Mecánica</Label>
                <div className="flex flex-wrap gap-2">
                  {MECANICAS.map((mecanica) => (
                    <Badge
                      key={mecanica}
                      variant={mecanicas.includes(mecanica) ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:bg-primary/20"
                      onClick={() => toggleArrayItem(mecanicas, setMecanicas, mecanica)}
                    >
                      {mecanica}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Grupo Muscular */}
              <div className="space-y-3">
                <Label>Grupo Muscular</Label>
                <div className="flex flex-wrap gap-2">
                  {GRUPOS_MUSCULARES.map((grupo) => (
                    <Badge
                      key={grupo}
                      variant={gruposMusculares.includes(grupo) ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:bg-primary/20"
                      onClick={() => toggleArrayItem(gruposMusculares, setGruposMusculares, grupo)}
                    >
                      {grupo}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Músculos Principales */}
              <div className="space-y-3">
                <Label>Músculos Principales</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {MUSCULOS_PRINCIPALES.map((musculo) => (
                    <div key={musculo} className="flex items-center space-x-2">
                      <Checkbox
                        id={`musculo-${musculo}`}
                        checked={musculosPrincipales.includes(musculo)}
                        onCheckedChange={() =>
                          toggleArrayItem(musculosPrincipales, setMusculosPrincipales, musculo)
                        }
                      />
                      <label
                        htmlFor={`musculo-${musculo}`}
                        className="text-sm cursor-pointer"
                      >
                        {musculo}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* APTITUDES FÍSICAS */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2">
              Aptitudes Físicas
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Aptitudes Primarias */}
              <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <Label className="text-primary font-semibold">
                    Aptitudes Principales <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">Al menos una</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {APTITUDES.map((aptitud) => (
                    <div key={`primary-${aptitud}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`primary-${aptitud}`}
                        checked={aptitudesPrimarias.includes(aptitud)}
                        onCheckedChange={() => handleAptitudPrimariaToggle(aptitud)}
                      />
                      <label
                        htmlFor={`primary-${aptitud}`}
                        className="text-sm cursor-pointer"
                      >
                        {aptitud}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.aptitudesPrimarias && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.aptitudesPrimarias}
                  </p>
                )}
              </div>

              {/* Aptitudes Secundarias */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground font-semibold">
                    Aptitudes Secundarias
                  </Label>
                  <span className="text-xs text-muted-foreground">Opcional</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {APTITUDES.map((aptitud) => {
                    const isPrimaria = aptitudesPrimarias.includes(aptitud);
                    return (
                      <div
                        key={`secondary-${aptitud}`}
                        className={`flex items-center space-x-2 ${
                          isPrimaria ? "opacity-40" : ""
                        }`}
                      >
                        <Checkbox
                          id={`secondary-${aptitud}`}
                          checked={aptitudesSecundarias.includes(aptitud)}
                          disabled={isPrimaria}
                          onCheckedChange={() => handleAptitudSecundariaToggle(aptitud)}
                        />
                        <label
                          htmlFor={`secondary-${aptitud}`}
                          className={`text-sm ${isPrimaria ? "line-through" : "cursor-pointer"}`}
                        >
                          {aptitud}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Representa trabajo complementario o indirecto
                </p>
              </div>
            </div>
          </section>

          {/* IMPLEMENTOS */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2">
              Implementos
            </h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {implementosDisponibles.map((impl) => (
                  <Badge
                    key={impl}
                    variant={implementos.includes(impl) ? "default" : "outline"}
                    className="cursor-pointer transition-colors hover:bg-primary/20"
                    onClick={() => toggleArrayItem(implementos, setImplementos, impl)}
                  >
                    {impl}
                  </Badge>
                ))}
                <Badge
                  variant="outline"
                  className="cursor-pointer border-dashed hover:border-primary hover:text-primary"
                  onClick={() => setShowAddImplemento(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar nuevo
                </Badge>
              </div>

              {showAddImplemento && (
                <div className="flex items-center gap-2 max-w-sm">
                  <Input
                    value={nuevoImplemento}
                    onChange={(e) => setNuevoImplemento(e.target.value)}
                    placeholder="Nombre del implemento"
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddImplemento()}
                  />
                  <Button size="sm" onClick={handleAddImplemento}>
                    Agregar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddImplemento(false);
                      setNuevoImplemento("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {isEditMode ? "Guardar Cambios" : "Guardar Ejercicio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExerciseModal;
