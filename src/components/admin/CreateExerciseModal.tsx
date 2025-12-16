import { useState } from "react";
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

interface CreateExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const CreateExerciseModal = ({ open, onOpenChange }: CreateExerciseModalProps) => {
  // Form state
  const [nombre, setNombre] = useState("");
  const [tips, setTips] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
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
    if (!videoFile) newErrors.video = "El video es obligatorio";
    if (!thumbnailFile) newErrors.thumbnail = "La imagen de portada es obligatoria";
    if (aptitudesPrimarias.length === 0) {
      newErrors.aptitudesPrimarias = "Debes seleccionar al menos una aptitud principal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // Here you would submit the form data
      console.log({
        nombre,
        tips,
        videoFile,
        thumbnailFile,
        mecanicas,
        gruposMusculares,
        musculosPrincipales,
        aptitudesPrimarias,
        aptitudesSecundarias,
        implementos,
      });
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
    setMecanicas([]);
    setGruposMusculares([]);
    setMusculosPrincipales([]);
    setAptitudesPrimarias([]);
    setAptitudesSecundarias([]);
    setImplementos([]);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Crear Nuevo Ejercicio</DialogTitle>
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
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    errors.video ? "border-destructive" : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
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
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Haz clic para subir video
                        </p>
                        <p className="text-xs text-muted-foreground">MP4, MOV, WebM</p>
                      </div>
                    )}
                  </label>
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
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    errors.thumbnail ? "border-destructive" : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    {thumbnailPreview ? (
                      <div className="space-y-2">
                        <img
                          src={thumbnailPreview}
                          alt="Preview"
                          className="h-20 w-auto mx-auto rounded-lg object-cover"
                        />
                        <p className="text-sm text-foreground font-medium truncate">
                          {thumbnailFile?.name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Image className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Haz clic para subir imagen
                        </p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WebP</p>
                      </div>
                    )}
                  </label>
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
          <Button onClick={handleSubmit}>Guardar Ejercicio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExerciseModal;
