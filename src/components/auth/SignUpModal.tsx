import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", 
  "Cuba", "Ecuador", "El Salvador", "España", "Guatemala", "Honduras", 
  "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", 
  "República Dominicana", "Uruguay", "Venezuela", "Otro"
];

export const SignUpModal = ({ open, onOpenChange, onSuccess }: SignUpModalProps) => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState<Date>();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!email.trim()) newErrors.email = "El correo es obligatorio";
    else if (!validateEmail(email)) newErrors.email = "El formato del correo no es válido";
    if (!password) newErrors.password = "La contraseña es obligatoria";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    if (!sex) newErrors.sex = "Selecciona una opción";
    if (!birthDate) newErrors.birthDate = "La fecha de nacimiento es obligatoria";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setUseManualLocation(true);
      toast({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización. Por favor ingresa tu ubicación manualmente.",
        variant: "destructive",
      });
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          
          const detectedCountry = data.address?.country || "";
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || "";
          
          setCountry(detectedCountry);
          setCity(detectedCity);
          toast({
            title: "Ubicación detectada",
            description: `${detectedCity ? detectedCity + ", " : ""}${detectedCountry}`,
          });
        } catch {
          setUseManualLocation(true);
          toast({
            title: "Error al obtener ubicación",
            description: "Por favor ingresa tu ubicación manualmente.",
            variant: "destructive",
          });
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setUseManualLocation(true);
        toast({
          title: "Permiso denegado",
          description: "Por favor ingresa tu ubicación manualmente.",
          variant: "destructive",
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);
    
    const { error } = await signUp(email, password, {
      name: name.trim(),
      sex,
      birth_date: birthDate ? format(birthDate, "yyyy-MM-dd") : "",
      country: country || undefined,
      city: city || undefined,
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        setErrors({ email: "Este correo ya está registrado" });
      } else {
        toast({
          title: "Error al crear cuenta",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "¡Cuenta creada con éxito!",
      description: "Bienvenido a Just MUV",
    });
    
    onSuccess();
  };

  const isFormValid = name && email && password && confirmPassword && sex && birthDate && password === confirmPassword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground text-center">
            Crear cuenta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="signup-name" className="text-foreground">Nombre *</Label>
            <Input
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              className="h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl px-4"
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-foreground">Correo electrónico *</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl px-4"
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-foreground">Contraseña *</Label>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl px-4"
            />
            {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="signup-confirm" className="text-foreground">Confirmar contraseña *</Label>
            <Input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              className="h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl px-4"
            />
            {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
          </div>

          {/* Sex */}
          <div className="space-y-2">
            <Label className="text-foreground">Sexo *</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger className="h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mujer">Mujer</SelectItem>
                <SelectItem value="Hombre">Hombre</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
                <SelectItem value="Prefiero no decirlo">Prefiero no decirlo</SelectItem>
              </SelectContent>
            </Select>
            {errors.sex && <p className="text-destructive text-sm">{errors.sex}</p>}
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label className="text-foreground">Fecha de nacimiento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-transparent border-2 border-muted-foreground/30 rounded-xl",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100] bg-background border-border" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {errors.birthDate && <p className="text-destructive text-sm">{errors.birthDate}</p>}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="text-foreground">Ubicación (opcional)</Label>
            
            {!useManualLocation && !country && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="w-full h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl"
              >
                {locationLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                {locationLoading ? "Obteniendo ubicación..." : "Usar mi ubicación"}
              </Button>
            )}

            {(useManualLocation || country) && (
              <div className="space-y-3">
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl">
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad (opcional)"
                  className="h-12 bg-transparent border-2 border-muted-foreground/30 rounded-xl px-4"
                />
              </div>
            )}

            {!useManualLocation && !country && (
              <button
                type="button"
                onClick={() => setUseManualLocation(true)}
                className="text-sm text-primary underline underline-offset-4"
              >
                Ingresar ubicación manualmente
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl border-2 border-muted-foreground/30"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
