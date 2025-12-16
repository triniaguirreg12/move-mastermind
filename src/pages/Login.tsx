import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SignUpModal } from "@/components/auth/SignUpModal";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  const brandText = "No Todo es Pádel";

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Typing animation
  useEffect(() => {
    let currentIndex = 0;
    const typingDelay = 80;
    
    const typeNextChar = () => {
      if (currentIndex < brandText.length) {
        setDisplayedText(brandText.slice(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextChar, typingDelay);
      } else {
        setIsTypingComplete(true);
      }
    };

    const startDelay = setTimeout(() => {
      typeNextChar();
    }, 500);

    return () => clearTimeout(startDelay);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa tu correo y contraseña.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error de autenticación",
        description: "Usuario o contraseña incorrectos.",
        variant: "destructive",
      });
      return;
    }

    // Navigation handled by useEffect
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e);
    }
  };

  const handleSignUpSuccess = () => {
    setShowSignUp(false);
    // User is automatically signed in after registration
    navigate("/", { replace: true });
  };

  const isFormValid = email.trim() && password;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo & Brand Text */}
      <div className="mb-12 flex flex-col items-center">
        <Logo size="lg" className="h-32 md:h-44 lg:h-52 mb-6" />
        <div className="h-10 md:h-12 flex items-center justify-center min-w-[280px] md:min-w-[360px]">
          <span className="font-brand text-2xl md:text-3xl lg:text-4xl text-primary whitespace-nowrap">
            {displayedText}
            <span 
              className={`ml-0.5 inline-block w-[2px] h-[1em] bg-primary align-middle transition-opacity duration-100 ${isTypingComplete ? 'opacity-0' : 'animate-pulse'}`}
            />
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Correo electrónico
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="tu@email.com"
            className="h-14 bg-transparent border-2 border-muted-foreground/30 rounded-full px-6 text-foreground placeholder:text-muted-foreground focus:border-primary"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-medium">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••••••••"
            className="h-14 bg-transparent border-2 border-muted-foreground/30 rounded-full px-6 text-foreground placeholder:text-muted-foreground focus:border-primary"
            disabled={isLoading}
          />
        </div>

        <div className="pt-4 space-y-3">
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full h-14 rounded-full bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Confirmar e ingresar"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSignUp(true)}
            disabled={isLoading}
            className="w-full h-14 rounded-full border-2 border-muted-foreground/30 text-foreground hover:bg-muted transition-all font-medium"
          >
            Crear nueva cuenta
          </Button>
        </div>

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>

      <SignUpModal 
        open={showSignUp} 
        onOpenChange={setShowSignUp}
        onSuccess={handleSignUpSuccess}
      />

      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

export default Login;
