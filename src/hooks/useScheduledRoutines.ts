import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ScheduledRoutine {
  id: string;
  user_id: string;
  routine_id: string;
  scheduled_date: string;
  status: "programada" | "completada" | "cancelada";
  created_at: string;
  updated_at: string;
  routine?: {
    id: string;
    nombre: string;
    portada_url: string | null;
    categoria: string;
    dificultad: string;
  };
}

// Fetch all scheduled routines for the current user
export function useScheduledRoutines() {
  return useQuery({
    queryKey: ["scheduled-routines"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("scheduled_routines")
        .select(`
          *,
          routine:routines(id, nombre, portada_url, categoria, dificultad)
        `)
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data as ScheduledRoutine[];
    },
  });
}

// Fetch scheduled routines for a specific routine
export function useRoutineSchedules(routineId: string | undefined) {
  return useQuery({
    queryKey: ["routine-schedules", routineId],
    queryFn: async () => {
      if (!routineId) return { past: [], future: [] };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { past: [], future: [] };

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("scheduled_routines")
        .select("*")
        .eq("user_id", user.id)
        .eq("routine_id", routineId)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      const past = (data || [])
        .filter((s) => s.scheduled_date < today || s.status === "completada")
        .slice(0, 2);

      const future = (data || [])
        .filter((s) => s.scheduled_date >= today && s.status === "programada");

      return { past, future };
    },
    enabled: !!routineId,
  });
}

// Schedule a routine
export function useScheduleRoutine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      routineId,
      date,
    }: {
      routineId: string;
      date: Date;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("scheduled_routines")
        .insert({
          user_id: user.id,
          routine_id: routineId,
          scheduled_date: date.toISOString().split("T")[0],
          status: "programada",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-routines"] });
      queryClient.invalidateQueries({ queryKey: ["routine-schedules"] });
      toast({
        title: "Rutina agendada",
        description: "La rutina se ha programado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo agendar la rutina.",
        variant: "destructive",
      });
      console.error("Error scheduling routine:", error);
    },
  });
}

// Cancel a scheduled routine
export function useCancelScheduledRoutine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from("scheduled_routines")
        .update({ status: "cancelada" })
        .eq("id", scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-routines"] });
      queryClient.invalidateQueries({ queryKey: ["routine-schedules"] });
      toast({
        title: "Programación cancelada",
        description: "La programación ha sido cancelada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cancelar la programación.",
        variant: "destructive",
      });
      console.error("Error canceling scheduled routine:", error);
    },
  });
}
