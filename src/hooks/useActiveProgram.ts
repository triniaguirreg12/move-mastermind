import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ActiveProgramRoutine {
  id: string;
  routine_id: string;
  orden: number;
  custom_data: Json | null;
  routine: {
    id: string;
    nombre: string;
    descripcion: string | null;
    categoria: string;
    dificultad: string;
    portada_url: string | null;
  } | null;
  // Computed: has the user completed this routine?
  isCompleted: boolean;
}

export interface ActiveProgramWeek {
  id: string;
  week_number: number;
  routines: ActiveProgramRoutine[];
  // Computed
  isCompleted: boolean;
  completedCount: number;
}

export interface ActiveProgram {
  id: string;
  nombre: string;
  descripcion: string | null;
  portada_url: string | null;
  duracion_semanas: number;
  weeks: ActiveProgramWeek[];
  // Computed
  currentWeek: number;
  totalWeeks: number;
  completedWeeks: number;
}

/**
 * Fetches the active assigned program for the current user.
 * Determines current week based on completed routines.
 */
export function useActiveProgram() {
  return useQuery({
    queryKey: ["active-program"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Find program assigned to this user
      const { data: program, error: programError } = await supabase
        .from("routines")
        .select("id, nombre, descripcion, portada_url, duracion_semanas")
        .eq("tipo", "programa")
        .eq("assigned_user_id", user.id)
        .eq("estado", "publicada")
        .maybeSingle();

      if (programError) throw programError;
      if (!program) return null;

      // Fetch weeks for this program
      const { data: weeks, error: weeksError } = await supabase
        .from("program_weeks")
        .select("id, week_number")
        .eq("program_id", program.id)
        .order("week_number", { ascending: true });

      if (weeksError) throw weeksError;
      if (!weeks || weeks.length === 0) return null;

      // Fetch week routines with routine details
      const weekIds = weeks.map(w => w.id);
      const { data: weekRoutines, error: wrError } = await supabase
        .from("program_week_routines")
        .select(`
          id,
          week_id,
          routine_id,
          orden,
          custom_data,
          routine:routines(id, nombre, descripcion, categoria, dificultad, portada_url)
        `)
        .in("week_id", weekIds)
        .order("orden", { ascending: true });

      if (wrError) throw wrError;

      // Fetch user's completed routine events to determine progress
      const { data: completedEvents, error: eventsError } = await supabase
        .from("user_events")
        .select("metadata")
        .eq("user_id", user.id)
        .eq("type", "entrenamiento")
        .eq("status", "completed");

      if (eventsError) throw eventsError;

      // Build a set of completed routine IDs
      const completedRoutineIds = new Set<string>();
      for (const event of completedEvents || []) {
        const routineId = (event.metadata as any)?.routine_id;
        if (routineId) {
          completedRoutineIds.add(routineId);
        }
      }

      // Build weeks with completion status
      const builtWeeks: ActiveProgramWeek[] = weeks.map(week => {
        const routines = (weekRoutines || [])
          .filter(wr => wr.week_id === week.id)
          .map(wr => ({
            id: wr.id,
            routine_id: wr.routine_id,
            orden: wr.orden,
            custom_data: wr.custom_data,
            routine: wr.routine as ActiveProgramRoutine["routine"],
            isCompleted: completedRoutineIds.has(wr.routine_id),
          }));

        const completedCount = routines.filter(r => r.isCompleted).length;

        return {
          id: week.id,
          week_number: week.week_number,
          routines,
          completedCount,
          isCompleted: routines.length > 0 && completedCount === routines.length,
        };
      });

      // Determine current week: first incomplete week, or last week if all complete
      let currentWeek = 1;
      for (const week of builtWeeks) {
        if (!week.isCompleted) {
          currentWeek = week.week_number;
          break;
        }
        currentWeek = week.week_number;
      }

      const completedWeeks = builtWeeks.filter(w => w.isCompleted).length;

      return {
        id: program.id,
        nombre: program.nombre,
        descripcion: program.descripcion,
        portada_url: program.portada_url,
        duracion_semanas: program.duracion_semanas || weeks.length,
        weeks: builtWeeks,
        currentWeek,
        totalWeeks: weeks.length,
        completedWeeks,
      } as ActiveProgram;
    },
  });
}
