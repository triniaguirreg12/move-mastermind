import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Rutina, RutinaBloque, RutinaEjercicio, RutinaObjetivo } from "@/components/admin/routines/types";
import type { Ejercicio } from "@/components/admin/CreateExerciseModal";

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
  tipo: "rutina" | "programa";
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
  duracion_semanas: number | null;
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
    tipo: (dbRoutine.tipo as Routine["tipo"]) || "rutina",
    dificultad: dbRoutine.dificultad as Routine["dificultad"],
    dificultad_mode: dbRoutine.dificultad_mode as Routine["dificultad_mode"],
    objetivo_mode: dbRoutine.objetivo_mode as Routine["objetivo_mode"],
    estado: dbRoutine.estado as Routine["estado"],
    duracion_semanas: (dbRoutine.duracion_semanas as number | null) || null,
  } as Routine;
}

// ============ UNIFIED DURATION CALCULATION ============
// This is THE SINGLE SOURCE OF TRUTH for duration calculation
// Used by both Admin and User views
const SEGUNDOS_POR_REP = 3;

export function calcularDuracionTotal(
  routineBlocks: Array<{
    id: string;
    series: number | null;
    repetir_bloque: boolean | null;
    descanso_entre_ejercicios: number | null;
    descanso_entre_series: number | null;
    usar_mismo_descanso: boolean | null;
  }>,
  blockExercises: Array<{
    block_id: string;
    tiempo: number | null;
    repeticiones: number | null;
    tipo_ejecucion: string;
  }>,
  descansoEntreBloques: number
): number {
  let totalSegundos = 0;

  routineBlocks.forEach((bloque, bloqueIndex) => {
    const series = bloque.repetir_bloque ? (bloque.series || 1) : 1;
    const ejerciciosDelBloque = blockExercises.filter(be => be.block_id === bloque.id);
    
    ejerciciosDelBloque.forEach((ej, ejIndex) => {
      // Time for exercise
      const tiempoEjercicio = ej.tipo_ejecucion === "tiempo" 
        ? (ej.tiempo || 0)
        : (ej.repeticiones || 0) * SEGUNDOS_POR_REP;
      
      // Rest after exercise (except last in block)
      const descansoEj = ejIndex < ejerciciosDelBloque.length - 1 
        ? (bloque.descanso_entre_ejercicios || 30)
        : 0;
      
      totalSegundos += (tiempoEjercicio + descansoEj) * series;
    });

    // Rest between series (for repeated blocks)
    if (bloque.repetir_bloque && series > 1) {
      const descansoSeries = bloque.usar_mismo_descanso 
        ? (bloque.descanso_entre_ejercicios || 30)
        : (bloque.descanso_entre_series || 60);
      totalSegundos += descansoSeries * (series - 1);
    }

    // Rest between blocks (except last)
    if (bloqueIndex < routineBlocks.length - 1) {
      totalSegundos += descansoEntreBloques;
    }
  });

  return totalSegundos;
}

// ============ UNIFIED IMPLEMENTS CALCULATION ============
export function calcularImplementosUnicos(
  blockExercises: Array<{
    exercise?: { implementos: string[] | null } | { implementos: string[] | null }[] | null;
  }>
): string[] {
  const allImplements = new Set<string>();
  blockExercises.forEach(be => {
    // Handle both object and array responses from Supabase join
    const exercise = be.exercise;
    let implementos: string[] | null = null;
    
    if (Array.isArray(exercise)) {
      implementos = exercise[0]?.implementos || null;
    } else if (exercise && typeof exercise === 'object') {
      implementos = (exercise as { implementos: string[] | null }).implementos;
    }
    
    if (implementos && Array.isArray(implementos)) {
      implementos.forEach(imp => allImplements.add(imp));
    }
  });
  
  // Filter out "Sin implemento" if there are real implements, then sort alphabetically
  let implements_arr = Array.from(allImplements).sort();
  if (implements_arr.length > 1 && implements_arr.includes("Sin implemento")) {
    implements_arr = implements_arr.filter(i => i !== "Sin implemento");
  }
  return implements_arr;
}

