import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "globo" | "volea" | "bandeja" | "smash";
export type SubscriptionStatus = "activa" | "cancelada" | "vencida" | "pago_fallido";
export type SubscriptionProvider = "paypal" | "mercado_pago";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  provider: SubscriptionProvider;
  created_at: string;
  updated_at: string;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  duration: number; // months
  priceCLP: number; // CLP price for Mercado Pago
  priceUSD: number; // USD price for PayPal
  description: string;
  recommended?: boolean;
  mercadoPagoPlanId: string;
  paypalPlanId: string;
}

// Precios deben coincidir con los de la edge function mercadopago-create-subscription
export const PLANS: PlanInfo[] = [
  {
    id: "globo",
    name: "Globo",
    duration: 1,
    priceCLP: 9990,
    priceUSD: 10.99,
    description: "El inicio de todo gran punto. Prueba **1 mes** y empieza a elevar tu juego.",
    mercadoPagoPlanId: "", // No se usa - precios inline en edge function
    paypalPlanId: "P-0DL48557TX0626019NFFIRZY",
  },
  {
    id: "volea",
    name: "Volea",
    duration: 3,
    priceCLP: 26990,
    priceUSD: 28.99,
    description: "Constancia y control. **3 meses** para tomar ritmo y sentir cambios reales en tu rendimiento.",
    recommended: true,
    mercadoPagoPlanId: "",
    paypalPlanId: "P-3TV44115M64157340NFFIS7A",
  },
  {
    id: "bandeja",
    name: "Bandeja",
    duration: 6,
    priceCLP: 47990,
    priceUSD: 51.99,
    description: "El golpe que ordena el juego. **6 meses** para consolidar tu nivel y entrenar con foco.",
    mercadoPagoPlanId: "",
    paypalPlanId: "P-3K237677GD934415TNFFITVY",
  },
  {
    id: "smash",
    name: "Smash",
    duration: 12,
    priceCLP: 79990,
    priceUSD: 85.99,
    description: "El golpe definitivo. **1 año** entrenando para rendir al máximo dentro y fuera de la cancha.",
    mercadoPagoPlanId: "",
    paypalPlanId: "P-3WJ85705M23567813NFFIUKQ",
  },
];

export function getPlanDuration(plan: SubscriptionPlan): number {
  const planInfo = PLANS.find(p => p.id === plan);
  return planInfo?.duration ?? 1;
}

export function getPlanIds(plan: SubscriptionPlan): { mercadoPagoPlanId: string; paypalPlanId: string } {
  const planInfo = PLANS.find(p => p.id === plan);
  return {
    mercadoPagoPlanId: planInfo?.mercadoPagoPlanId ?? "",
    paypalPlanId: planInfo?.paypalPlanId ?? "",
  };
}

export function getPlanPrice(plan: PlanInfo, currency: "CLP" | "USD"): number {
  return currency === "CLP" ? plan.priceCLP : plan.priceUSD;
}

export function getPlanMonthlyPrice(plan: PlanInfo, currency: "CLP" | "USD"): number {
  const price = getPlanPrice(plan, currency);
  return currency === "CLP" 
    ? Math.round(price / plan.duration)
    : Math.round((price / plan.duration) * 100) / 100;
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
  });
}

/**
 * Determines if user has active subscription access
 * Rules:
 * - isActive: status = 'activa' AND end_date >= today
 * - hasAccess: (status = 'activa' OR status = 'cancelada') AND end_date >= today
 * - Users with 'cancelada' keep access until end_date
 * - Users with 'pago_fallido' or 'vencida' have NO access
 */
export function useHasActiveSubscription() {
  const { data: subscription, isLoading } = useSubscription();
  
  const now = new Date();
  const endDate = subscription ? new Date(subscription.end_date) : null;
  const isNotExpired = endDate ? endDate >= now : false;
  
  // User has active subscription (auto-renew enabled, actively paying)
  const isActive = subscription && 
    subscription.status === "activa" && 
    isNotExpired;
  
  // User has access to premium content
  // Active users OR cancelled users (until their end_date)
  const hasAccess = subscription && 
    (subscription.status === "activa" || subscription.status === "cancelada") &&
    isNotExpired;

  // User's payment failed - blocked from premium
  const isPastDue = subscription?.status === "pago_fallido";
  
  // Subscription has expired
  const isExpired = subscription?.status === "vencida" || 
    (subscription && !isNotExpired);

  return {
    subscription,
    isActive: !!isActive,
    hasAccess: !!hasAccess,
    isPastDue,
    isExpired,
    isLoading,
    autoRenew: subscription?.auto_renew ?? false,
    provider: subscription?.provider,
  };
}

/**
 * Initiate payment flow - calls edge function and redirects to payment gateway
 * Does NOT create subscription in DB - that happens via webhook after successful payment
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: async ({ 
      plan, 
      provider = "mercado_pago" 
    }: { 
      plan: SubscriptionPlan; 
      provider?: SubscriptionProvider;
    }): Promise<{ init_point: string }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const planInfo = PLANS.find(p => p.id === plan);
      if (!planInfo) throw new Error("Invalid plan");

      if (provider === "mercado_pago") {
        const { data, error } = await supabase.functions.invoke("mercadopago-create-subscription", {
          body: {
            user_id: user.id,
            user_email: user.email,
            plan: plan,
          },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || "Failed to create payment");
        
        return { init_point: data.init_point };
      } else {
        // PayPal flow
        const { data, error } = await supabase.functions.invoke("paypal-create-subscription", {
          body: {
            user_id: user.id,
            user_email: user.email,
            plan_id: planInfo.paypalPlanId,
            plan: plan,
          },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || "Failed to create payment");
        
        return { init_point: data.approval_url };
      }
    },
  });
}

/**
 * Create subscription directly in DB - used by webhooks after successful payment
 * NOT for direct UI usage - use useInitiatePayment instead
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      plan, 
      provider = "mercado_pago" 
    }: { 
      plan: SubscriptionPlan; 
      provider?: SubscriptionProvider;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const planInfo = PLANS.find(p => p.id === plan);
      if (!planInfo) throw new Error("Invalid plan");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + planInfo.duration);

      // Check if user already has a subscription
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing subscription
        const { data, error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status: "activa",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            auto_renew: true,
            provider,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan,
          status: "activa",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: true,
          provider,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

/**
 * Cancel subscription - sets auto_renew to false
 * User keeps access until end_date
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Use the database function for consistent behavior
      const { data, error } = await supabase.rpc('cancel_subscription', {
        _user_id: user.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

/**
 * Reactivate subscription - sets auto_renew back to true
 * Only works if subscription is still active
 */
export function useReactivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("subscriptions")
        .update({ auto_renew: true })
        .eq("user_id", user.id)
        .eq("status", "activa")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

/**
 * Handle successful renewal from payment gateway
 * Extends end_date by plan duration
 */
export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc('renew_subscription', {
        _user_id: user.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

/**
 * Mark subscription as past_due when payment fails
 */
export function useMarkPastDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc('mark_subscription_past_due', {
        _user_id: user.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  const statusMap: Record<SubscriptionStatus, string> = {
    activa: "Activa",
    cancelada: "Cancelada (acceso hasta fin de período)",
    vencida: "Vencida",
    pago_fallido: "Pago fallido",
  };
  return statusMap[status] || status;
}
