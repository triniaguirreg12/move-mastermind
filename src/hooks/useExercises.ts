import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Exercise {
  id: string;
  nombre: string;
  tips: string | null;
  dificultad: "Principiante" | "Intermedio" | "Avanzado";
  mecanicas: string[];
  grupo_muscular: string[];
  musculos_principales: string[];
  aptitudes_primarias: string[];
  aptitudes_secundarias: string[];
  implementos: string[];
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all exercises
export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      return data as Exercise[];
    },
  });
}

// Fetch single exercise
export function useExercise(id: string | undefined) {
  return useQuery({
    queryKey: ["exercise", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Exercise | null;
    },
  });
}

// Create exercise
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercise: Omit<Exercise, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("exercises")
        .insert(exercise)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

// Update exercise
export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...exercise }: Partial<Exercise> & { id: string }) => {
      const { data, error } = await supabase
        .from("exercises")
        .update(exercise)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

// Delete exercise
export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
