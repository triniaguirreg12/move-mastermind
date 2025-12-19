import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  start_week: number;
  current_week: number;
  status: "active" | "completed" | "paused";
  enrolled_at: string;
  updated_at: string;
}

// Check if user is enrolled in a specific program
export function useUserProgramEnrollment(programId: string | undefined) {
  return useQuery({
    queryKey: ["user-program", programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !programId) return null;

      const { data, error } = await supabase
        .from("user_programs")
        .select("*")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProgram | null;
    },
  });
}

// Get user's active program enrollment
export function useActiveUserProgram() {
  return useQuery({
    queryKey: ["user-program", "active"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_programs")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data as UserProgram | null;
    },
  });
}

// Enroll in a program (without scheduling - free mode)
export function useEnrollInProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ programId, startWeek = 1 }: { programId: string; startWeek?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First, check if already enrolled
      const { data: existing } = await supabase
        .from("user_programs")
        .select("id")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .maybeSingle();

      if (existing) {
        // Update existing enrollment
        const { data, error } = await supabase
          .from("user_programs")
          .update({
            start_week: startWeek,
            current_week: startWeek,
            status: "active",
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new enrollment
      const { data, error } = await supabase
        .from("user_programs")
        .insert({
          user_id: user.id,
          program_id: programId,
          start_week: startWeek,
          current_week: startWeek,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-program"] });
      queryClient.invalidateQueries({ queryKey: ["active-program"] });
    },
  });
}

// Schedule program routines to specific dates
export function useScheduleProgramRoutines() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      programId,
      startWeek,
      assignments,
    }: {
      programId: string;
      startWeek: number;
      assignments: { routineId: string; date: Date }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First enroll in the program
      const { data: existing } = await supabase
        .from("user_programs")
        .select("id")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_programs")
          .update({
            start_week: startWeek,
            current_week: startWeek,
            status: "active",
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("user_programs")
          .insert({
            user_id: user.id,
            program_id: programId,
            start_week: startWeek,
            current_week: startWeek,
            status: "active",
          });
      }

      // Create scheduled_routines for each assignment
      if (assignments.length > 0) {
        const scheduledRoutines = assignments.map((a) => ({
          user_id: user.id,
          routine_id: a.routineId,
          scheduled_date: a.date.toISOString().split("T")[0],
          status: "programada",
        }));

        const { error: scheduleError } = await supabase
          .from("scheduled_routines")
          .insert(scheduledRoutines);

        if (scheduleError) throw scheduleError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-program"] });
      queryClient.invalidateQueries({ queryKey: ["active-program"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-routines"] });
      queryClient.invalidateQueries({ queryKey: ["routine-schedules"] });
    },
  });
}

// Complete a program (mark as completed)
export function useCompleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_programs")
        .update({ status: "completed" })
        .eq("user_id", user.id)
        .eq("program_id", programId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-program"] });
      queryClient.invalidateQueries({ queryKey: ["active-program"] });
    },
  });
}

// Unenroll from a program
export function useUnenrollFromProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_programs")
        .delete()
        .eq("user_id", user.id)
        .eq("program_id", programId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-program"] });
      queryClient.invalidateQueries({ queryKey: ["active-program"] });
    },
  });
}
