import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserProgramStatus = "not_started" | "active" | "completed" | "paused";

export interface UserProgramItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  portada_url: string | null;
  duracion_semanas: number | null;
  totalWeeks: number;
  completedWeeks: number;
  isPrivate: boolean; // assigned_user_id matches current user
  status: UserProgramStatus;
  enrollmentId?: string;
  currentWeek: number;
}

/**
 * Fetches ONLY personalized/private programs for the current user:
 * - Programs explicitly assigned to them (routines.assigned_user_id == user.id)
 * 
 * Does NOT include public library programs even if enrolled.
 * Returns programs with status: not_started, active, completed, paused
 */
export function useUserAllPrograms() {
  return useQuery({
    queryKey: ["user-all-programs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // ONLY fetch programs assigned directly to this user (private/personalized)
      const { data: assignedPrograms, error: assignedError } = await supabase
        .from("routines")
        .select("id, nombre, descripcion, portada_url, duracion_semanas, assigned_user_id")
        .eq("tipo", "programa")
        .eq("assigned_user_id", user.id)
        .eq("estado", "publicada");

      if (assignedError) throw assignedError;

      // Fetch user enrollments (for status tracking)
      const { data: enrollments, error: enrollError } = await supabase
        .from("user_programs")
        .select("id, program_id, status, current_week, start_week")
        .eq("user_id", user.id);

      if (enrollError) throw enrollError;

      // Build a map of enrollments by program_id
      const enrollmentMap = new Map<string, typeof enrollments[number]>();
      for (const e of enrollments || []) {
        enrollmentMap.set(e.program_id, e);
      }

      // Only use assigned programs (private/personalized)
      const allPrograms = assignedPrograms || [];

      if (allPrograms.length === 0) return [];

      // 4. Fetch weeks for all programs
      const programIds = allPrograms.map(p => p.id);
      const { data: allWeeks, error: weeksError } = await supabase
        .from("program_weeks")
        .select("id, program_id, week_number")
        .in("program_id", programIds);

      if (weeksError) throw weeksError;

      // 5. Fetch week routines
      const weekIds = (allWeeks || []).map(w => w.id);
      let allWeekRoutines: { week_id: string; routine_id: string }[] = [];
      if (weekIds.length > 0) {
        const { data, error } = await supabase
          .from("program_week_routines")
          .select("week_id, routine_id")
          .in("week_id", weekIds);

        if (error) throw error;
        allWeekRoutines = data || [];
      }

      // 6. Fetch user completed routines
      const { data: completedEvents, error: eventsError } = await supabase
        .from("user_events")
        .select("metadata")
        .eq("user_id", user.id)
        .eq("type", "entrenamiento")
        .eq("status", "completed");

      if (eventsError) throw eventsError;

      const completedRoutineIds = new Set<string>();
      for (const event of completedEvents || []) {
        const routineId = (event.metadata as any)?.routine_id;
        if (routineId) {
          completedRoutineIds.add(routineId);
        }
      }

      // 7. Build program items
      const result: UserProgramItem[] = allPrograms.map(program => {
        const enrollment = enrollmentMap.get(program.id);
        const weeks = (allWeeks || []).filter(w => w.program_id === program.id);
        const weekIdsForProgram = weeks.map(w => w.id);
        
        // Count completed weeks
        let completedWeeks = 0;
        let currentWeek = 1;
        
        for (const week of weeks.sort((a, b) => a.week_number - b.week_number)) {
          const weekRoutineIds = allWeekRoutines
            .filter(wr => wr.week_id === week.id)
            .map(wr => wr.routine_id);
          
          const allRoutinesCompleted = weekRoutineIds.length > 0 && 
            weekRoutineIds.every(rid => completedRoutineIds.has(rid));
          
          if (allRoutinesCompleted) {
            completedWeeks++;
          } else if (currentWeek === 1 || completedWeeks === week.week_number - 1) {
            currentWeek = week.week_number;
          }
        }

        // Determine status
        let status: UserProgramStatus = "not_started";
        if (enrollment) {
          if (enrollment.status === "completed") {
            status = "completed";
          } else if (enrollment.status === "paused") {
            status = "paused";
          } else if (enrollment.status === "active") {
            status = "active";
          }
        } else {
          // Not enrolled - check if any progress
          if (completedWeeks > 0) {
            if (completedWeeks >= weeks.length && weeks.length > 0) {
              status = "completed";
            } else {
              status = "active"; // Started but not enrolled
            }
          }
        }

        const isPrivate = program.assigned_user_id === user.id;

        return {
          id: program.id,
          nombre: program.nombre,
          descripcion: program.descripcion,
          portada_url: program.portada_url,
          duracion_semanas: program.duracion_semanas,
          totalWeeks: weeks.length,
          completedWeeks,
          isPrivate,
          status,
          enrollmentId: enrollment?.id,
          currentWeek: enrollment?.current_week || currentWeek,
        };
      });

      return result;
    },
  });
}