// ============ ADMIN TYPE TRANSFORMATIONS ============
// Transform DB Exercise to Admin Ejercicio format
function dbExerciseToAdminEjercicio(dbExercise: Exercise): Ejercicio {
  return {
    id: parseInt(dbExercise.id.replace(/\D/g, '').slice(0, 8)) || Math.random() * 1000000,
    nombre: dbExercise.nombre,
    tips: dbExercise.tips || "",
    dificultad: dbExercise.dificultad,
    mecanicas: dbExercise.mecanicas || [],
    grupoMuscular: dbExercise.grupo_muscular || [],
    musculosPrincipales: dbExercise.musculos_principales || [],
    aptitudesPrimarias: dbExercise.aptitudes_primarias || [],
    aptitudesSecundarias: dbExercise.aptitudes_secundarias || [],
    implementos: dbExercise.implementos || [],
    video: dbExercise.video_url,
    thumbnail: dbExercise.thumbnail_url,
  };
}

// Transform full DB routine (with blocks/exercises) to Admin Rutina format
export function dbRoutineToAdminRutina(
  routine: Routine,
  blocks: RoutineBlock[]
): Rutina {
  const bloques: RutinaBloque[] = blocks.map(block => ({
    id: block.id,
    nombre: block.nombre,
    ejercicios: (block.exercises || []).map(be => ({
      id: be.id,
      ejercicio: be.exercise ? dbExerciseToAdminEjercicio(be.exercise) : {
        id: 0,
        nombre: "Unknown",
        tips: "",
        dificultad: "Principiante" as const,
        mecanicas: [],
        grupoMuscular: [],
        musculosPrincipales: [],
        aptitudesPrimarias: [],
        aptitudesSecundarias: [],
        implementos: [],
        video: null,
        thumbnail: null,
      },
      tipoEjecucion: be.tipo_ejecucion as "tiempo" | "repeticiones",
      tiempo: be.tiempo || 0,
      repeticiones: be.repeticiones || 0,
    })),
    repetirBloque: block.repetir_bloque,
    series: block.series,
    descansoEntreEjercicios: block.descanso_entre_ejercicios,
    descansoEntreSeries: block.descanso_entre_series,
    usarMismoDescanso: block.usar_mismo_descanso,
  }));

  return {
    id: parseInt(routine.id.replace(/\D/g, '').slice(0, 8)) || Date.now(),
    nombre: routine.nombre,
    descripcion: routine.descripcion || "",
    categoria: routine.categoria as Rutina["categoria"],
    dificultad: routine.dificultad as Rutina["dificultad"],
    dificultadMode: routine.dificultad_mode as "manual" | "auto",
    objetivoMode: routine.objetivo_mode as "manual" | "auto",
    objetivo: routine.objetivo as RutinaObjetivo,
    bloques,
    estado: routine.estado as "borrador" | "publicada",
    descansoEntreBloques: routine.descanso_entre_bloques,
    portadaType: (routine.portada_type || "") as "ejercicio" | "custom" | "",
    portadaCustomUrl: routine.portada_url || undefined,
    calificacion: routine.calificacion || undefined,
    vecesRealizada: routine.veces_realizada || 0,
    // Store original UUID for DB operations
    _dbId: routine.id,
    tipo: routine.tipo,
    duracionSemanas: routine.duracion_semanas,
  } as Rutina & { _dbId: string; tipo: string; duracionSemanas: number | null };
}

