import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
export type EventType = "entrenamiento" | "padel" | "profesional";
export type EventStatus = "scheduled" | "completed";
export type PadelSubtype = "partido" | "clase" | "torneo";

export interface UserEvent {
  id: string;
  user_id: string;
  type: EventType;
  status: EventStatus;
  event_date: string;
  time_start: string | null;
  time_end: string | null;
  title: string | null;
  metadata: {
    routine_id?: string;
    routine_name?: string;
    routine_category?: string;
    padel_subtype?: PadelSubtype;
    professional_id?: string;
    professional_name?: string;
  };
  created_at: string;
  updated_at: string;
}

// Fetch all events for the current user
export function useUserEvents() {
  return useQuery({
    queryKey: ["user-events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as UserEvent[];
    },
  });
}

// Fetch events for a specific date range
export function useUserEventsRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["user-events", startDate, endDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!startDate && !!endDate,
  });
}

// Create a new event (entrenamiento scheduled)
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: {
      type: EventType;
      status: EventStatus;
      event_date: string;
      time_start?: string;
      time_end?: string;
      title?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const insertData = {
        user_id: user.id,
        type: event.type,
        status: event.status,
        event_date: event.event_date,
        time_start: event.time_start || null,
        time_end: event.time_end || null,
        title: event.title || null,
        metadata: event.metadata || {},
      };

      const { data, error } = await supabase
        .from("user_events")
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-routines"] });
      
      const messages: Record<EventType, string> = {
        entrenamiento: "Entrenamiento agendado",
        padel: "Pádel agendado",
        profesional: "Cita agendada",
      };
      
      toast({
        title: messages[variables.type],
        description: "El evento se ha registrado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el evento.",
        variant: "destructive",
      });
      console.error("Error creating event:", error);
    },
  });
}

// Schedule an entrenamiento (routine)
export function useScheduleRoutineEvent() {
  const createEvent = useCreateEvent();

  return useMutation({
    mutationFn: async ({
      routineId,
      routineName,
      routineCategory,
      date,
    }: {
      routineId: string;
      routineName: string;
      routineCategory?: string;
      date: Date;
    }) => {
      return createEvent.mutateAsync({
        type: "entrenamiento",
        status: "scheduled",
        event_date: date.toISOString().split("T")[0],
        title: routineName,
        metadata: {
          routine_id: routineId,
          routine_name: routineName,
          routine_category: routineCategory,
        },
      });
    },
  });
}

// Complete an entrenamiento (when user finishes a routine)
export function useCompleteRoutine() {
  const createEvent = useCreateEvent();

  return useMutation({
    mutationFn: async ({
      routineId,
      routineName,
      routineCategory,
    }: {
      routineId: string;
      routineName: string;
      routineCategory?: string;
    }) => {
      const today = new Date().toISOString().split("T")[0];
      return createEvent.mutateAsync({
        type: "entrenamiento",
        status: "completed",
        event_date: today,
        title: routineName,
        metadata: {
          routine_id: routineId,
          routine_name: routineName,
          routine_category: routineCategory,
        },
      });
    },
  });
}

// Fetch routine-specific schedules (for ScheduleRoutineModal)
export function useRoutineEventSchedules(routineId: string | undefined) {
  const { data: events = [] } = useUserEvents();

  const filteredSchedules = useMemo(() => {
    if (!routineId) return { past: [], future: [] };

    const today = new Date().toISOString().split("T")[0];

    const routineEvents = events.filter(
      (e) => e.type === "entrenamiento" && e.metadata?.routine_id === routineId
    );

    const past = routineEvents
      .filter((e) => e.event_date < today || e.status === "completed")
      .slice(0, 2);

    const future = routineEvents.filter(
      (e) => e.event_date >= today && e.status === "scheduled"
    );

    return { past, future };
  }, [events, routineId]);

  return { data: filteredSchedules, isLoading: false };
}

// Schedule a padel event
export function useSchedulePadel() {
  const createEvent = useCreateEvent();

  return useMutation({
    mutationFn: async ({
      date,
      timeStart,
      timeEnd,
      subtype,
    }: {
      date: Date;
      timeStart?: string;
      timeEnd?: string;
      subtype: PadelSubtype;
    }) => {
      const dateStr = date.toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      const isPast = dateStr < today;

      const subtypeLabels: Record<PadelSubtype, string> = {
        partido: "Partido de Pádel",
        clase: "Clase de Pádel",
        torneo: "Torneo de Pádel",
      };

      return createEvent.mutateAsync({
        type: "padel",
        status: isPast ? "completed" : "scheduled",
        event_date: dateStr,
        time_start: timeStart,
        time_end: timeEnd,
        title: subtypeLabels[subtype],
        metadata: {
          padel_subtype: subtype,
        },
      });
    },
  });
}

// Update event status
export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      status,
    }: {
      eventId: string;
      status: EventStatus;
    }) => {
      const { error } = await supabase
        .from("user_events")
        .update({ status })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      toast({
        title: "Evento actualizado",
        description: "El estado del evento se ha actualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento.",
        variant: "destructive",
      });
      console.error("Error updating event:", error);
    },
  });
}

// Delete an event
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      toast({
        title: "Evento eliminado",
        description: "El evento se ha eliminado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento.",
        variant: "destructive",
      });
      console.error("Error deleting event:", error);
    },
  });
}

// Clean up missed scheduled entrenamientos (should be called periodically)
export function useCleanupMissedEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      // Delete scheduled entrenamientos from past dates
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "entrenamiento")
        .eq("status", "scheduled")
        .lt("event_date", today);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
    },
  });
}

// Get events grouped by date for calendar display
export function getEventsByDate(events: UserEvent[]): Record<string, UserEvent[]> {
  return events.reduce((acc, event) => {
    const dateKey = event.event_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, UserEvent[]>);
}

// Get activity dots (unique types) for a date
export function getActivityDotsForDate(events: UserEvent[], date: string): EventType[] {
  const dateEvents = events.filter(e => e.event_date === date);
  return [...new Set(dateEvents.map(e => e.type))].slice(0, 3);
}

// Get dot color for event type
export function getDotColorClass(type: EventType): string {
  switch (type) {
    case "entrenamiento":
      return "bg-activity-training"; // Verde
    case "padel":
      return "bg-activity-padel"; // Amarillo
    case "profesional":
      return "bg-activity-custom"; // Morado/Rosa
    default:
      return "bg-muted-foreground";
  }
}

// Calculate weekly stats (completed events only for entrenamiento and padel)
// For entrenamiento, only counts Funcional and Kinesiología categories
export function calculateWeeklyStats(events: UserEvent[]) {
  // Only count completed entrenamientos that are Funcional or Kinesiología
  const validCategories = ["Funcional", "Kinesiología"];
  
  const completedEntrenamientos = events.filter(
    e => e.type === "entrenamiento" && 
         e.status === "completed" &&
         (e.metadata?.routine_category ? validCategories.includes(e.metadata.routine_category) : true)
  ).length;

  const completedPadel = events.filter(
    e => e.type === "padel" && e.status === "completed"
  ).length;

  const scheduledPadel = events.filter(
    e => e.type === "padel" && e.status === "scheduled"
  ).length;

  const profesionalEvents = events.filter(
    e => e.type === "profesional"
  ).length;

  return {
    entrenamiento: completedEntrenamientos,
    padelCompleted: completedPadel,
    padelScheduled: scheduledPadel,
    padelTotal: completedPadel + scheduledPadel,
    profesional: profesionalEvents,
  };
}
