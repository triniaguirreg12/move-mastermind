import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="relative">
          <h1 className="font-display text-8xl font-bold text-accent/20">404</h1>
          <p className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold text-foreground">
            Página no encontrada
          </p>
        </div>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Button 
          variant="accent" 
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