// Fetch all published routines with their blocks and exercises (for Library view)
// Excludes routines/programs assigned to specific users (private)
export function usePublishedRoutines() {
  return useQuery({
    queryKey: ["routines", "published"],
    queryFn: async () => {
      // Fetch published routines that are NOT assigned to a specific user
      const { data: routines, error } = await supabase
        .from("routines")
        .select("*")
        .eq("estado", "publicada")
        .is("assigned_user_id", null) // Only public routines/programs
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!routines || routines.length === 0) return [];

      // Fetch all blocks for these routines
      const routineIds = routines.map(r => r.id);
      const { data: blocks, error: blocksError } = await supabase
        .from("routine_blocks")
        .select("*")
        .in("routine_id", routineIds);
      
      if (blocksError) throw blocksError;

      // Fetch all block exercises with exercise data
      const blockIds = (blocks || []).map(b => b.id);
      let blockExercises: Array<{
        block_id: string;
        exercise: { implementos: string[] | null; } | null;
        tiempo: number | null;
        repeticiones: number | null;
        tipo_ejecucion: string;
      }> = [];
      
      if (blockIds.length > 0) {
        const { data: beData, error: beError } = await supabase
          .from("block_exercises")
          .select(`
            block_id,
            tiempo,
            repeticiones,
            tipo_ejecucion,
            exercise:exercises(implementos)
          `)
          .in("block_id", blockIds);
        
        if (beError) throw beError;
        blockExercises = beData || [];
      }

      // Map routines with calculated implements and duration
      return routines.map(routine => {
        const routineBlocks = (blocks || []).filter(b => b.routine_id === routine.id);
        const routineBlockIds = routineBlocks.map(b => b.id);
        const routineExercisesData = blockExercises.filter(be => routineBlockIds.includes(be.block_id));
        
        // Calculate unique implements from exercises
        const allImplements = new Set<string>();
        routineExercisesData.forEach(be => {
          // Handle both object and array responses from Supabase join
          const exercise = be.exercise;
          let implementos: string[] | null = null;
          
          if (Array.isArray(exercise)) {
            // If exercise is an array, get implementos from first item
            implementos = exercise[0]?.implementos || null;
          } else if (exercise && typeof exercise === 'object') {
            // If exercise is a single object
            implementos = (exercise as { implementos: string[] | null }).implementos;
          }
          
          if (implementos && Array.isArray(implementos)) {
            implementos.forEach(imp => allImplements.add(imp));
          }
        });
        
        // Filter out "Sin implemento" if there are real implements, then sort alphabetically
        let implements_arr = Array.from(allImplements).sort();
        if (implements_arr.length > 1 && implements_arr.includes("Sin implemento")) {
          implements_arr = implements_arr.filter(i => i !== "Sin implemento");
        }
        
        // Calculate total duration using same logic as Admin
        const totalSeconds = calcularDuracionTotal(
          routineBlocks,
          routineExercisesData.map(be => ({
            block_id: be.block_id,
            tiempo: be.tiempo,
            repeticiones: be.repeticiones,
            tipo_ejecucion: be.tipo_ejecucion,
          })),
          routine.descanso_entre_bloques || 60
        );
        const durationMins = Math.round(totalSeconds / 60);

        return {
          ...transformRoutine(routine as unknown as Record<string, unknown>),
          calculatedImplements: implements_arr,
          calculatedDuration: durationMins,
          duracion_semanas: (routine as Record<string, unknown>).duracion_semanas as number | null,
        };
      });
    },
  });
}

