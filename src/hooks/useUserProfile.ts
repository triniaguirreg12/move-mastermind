import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserAptitudes {
  fuerza: number;
  potencia: number;
  agilidad: number;
  coordinacion: number;
  estabilidad: number;
  velocidad: number;
  resistencia: number;
  movilidad: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  sex: string;
  birth_date: string;
  country: string | null;
  city: string | null;
  weekly_training_goal: number;
  aptitudes: UserAptitudes | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        aptitudes: data.aptitudes as unknown as UserAptitudes | null,
      } as UserProfile;
    },
  });
}

export function useUpdateWeeklyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("profiles")
        .update({ weekly_training_goal: goal })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
