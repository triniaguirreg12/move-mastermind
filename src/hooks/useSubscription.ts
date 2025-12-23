import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "globo" | "volea" | "bandeja" | "smash";
export type SubscriptionStatus = "activa" | "cancelada" | "vencida" | "pago_fallido";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  duration: number; // months
  price: number; // CLP
  description: string;
  recommended?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: "globo",
    name: "Globo",
    duration: 1,
    price: 9990,
    description: "Acceso a rutinas y seguimiento básico.",
  },
  {
    id: "volea",
    name: "Volea",
    duration: 3,
    price: 24990,
    description: "Todo lo básico + programas personalizados.",
    recommended: true,
  },
  {
    id: "bandeja",
    name: "Bandeja",
    duration: 6,
    price: 44990,
    description: "Todo Volea + acceso a profesionales.",
  },
  {
    id: "smash",
    name: "Smash",
    duration: 12,
    price: 79990,
    description: "Acceso ilimitado a todo + sesiones 1:1.",
  },
];

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

export function useHasActiveSubscription() {
  const { data: subscription, isLoading } = useSubscription();
  
  const isActive = subscription && 
    subscription.status === "activa" && 
    new Date(subscription.end_date) > new Date();
  
  const hasAccess = subscription && 
    (subscription.status === "activa" || subscription.status === "cancelada") &&
    new Date(subscription.end_date) > new Date();

  return {
    subscription,
    isActive: !!isActive,
    hasAccess: !!hasAccess,
    isLoading,
  };
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
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
        .select("id")
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

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelada" })
        .eq("user_id", user.id)
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

export function formatPlanPrice(price: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function getPlanMonthlyPrice(plan: PlanInfo): number {
  return Math.round(plan.price / plan.duration);
}
