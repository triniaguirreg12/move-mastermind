import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface RoutineObjective {
  fuerza: number;
  potencia: number;
  agilidad: number;
  coordinacion: number;
  velocidad: number;
  estabilidad: number;
  movilidad: number;
  resistencia: number;
}

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
}

export interface BlockExercise {
  id: string;
  exercise_id: string;
  orden: number;
  tipo_ejecucion: "tiempo" | "repeticiones";
  tiempo: number;
  repeticiones: number;
  exercise?: Exercise;
}

export interface RoutineBlock {
  id: string;
  routine_id: string;
  nombre: string;
  orden: number;
  repetir_bloque: boolean;
  series: number;
  descanso_entre_ejercicios: number;
  descanso_entre_series: number;
  usar_mismo_descanso: boolean;
  exercises?: BlockExercise[];
}

export interface Routine {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: "Funcional" | "Kinesiología" | "Activación";
  dificultad: "Principiante" | "Intermedio" | "Avanzado";
  dificultad_mode: "auto" | "manual";
  objetivo_mode: "auto" | "manual";
  objetivo: RoutineObjective;
  estado: "borrador" | "publicada";
  descanso_entre_bloques: number;
  portada_type: string;
  portada_url: string | null;
  calificacion: number | null;
  veces_realizada: number;
  created_at: string;
  updated_at: string;
  blocks?: RoutineBlock[];
}

// Helper to transform DB routine to our type
function transformRoutine(dbRoutine: Record<string, unknown>): Routine {
  return {
    ...dbRoutine,
    objetivo: dbRoutine.objetivo as RoutineObjective,
    categoria: dbRoutine.categoria as Routine["categoria"],
    dificultad: dbRoutine.dificultad as Routine["dificultad"],
    dificultad_mode: dbRoutine.dificultad_mode as Routine["dificultad_mode"],
    objetivo_mode: dbRoutine.objetivo_mode as Routine["objetivo_mode"],
    estado: dbRoutine.estado as Routine["estado"],
  } as Routine;
}

// Fetch all published routines (for Library view)
export function usePublishedRoutines() {
  return useQuery({
    queryKey: ["routines", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("estado", "publicada")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(r => transformRoutine(r as unknown as Record<string, unknown>));
    },
  });
}

// Fetch all routines (for Admin view)
export function useAllRoutines() {
  return useQuery({
    queryKey: ["routines", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(r => transformRoutine(r as unknown as Record<string, unknown>));
    },
  });
}

// Fetch single routine with blocks and exercises
export function useRoutine(id: string | undefined) {
  return useQuery({
    queryKey: ["routine", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      // Fetch routine
      const { data: routine, error: routineError } = await supabase
        .from("routines")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (routineError) throw routineError;
      if (!routine) return null;

      // Fetch blocks
      const { data: blocks, error: blocksError } = await supabase
        .from("routine_blocks")
        .select("*")
        .eq("routine_id", id)
        .order("orden", { ascending: true });

      if (blocksError) throw blocksError;

      // Fetch exercises for each block
      const blocksWithExercises = await Promise.all(
        (blocks || []).map(async (block) => {
          const { data: blockExercises, error: beError } = await supabase
            .from("block_exercises")
            .select(`
              *,
              exercise:exercises(*)
            `)
            .eq("block_id", block.id)
            .order("orden", { ascending: true });

          if (beError) throw beError;

          return {
            ...block,
            exercises: blockExercises || [],
          };
        })
      );

      return {
        ...transformRoutine(routine as unknown as Record<string, unknown>),
        blocks: blocksWithExercises as RoutineBlock[],
      };
    },
  });
}

// Create routine
export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routine: Omit<Routine, "id" | "created_at" | "updated_at" | "blocks">) => {
      const { data, error } = await supabase
        .from("routines")
        .insert({
          nombre: routine.nombre,
          descripcion: routine.descripcion,
          categoria: routine.categoria,
          dificultad: routine.dificultad,
          dificultad_mode: routine.dificultad_mode,
          objetivo_mode: routine.objetivo_mode,
          objetivo: routine.objetivo as unknown as Json,
          estado: routine.estado,
          descanso_entre_bloques: routine.descanso_entre_bloques,
          portada_type: routine.portada_type,
          portada_url: routine.portada_url,
          calificacion: routine.calificacion,
          veces_realizada: routine.veces_realizada,
        })
        .select()
        .single();

      if (error) throw error;
      return transformRoutine(data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

// Update routine
export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, blocks, ...routine }: Partial<Routine> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (routine.nombre !== undefined) updateData.nombre = routine.nombre;
      if (routine.descripcion !== undefined) updateData.descripcion = routine.descripcion;
      if (routine.categoria !== undefined) updateData.categoria = routine.categoria;
      if (routine.dificultad !== undefined) updateData.dificultad = routine.dificultad;
      if (routine.dificultad_mode !== undefined) updateData.dificultad_mode = routine.dificultad_mode;
      if (routine.objetivo_mode !== undefined) updateData.objetivo_mode = routine.objetivo_mode;
      if (routine.objetivo !== undefined) updateData.objetivo = routine.objetivo as unknown as Json;
      if (routine.estado !== undefined) updateData.estado = routine.estado;
      if (routine.descanso_entre_bloques !== undefined) updateData.descanso_entre_bloques = routine.descanso_entre_bloques;
      if (routine.portada_type !== undefined) updateData.portada_type = routine.portada_type;
      if (routine.portada_url !== undefined) updateData.portada_url = routine.portada_url;
      if (routine.calificacion !== undefined) updateData.calificacion = routine.calificacion;
      if (routine.veces_realizada !== undefined) updateData.veces_realizada = routine.veces_realizada;

      const { data, error } = await supabase
        .from("routines")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return transformRoutine(data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

// Delete routine
export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

// Helper to transform routine data to library card format
export function routineToLibraryCard(routine: Routine) {
  const objetivo = routine.objetivo;
  
  // Get top aptitudes
  const aptitudes = Object.entries(objetivo)
    .filter(([_, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

  return {
    id: routine.id,
    title: routine.nombre,
    subtitle: routine.descripcion || "",
    duration: "-- min",
    difficulty: routine.dificultad,
    equipment: [] as string[],
    rating: routine.calificacion || 0,
    category: routine.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") as "funcional" | "kinesiologia" | "activacion",
    aptitudes,
  };
}
