import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, differenceInWeeks, addDays } from "date-fns";

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

// Valid categories for aptitude calculation (Activación does NOT count)
const VALID_CATEGORIES = ["Funcional", "Kinesiología"];

// Baseline value so radar is never completely empty
const BASELINE = 0.15;

interface CompletedRoutineWithObjective {
  id: string;
  routine_id: string;
  objetivo: AptitudeScores | null;
}

/**
 * Fetches completed routines (Funcional/Kinesiología only) within a date range
 */
async function fetchCompletedRoutines(
  startDate: string,
  endDate: string
): Promise<CompletedRoutineWithObjective[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get completed entrenamiento events from user_events
  const { data: events, error: eventsError } = await supabase
    .from("user_events")
    .select("id, metadata")
    .eq("user_id", user.id)
    .eq("type", "entrenamiento")
    .eq("status", "completed")
    .gte("event_date", startDate)
    .lte("event_date", endDate);

  if (eventsError) throw eventsError;
  if (!events || events.length === 0) return [];

  // Extract unique routine IDs from events
  const routineIds = [...new Set(
    events
      .map((e: any) => e.metadata?.routine_id)
      .filter(Boolean)
  )];

  if (routineIds.length === 0) return [];

  // Fetch routine objectives for valid categories only
  const { data: routines, error: routinesError } = await supabase
    .from("routines")
    .select("id, objetivo, categoria")
    .in("id", routineIds)
    .in("categoria", VALID_CATEGORIES);

  if (routinesError) throw routinesError;

  // Map each completed event to its routine's objective
  const routineMap = new Map(
    (routines || []).map((r: any) => [r.id, r.objetivo])
  );

  // Return one entry per completed event (not per unique routine)
  return events
    .filter((e: any) => routineMap.has(e.metadata?.routine_id))
    .map((e: any) => ({
      id: e.id,
      routine_id: e.metadata?.routine_id,
      objetivo: routineMap.get(e.metadata?.routine_id) as AptitudeScores | null,
    }));
}

/**
 * Calculate raw aptitude scores from completed routines
 * Each routine's aptitude is normalized: score / 10
 */
function calculateRawScores(routines: CompletedRoutineWithObjective[]): AptitudeScores {
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

  routines.forEach((routine) => {
    if (routine.objetivo) {
      APTITUDES_KEYS.forEach((key) => {
        const score = routine.objetivo?.[key] || 0;
        // Normalize to 0-1 range (score is 1-10)
        rawScores[key] += score / 10;
      });
    }
  });

  return rawScores;
}

/**
 * Apply normalization, cap, baseline and sqrt curve to raw scores
 * Formula: v_display = sqrt(baseline + (1 - baseline) * min(1, raw / goal))
 */
function applyDisplayTransform(rawScores: AptitudeScores, goal: number): AptitudeScores {
  const G = Math.max(1, goal);
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
    // Step 1: Normalize by goal and cap at 1
    const normalized = Math.min(1, rawScores[key] / G);
    // Step 2: Apply baseline so radar is never empty
    const withBaseline = BASELINE + (1 - BASELINE) * normalized;
    // Step 3: Apply sqrt for aesthetic curve
    displayScores[key] = Math.sqrt(withBaseline);
  });

  return displayScores;
}

/**
 * Calculate number of weeks in a month (for monthly goal calculation)
 */
function getWeeksInMonth(date: Date): number {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  // Add 1 because differenceInWeeks returns complete weeks
  return Math.max(1, differenceInWeeks(addDays(monthEnd, 1), monthStart) + 1);
}

export function useAptitudesRadar(weeklyGoal: number = 4) {
  const today = new Date();
  
  // Week boundaries
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");
  
  // Month boundaries
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthStartStr = format(monthStart, "yyyy-MM-dd");
  const monthEndStr = format(monthEnd, "yyyy-MM-dd");

  // Fetch weekly completed routines
  const { 
    data: weeklyRoutines = [], 
    isLoading: isLoadingWeekly, 
    refetch: refetchWeekly 
  } = useQuery({
    queryKey: ["aptitudes-weekly", weekStartStr],
    queryFn: () => fetchCompletedRoutines(weekStartStr, weekEndStr),
  });

  // Fetch monthly completed routines
  const { 
    data: monthlyRoutines = [], 
    isLoading: isLoadingMonthly, 
    refetch: refetchMonthly 
  } = useQuery({
    queryKey: ["aptitudes-monthly", monthStartStr],
    queryFn: () => fetchCompletedRoutines(monthStartStr, monthEndStr),
  });

  // Calculate weekly display scores
  const weeklyAptitudes = useMemo(() => {
    const rawScores = calculateRawScores(weeklyRoutines);
    return applyDisplayTransform(rawScores, weeklyGoal);
  }, [weeklyRoutines, weeklyGoal]);

  // Calculate monthly display scores
  const monthlyAptitudes = useMemo(() => {
    const rawScores = calculateRawScores(monthlyRoutines);
    const weeksInMonth = getWeeksInMonth(today);
    const monthlyGoal = weeklyGoal * weeksInMonth;
    return applyDisplayTransform(rawScores, monthlyGoal);
  }, [monthlyRoutines, weeklyGoal]);

  // Refetch both views
  const refetch = () => {
    refetchWeekly();
    refetchMonthly();
  };

  return {
    weeklyAptitudes,
    monthlyAptitudes,
    weeklyCompletedCount: weeklyRoutines.length,
    monthlyCompletedCount: monthlyRoutines.length,
    isLoading: isLoadingWeekly || isLoadingMonthly,
    refetch,
  };
}
