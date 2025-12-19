import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ProgramWeek {
  id: string;
  program_id: string;
  week_number: number;
  created_at: string;
  routines?: ProgramWeekRoutine[];
}

export interface ProgramWeekRoutine {
  id: string;
  week_id: string;
  routine_id: string;
  orden: number;
  custom_data: Json | null;
  created_at: string;
  routine?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    categoria: string;
    dificultad: string;
    estado: string;
    portada_url: string | null;
    objetivo?: Json;
  };
}

export interface Program {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  dificultad: string;
  estado: string;
  portada_url: string | null;
  duracion_semanas: number | null;
  assigned_user_id: string | null;
  created_at: string;
  weeks?: ProgramWeek[];
}

// Fetch all programs with their weeks and routines
export function usePrograms() {
  return useQuery({
    queryKey: ["programs", "all"],
    queryFn: async () => {
      // Fetch programs (routines with tipo = 'programa')
      const { data: programs, error } = await supabase
        .from("routines")
        .select("*")
        .eq("tipo", "programa")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!programs || programs.length === 0) return [];

      // Fetch weeks for all programs
      const programIds = programs.map(p => p.id);
      const { data: weeks, error: weeksError } = await supabase
        .from("program_weeks")
        .select("*")
        .in("program_id", programIds)
        .order("week_number", { ascending: true });

      if (weeksError) throw weeksError;

      // Fetch week routines with routine details
      const weekIds = (weeks || []).map(w => w.id);
      let weekRoutines: ProgramWeekRoutine[] = [];

      if (weekIds.length > 0) {
        const { data: wrData, error: wrError } = await supabase
          .from("program_week_routines")
          .select(`
            *,
            routine:routines(id, nombre, descripcion, categoria, dificultad, estado, portada_url, objetivo)
          `)
          .in("week_id", weekIds)
          .order("orden", { ascending: true });

        if (wrError) throw wrError;
        weekRoutines = (wrData || []).map(wr => ({
          ...wr,
          routine: wr.routine as ProgramWeekRoutine["routine"],
        }));
      }

      // Build programs with weeks and routines
      return programs.map(program => {
        const programWeeks = (weeks || [])
          .filter(w => w.program_id === program.id)
          .map(week => ({
            ...week,
            routines: weekRoutines.filter(wr => wr.week_id === week.id),
          }));

        return {
          ...program,
          weeks: programWeeks,
        } as Program;
      });
    },
  });
}

// Fetch single program with full details
export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: ["program", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      const { data: program, error } = await supabase
        .from("routines")
        .select("*")
        .eq("id", id)
        .eq("tipo", "programa")
        .maybeSingle();

      if (error) throw error;
      if (!program) return null;

      // Fetch weeks
      const { data: weeks, error: weeksError } = await supabase
        .from("program_weeks")
        .select("*")
        .eq("program_id", id)
        .order("week_number", { ascending: true });

      if (weeksError) throw weeksError;

      // Fetch week routines
      const weekIds = (weeks || []).map(w => w.id);
      let weekRoutines: ProgramWeekRoutine[] = [];

      if (weekIds.length > 0) {
        const { data: wrData, error: wrError } = await supabase
          .from("program_week_routines")
          .select(`
            *,
            routine:routines(id, nombre, descripcion, categoria, dificultad, estado, portada_url, objetivo)
          `)
          .in("week_id", weekIds)
          .order("orden", { ascending: true });

        if (wrError) throw wrError;
        weekRoutines = (wrData || []).map(wr => ({
          ...wr,
          routine: wr.routine as ProgramWeekRoutine["routine"],
        }));
      }

      return {
        ...program,
        weeks: (weeks || []).map(week => ({
          ...week,
          routines: weekRoutines.filter(wr => wr.week_id === week.id),
        })),
      } as Program;
    },
  });
}

// Create program
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nombre: string;
      descripcion?: string;
      categoria: string;
      dificultad: string;
      estado: string;
      portada_url?: string;
      duracion_semanas: number;
      assigned_user_id?: string;
      weeks: Array<{
        week_number: number;
        routines: Array<{
          routine_id: string;
          orden: number;
          custom_data?: Json;
        }>;
      }>;
    }) => {
      // 1. Create the program (routine with tipo='programa')
      const { data: program, error: programError } = await supabase
        .from("routines")
        .insert({
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          categoria: data.categoria,
          dificultad: data.dificultad,
          estado: data.estado,
          portada_url: data.portada_url || null,
          duracion_semanas: data.duracion_semanas,
          assigned_user_id: data.assigned_user_id || null,
          tipo: "programa",
        })
        .select()
        .single();

      if (programError) throw programError;

      // 2. Create weeks
      for (const week of data.weeks) {
        const { data: createdWeek, error: weekError } = await supabase
          .from("program_weeks")
          .insert({
            program_id: program.id,
            week_number: week.week_number,
          })
          .select()
          .single();

        if (weekError) throw weekError;

        // 3. Create week routines
        if (week.routines.length > 0) {
          const { error: routinesError } = await supabase
            .from("program_week_routines")
            .insert(
              week.routines.map(r => ({
                week_id: createdWeek.id,
                routine_id: r.routine_id,
                orden: r.orden,
                custom_data: r.custom_data || null,
              }))
            );

          if (routinesError) throw routinesError;
        }
      }

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

// Update program
export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      nombre: string;
      descripcion?: string;
      categoria: string;
      dificultad: string;
      estado: string;
      portada_url?: string;
      duracion_semanas: number;
      assigned_user_id?: string;
      weeks: Array<{
        id?: string;
        week_number: number;
        routines: Array<{
          id?: string;
          routine_id: string;
          orden: number;
          custom_data?: Json;
        }>;
      }>;
    }) => {
      // 1. Update the program
      const { error: programError } = await supabase
        .from("routines")
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          categoria: data.categoria,
          dificultad: data.dificultad,
          estado: data.estado,
          portada_url: data.portada_url || null,
          duracion_semanas: data.duracion_semanas,
          assigned_user_id: data.assigned_user_id || null,
        })
        .eq("id", data.id);

      if (programError) throw programError;

      // 2. Delete existing weeks and recreate (simpler than upsert logic)
      const { error: deleteError } = await supabase
        .from("program_weeks")
        .delete()
        .eq("program_id", data.id);

      if (deleteError) throw deleteError;

      // 3. Create new weeks
      for (const week of data.weeks) {
        const { data: createdWeek, error: weekError } = await supabase
          .from("program_weeks")
          .insert({
            program_id: data.id,
            week_number: week.week_number,
          })
          .select()
          .single();

        if (weekError) throw weekError;

        // 4. Create week routines
        if (week.routines.length > 0) {
          const { error: routinesError } = await supabase
            .from("program_week_routines")
            .insert(
              week.routines.map(r => ({
                week_id: createdWeek.id,
                routine_id: r.routine_id,
                orden: r.orden,
                custom_data: r.custom_data || null,
              }))
            );

          if (routinesError) throw routinesError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

// Delete program
export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

// Fetch available routines for adding to programs (published only)
export function useAvailableRoutines() {
  return useQuery({
    queryKey: ["routines", "available-for-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("id, nombre, descripcion, categoria, dificultad, estado, portada_url, objetivo")
        .eq("tipo", "rutina")
        .eq("estado", "publicada")
        .order("nombre", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
