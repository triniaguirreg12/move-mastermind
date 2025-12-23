import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Crown, X } from "lucide-react";
import { 
  useSubscription, 
  useCreateSubscription, 
  useCancelSubscription,
  PLANS, 
  getPlanMonthlyPrice,
  getPlanPrice,
  type SubscriptionPlan 
} from "@/hooks/useSubscription";
import { usePaymentGateway, formatPrice } from "@/hooks/usePaymentGateway";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanSheet({ open, onOpenChange }: PlanSheetProps) {
  const { data: subscription, isLoading } = useSubscription();
  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();
  const { gateway, currency, isChile } = usePaymentGateway();
  const { toast } = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const hasActiveSubscription = subscription && 
    (subscription.status === "activa" || subscription.status === "cancelada") &&
    new Date(subscription.end_date) > new Date();

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
    try {
      await createSubscription.mutateAsync({ plan: planId, provider: gateway });
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

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync();
      toast({
        title: "Suscripción cancelada",
        description: "Mantendrás acceso hasta la fecha de término.",
      });
      setConfirmCancel(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la suscripción.",
        variant: "destructive",
      });
    }
  };

  const currentPlan = subscription ? PLANS.find(p => p.id === subscription.plan) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-background">
          <SheetHeader className="text-center pb-4">
            <SheetTitle className="text-xl font-bold">Plan actual</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] pb-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Current Status Card */}
            <div className="bg-card rounded-2xl p-6 text-center border border-border/50">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                {hasActiveSubscription ? (
                  <Crown className="w-8 h-8 text-primary" />
                ) : (
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              {hasActiveSubscription && currentPlan ? (
                <>
                  <h3 className="text-lg font-semibold mb-1">
                    Plan {currentPlan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {subscription.status === "cancelada" 
                      ? "Cancelado - acceso hasta:"
                      : "Activo hasta:"}
                  </p>
                  <p className="text-primary font-medium">
                    {format(new Date(subscription.end_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">No tienes un plan activo</h3>
                  <p className="text-sm text-muted-foreground">
                    Elige un plan para desbloquear todas las funcionalidades de Just MUV.
                  </p>
                </>
              )}
            </div>

            {/* Payment method indicator */}
            <div className="text-center text-sm text-muted-foreground">
              Pago con {isChile ? "Mercado Pago" : "PayPal"} • Precios en {currency}
            </div>

            {/* Plans Section */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {hasActiveSubscription ? "Cambiar plan" : "Planes disponibles"}
              </h4>
              
              <div className="space-y-3">
                {PLANS.map((plan) => {
                  const isCurrentPlan = subscription?.plan === plan.id && hasActiveSubscription;
                  const monthlyPrice = getPlanMonthlyPrice(plan, currency);
                  const totalPrice = getPlanPrice(plan, currency);
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border-2 p-4 transition-all ${
                        isCurrentPlan
                          ? "border-primary bg-primary/5"
                          : plan.recommended
                          ? "border-primary/50 bg-card"
                          : "border-border bg-card"
                      }`}
                    >
                      {plan.recommended && !isCurrentPlan && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                          Recomendado
                        </span>
                      )}
                      
                      {isCurrentPlan && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                          Tu plan actual
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h5 className="font-semibold text-foreground">
                            Plan {plan.name}
                          </h5>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(monthlyPrice, currency)}/mes
                          </p>
                          {plan.duration > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(totalPrice, currency)} total
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">
                        {plan.description.split("**").map((part, i) => 
                          i % 2 === 1 ? (
                            <span key={i} className="font-semibold text-foreground">{part}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </p>

                      {!isCurrentPlan && (
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
                              Suscribirme
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cancel option */}
            {hasActiveSubscription && subscription?.status === "activa" && (
              <div className="pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmCancel(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar suscripción
                </Button>
              </div>
            )}

            {/* Footer note */}
            <p className="text-xs text-center text-muted-foreground pt-2">
              Los planes se pueden cancelar en cualquier momento.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              Mantendrás acceso hasta el {subscription?.end_date 
                ? format(new Date(subscription.end_date), "d 'de' MMMM, yyyy", { locale: es })
                : ""
              }. Después de esa fecha perderás acceso al contenido premium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mantener plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
