import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic
    console.log("Login:", { email, password });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-16">
        <Logo size="lg" showIcon={true} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Usuario
          </Label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Isabel Rencoret"
            className="h-14 bg-transparent border-2 border-muted-foreground/30 rounded-full px-6 text-foreground placeholder:text-muted-foreground focus:border-primary"
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
            placeholder="••••••••••••••"
            className="h-14 bg-transparent border-2 border-muted-foreground/30 rounded-full px-6 text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="pt-4 space-y-3">
          <Button
            type="submit"
            className="w-full h-14 rounded-full bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all font-medium"
          >
            Confirmar e ingresar
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-14 rounded-full border-2 border-muted-foreground/30 text-foreground hover:bg-muted transition-all font-medium"
          >
            Crear nueva cuenta
          </Button>
        </div>

        <div className="text-center pt-4">
          <Link
            to="/forgot-password"
            className="text-sm text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
