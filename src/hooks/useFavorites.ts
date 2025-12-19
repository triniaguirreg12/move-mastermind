import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Favorite {
  id: string;
  user_id: string;
  routine_id: string;
  created_at: string;
}

interface FavoriteWithRoutine extends Favorite {
  routine: {
    id: string;
    nombre: string;
    categoria: string;
    dificultad: string;
    portada_url: string | null;
    tipo: string;
    descripcion: string | null;
  };
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_favorites")
        .select(`
          *,
          routine:routines(id, nombre, categoria, dificultad, portada_url, tipo, descripcion)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as FavoriteWithRoutine[];
    },
  });
}

export function useIsFavorite(routineId: string | undefined) {
  return useQuery({
    queryKey: ["favorite", routineId],
    queryFn: async () => {
      if (!routineId) return false;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("routine_id", routineId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!routineId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routineId, isFavorite }: { routineId: string; isFavorite: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("routine_id", routineId);

        if (error) throw error;
        return { added: false };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, routine_id: routineId });

        if (error) throw error;
        return { added: true };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite", variables.routineId] });
      toast.success(result.added ? "Agregado a favoritos" : "Eliminado de favoritos");
    },
    onError: () => {
      toast.error("Error al actualizar favoritos");
    },
  });
}
