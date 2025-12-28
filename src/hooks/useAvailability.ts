import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AvailabilitySettings {
  id: string;
  professional_id: string;
  timezone: string;
  meeting_duration_minutes: number;
  buffer_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyRange {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  slot_duration_minutes: number;
}

export interface AvailabilityException {
  id: string;
  professional_id: string;
  exception_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string | null;
  created_at: string;
}

export const useAvailabilitySettings = (professionalId: string | undefined) => {
  return useQuery({
    queryKey: ["availability-settings", professionalId],
    queryFn: async () => {
      if (!professionalId) return null;
      
      const { data, error } = await supabase
        .from("availability_settings")
        .select("*")
        .eq("professional_id", professionalId)
        .maybeSingle();

      if (error) throw error;
      return data as AvailabilitySettings | null;
    },
    enabled: !!professionalId,
  });
};

export const useWeeklyAvailability = (professionalId: string | undefined) => {
  return useQuery({
    queryKey: ["weekly-availability", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", professionalId)
        .order("day_of_week");

      if (error) throw error;
      return data as WeeklyRange[];
    },
    enabled: !!professionalId,
  });
};

export const useAvailabilityExceptions = (professionalId: string | undefined) => {
  return useQuery({
    queryKey: ["availability-exceptions", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from("availability_exceptions")
        .select("*")
        .eq("professional_id", professionalId)
        .order("exception_date");

      if (error) throw error;
      return data as AvailabilityException[];
    },
    enabled: !!professionalId,
  });
};

export const useSaveAvailabilitySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      professionalId,
      meetingDuration,
      buffer,
    }: {
      professionalId: string;
      meetingDuration: number;
      buffer: number;
    }) => {
      const { data: existing } = await supabase
        .from("availability_settings")
        .select("id")
        .eq("professional_id", professionalId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("availability_settings")
          .update({
            meeting_duration_minutes: meetingDuration,
            buffer_minutes: buffer,
          })
          .eq("professional_id", professionalId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("availability_settings")
          .insert({
            professional_id: professionalId,
            meeting_duration_minutes: meetingDuration,
            buffer_minutes: buffer,
            timezone: "America/Santiago",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-settings"] });
      toast.success("Configuración guardada");
    },
    onError: () => {
      toast.error("Error al guardar la configuración");
    },
  });
};

export const useSaveWeeklyAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      professionalId,
      ranges,
    }: {
      professionalId: string;
      ranges: Array<{
        day_of_week: number;
        start_time: string;
        end_time: string;
        is_active: boolean;
      }>;
    }) => {
      // Delete existing ranges
      await supabase
        .from("professional_availability")
        .delete()
        .eq("professional_id", professionalId);

      // Insert new ranges
      if (ranges.length > 0) {
        const { error } = await supabase
          .from("professional_availability")
          .insert(
            ranges.map((r) => ({
              professional_id: professionalId,
              day_of_week: r.day_of_week,
              start_time: r.start_time,
              end_time: r.end_time,
              is_active: r.is_active,
              slot_duration_minutes: 60,
            }))
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-availability"] });
    },
  });
};

export const useAddException = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      professionalId,
      date,
      startTime,
      endTime,
      allDay,
      reason,
    }: {
      professionalId: string;
      date: string;
      startTime?: string;
      endTime?: string;
      allDay: boolean;
      reason?: string;
    }) => {
      const { error } = await supabase.from("availability_exceptions").insert({
        professional_id: professionalId,
        exception_date: date,
        start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
        all_day: allDay,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-exceptions"] });
      toast.success("Bloqueo agregado");
    },
    onError: () => {
      toast.error("Error al agregar bloqueo");
    },
  });
};

export const useDeleteException = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exceptionId: string) => {
      const { error } = await supabase
        .from("availability_exceptions")
        .delete()
        .eq("id", exceptionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-exceptions"] });
      toast.success("Bloqueo eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar bloqueo");
    },
  });
};