// Fetch all routines with full details (for Admin view)
// Optional tipo filter: "rutina" | "programa" | undefined (all)
export function useAllRoutinesWithDetails(tipo?: "rutina" | "programa") {
  return useQuery({
    queryKey: ["routines", "all", "details", tipo || "all"],
    queryFn: async () => {
      // Fetch routines with optional tipo filter
      let query = supabase
        .from("routines")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (tipo) {
        query = query.eq("tipo", tipo);
      }
      
      const { data: routines, error } = await query;

      if (error) throw error;
      if (!routines || routines.length === 0) return [];

      // Fetch all blocks
      const routineIds = routines.map(r => r.id);
      const { data: blocks, error: blocksError } = await supabase
        .from("routine_blocks")
        .select("*")
        .in("routine_id", routineIds)
        .order("orden", { ascending: true });
      
      if (blocksError) throw blocksError;

      // Fetch all block exercises with exercise data
      const blockIds = (blocks || []).map(b => b.id);
      let blockExercises: Array<{
        id: string;
        block_id: string;
        exercise_id: string;
        orden: number;
        tipo_ejecucion: string;
        tiempo: number | null;
        repeticiones: number | null;
        exercise: Exercise | null;
      }> = [];
      
      if (blockIds.length > 0) {
        const { data: beData, error: beError } = await supabase
          .from("block_exercises")
          .select(`
            *,
            exercise:exercises(*)
          `)
          .in("block_id", blockIds)
          .order("orden", { ascending: true });
        
        if (beError) throw beError;
        blockExercises = (beData || []).map(be => ({
          ...be,
          exercise: be.exercise as Exercise | null,
        }));
      }

      // Build routines with blocks and exercises
      return routines.map(routine => {
        const routineBlocks = (blocks || [])
          .filter(b => b.routine_id === routine.id)
          .map(block => ({
            ...block,
            exercises: blockExercises.filter(be => be.block_id === block.id),
          })) as RoutineBlock[];

        const transformedRoutine = transformRoutine(routine as unknown as Record<string, unknown>);
        
        // Calculate duration and implements using unified logic
        const routineBlocksForCalc = routineBlocks.map(b => ({
          id: b.id,
          series: b.series,
          repetir_bloque: b.repetir_bloque,
          descanso_entre_ejercicios: b.descanso_entre_ejercicios,
          descanso_entre_series: b.descanso_entre_series,
          usar_mismo_descanso: b.usar_mismo_descanso,
        }));
        const exercisesForCalc = blockExercises
          .filter(be => routineBlocks.some(b => b.id === be.block_id))
          .map(be => ({
            block_id: be.block_id,
            tiempo: be.tiempo,
            repeticiones: be.repeticiones,
            tipo_ejecucion: be.tipo_ejecucion,
            exercise: be.exercise,
          }));
        
        const totalSeconds = calcularDuracionTotal(
          routineBlocksForCalc,
          exercisesForCalc,
          routine.descanso_entre_bloques || 60
        );
        const implements_arr = calcularImplementosUnicos(exercisesForCalc);

        return {
          ...transformedRoutine,
          blocks: routineBlocks,
          calculatedDuration: Math.round(totalSeconds / 60),
          calculatedImplements: implements_arr,
        };
      });
    },
  });
}

// Fetch all routines (simple, for basic listing)
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
          tipo: routine.tipo || "rutina",
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
      if (routine.tipo !== undefined) updateData.tipo = routine.tipo;
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

// Extended routine type with calculated fields from usePublishedRoutines
export interface RoutineWithCalculated extends Routine {
  calculatedImplements?: string[];
  calculatedDuration?: number;
}

// Helper to transform routine data to library card format
export function routineToLibraryCard(routine: RoutineWithCalculated) {
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

  // Use calculated implements or empty array
  const equipment = routine.calculatedImplements || [];
  
  // Duration depends on type: routines use minutes, programs use weeks
  const isPrograma = routine.tipo === "programa";
  let duration: string;
  let durationValue: number | null;
  
  if (isPrograma) {
    // Programs show weeks
    durationValue = routine.duracion_semanas || null;
    duration = durationValue ? `${durationValue} semanas` : "";
  } else {
    // Routines show minutes
    durationValue = routine.calculatedDuration || null;
    duration = durationValue ? `${durationValue} min` : "";
  }

  return {
    id: routine.id,
    title: routine.nombre,
    subtitle: routine.descripcion || "",
    duration,
    durationValue,
    difficulty: routine.dificultad,
    equipment,
    rating: routine.calificacion || 0,
    tipo: routine.tipo,
    category: routine.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") as "funcional" | "kinesiologia" | "activacion",
    aptitudes,
  };
}
