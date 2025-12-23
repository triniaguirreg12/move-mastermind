import { useHasActiveSubscription, PLANS, formatPlanPrice, getPlanMonthlyPrice, type SubscriptionPlan } from "@/hooks/useSubscription";
import { useCreateSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { hasAccess, isLoading } = useHasActiveSubscription();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return fallback || <SubscriptionBlockingScreen requiresAuth />;
  }

  if (!hasAccess) {
    return fallback || <SubscriptionBlockingScreen />;
  }

  return <>{children}</>;
}

interface SubscriptionBlockingScreenProps {
  requiresAuth?: boolean;
  title?: string;
  description?: string;
}

export function SubscriptionBlockingScreen({ 
  requiresAuth = false,
  title,
  description 
}: SubscriptionBlockingScreenProps) {
  const navigate = useNavigate();
  const createSubscription = useCreateSubscription();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    if (requiresAuth) {
      navigate("/login");
      return;
    }

    setSelectedPlan(planId);
    try {
      await createSubscription.mutateAsync({ plan: planId });
      toast({
        title: "¡Suscripción activada!",
        description: "Ya tienes acceso completo a Just MUV.",
      });
      setSelectedPlan(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la suscripción. Intenta de nuevo.",
        variant: "destructive",
      });
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 pt-12 pb-6 px-6 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center border border-primary/20">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {title || (requiresAuth ? "Inicia sesión para continuar" : "Contenido Premium")}
        </h1>
        <p className="text-muted-foreground">
          {description || (requiresAuth 
            ? "Necesitas una cuenta para acceder a este contenido."
            : "Suscríbete para desbloquear todas las funcionalidades de Just MUV."
          )}
        </p>
      </div>

      {/* Plans */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {requiresAuth ? (
          <div className="space-y-4 mt-8">
            <Button 
              className="w-full h-14 text-base"
              onClick={() => navigate("/login")}
            >
              Iniciar sesión
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 text-base"
              onClick={() => navigate("/login?mode=signup")}
            >
              Crear cuenta
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Elige tu plan
            </h2>
            
            <div className="space-y-3">
              {PLANS.map((plan) => {
                const monthlyPrice = getPlanMonthlyPrice(plan);
                
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border-2 p-4 transition-all ${
                      plan.recommended
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Recomendado
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Crown className={`w-4 h-4 ${plan.recommended ? "text-primary" : "text-muted-foreground"}`} />
                          <h3 className="font-semibold">Plan {plan.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.duration} {plan.duration === 1 ? "mes" : "meses"}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">
                          {formatPlanPrice(monthlyPrice)}/mes
                        </p>
                        {plan.duration > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {formatPlanPrice(plan.price)} total
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4"
                      variant={plan.recommended ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={createSubscription.isPending}
                    >
                      {selectedPlan === plan.id ? (
                        "Procesando..."
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Seleccionar
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Los planes se pueden cancelar en cualquier momento.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
