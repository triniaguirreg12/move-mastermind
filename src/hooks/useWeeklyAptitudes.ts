import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, format } from "date-fns";

export interface AptitudeScores {
  fuerza: number;
  potencia: number;
  agilidad: number;
  coordinacion: number;
  estabilidad: number;
  velocidad: number;
  resistencia: number;
  movilidad: number;
}

const APTITUDES_KEYS: (keyof AptitudeScores)[] = [
  "fuerza", "potencia", "agilidad", "coordinacion", 
  "estabilidad", "velocidad", "resistencia", "movilidad"
];

// Valid categories for aptitude calculation
const VALID_CATEGORIES = ["Funcional", "Kinesiología"];

interface CompletedRoutineWithObjective {
  id: string;
  routine_id: string;
  objetivo: AptitudeScores | null;
}

export function useWeeklyAptitudes(weeklyGoal: number = 4) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Fetch completed routines for current week with their objectives
  const { data: completedRoutines = [], isLoading, refetch } = useQuery({
    queryKey: ["weekly-completed-routines", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startStr = format(weekStart, "yyyy-MM-dd");
      const endStr = format(weekEnd, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("scheduled_routines")
        .select(`
          id,
          routine_id,
          scheduled_date,
          routines!inner(objetivo, categoria)
        `)
        .eq("user_id", user.id)
        .eq("status", "completada")
        .gte("scheduled_date", startStr)
        .lte("scheduled_date", endStr);

      if (error) throw error;

      // Filter by valid categories and extract objetivo
      return (data || [])
        .filter((item: any) => VALID_CATEGORIES.includes(item.routines?.categoria))
        .map((item: any) => ({
          id: item.id,
          routine_id: item.routine_id,
          objetivo: item.routines?.objetivo as AptitudeScores | null,
        })) as CompletedRoutineWithObjective[];
    },
  });

  // Calculate weekly aptitude scores
  const weeklyAptitudes = useMemo(() => {
    const G = Math.max(1, weeklyGoal); // Ensure minimum of 1

    // Step 1 & 2: Sum normalized scores for each aptitude
    const rawScores: AptitudeScores = {
      fuerza: 0,
      potencia: 0,
      agilidad: 0,
      coordinacion: 0,
      estabilidad: 0,
      velocidad: 0,
      resistencia: 0,
      movilidad: 0,
    };

    completedRoutines.forEach((routine) => {
      if (routine.objetivo) {
        APTITUDES_KEYS.forEach((key) => {
          const score = routine.objetivo?.[key] || 0;
          // Normalize to 0-1 range (score is 1-10)
          rawScores[key] += score / 10;
        });
      }
    });

    // Step 3 & 4: Normalize by goal, cap at 1, and apply sqrt for visual curve
    const displayScores: AptitudeScores = {
      fuerza: 0,
      potencia: 0,
      agilidad: 0,
      coordinacion: 0,
      estabilidad: 0,
      velocidad: 0,
      resistencia: 0,
      movilidad: 0,
    };

    APTITUDES_KEYS.forEach((key) => {
      const normalized = Math.min(1, rawScores[key] / G);
      displayScores[key] = Math.sqrt(normalized);
    });

    return displayScores;
  }, [completedRoutines, weeklyGoal]);

  return {
    weeklyAptitudes,
    completedCount: completedRoutines.length,
    isLoading,
    refetch,
  };
}
