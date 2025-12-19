import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Professional {
  id: string;
  name: string;
  title: string;
  specialty: string | null;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalAvailability {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  user_id: string;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'missed';
  consultation_goal: string;
  injury_condition: string;
  available_equipment: string[];
  additional_comments: string | null;
  price_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_id: string | null;
  google_meet_link: string | null;
  created_at: string;
  updated_at: string;
  professional?: Professional;
}

export interface AppointmentFormData {
  consultation_goal: string;
  injury_condition: string;
  available_equipment: string[];
  additional_comments?: string;
}

// Fetch all active professionals
export function useProfessionals() {
  return useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Professional[];
    }
  });
}

// Fetch single professional
export function useProfessional(id: string | undefined) {
  return useQuery({
    queryKey: ['professional', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Professional;
    },
    enabled: !!id
  });
}

// Fetch professional availability
export function useProfessionalAvailability(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['professional-availability', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });
      
      if (error) throw error;
      return data as ProfessionalAvailability[];
    },
    enabled: !!professionalId
  });
}

// Fetch booked appointments for a professional on specific dates
export function useBookedSlots(professionalId: string | undefined, dates: string[]) {
  return useQuery({
    queryKey: ['booked-slots', professionalId, dates],
    queryFn: async () => {
      if (!professionalId || dates.length === 0) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, start_time, end_time')
        .eq('professional_id', professionalId)
        .in('appointment_date', dates)
        .in('status', ['pending_payment', 'confirmed']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId && dates.length > 0
  });
}

// Fetch user's appointments
export function useUserAppointments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professional:professionals(*)
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data as (Appointment & { professional: Professional })[];
    },
    enabled: !!user
  });
}

// Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: {
      professional_id: string;
      appointment_date: string;
      start_time: string;
      end_time: string;
      form_data: AppointmentFormData;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          professional_id: data.professional_id,
          appointment_date: data.appointment_date,
          start_time: data.start_time,
          end_time: data.end_time,
          consultation_goal: data.form_data.consultation_goal,
          injury_condition: data.form_data.injury_condition,
          available_equipment: data.form_data.available_equipment,
          additional_comments: data.form_data.additional_comments || null,
          status: 'pending_payment',
          payment_status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
    }
  });
}

// Confirm appointment payment
export function useConfirmAppointmentPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { 
      appointmentId: string; 
      paymentId?: string;
      professionalName: string;
      appointmentDate: string;
      startTime: string;
      endTime: string;
    }) => {
      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_id: data.paymentId || null
        })
        .eq('id', data.appointmentId);
      
      if (updateError) throw updateError;
      
      // Create user_event for calendar display
      if (user) {
        const { error: eventError } = await supabase
          .from('user_events')
          .insert({
            user_id: user.id,
            type: 'profesional',
            status: 'scheduled',
            event_date: data.appointmentDate,
            time_start: data.startTime,
            time_end: data.endTime,
            title: `Cita con ${data.professionalName}`,
            metadata: {
              professional_name: data.professionalName,
              appointment_id: data.appointmentId
            }
          });
        
        if (eventError) console.error('Error creating calendar event:', eventError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    }
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
    }
  });
}

// Admin: Fetch all appointments
export function useAllAppointments() {
  return useQuery({
    queryKey: ['all-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professional:professionals(*)
        `)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
}

// Admin: Fetch all professionals (including inactive)
export function useAllProfessionals() {
  return useQuery({
    queryKey: ['all-professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Professional[];
    }
  });
}

// Admin: Update appointment status
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      appointmentId: string; 
      status: 'completed' | 'missed';
      meetLink?: string;
    }) => {
      // Update appointment status
      const updateData: { status: string; google_meet_link?: string } = { 
        status: data.status 
      };
      if (data.meetLink) {
        updateData.google_meet_link = data.meetLink;
      }
      
      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', data.appointmentId)
        .select('user_id, appointment_date')
        .single();
      
      if (error) throw error;
      
      // Update corresponding user_event
      const newEventStatus = data.status === 'completed' ? 'completed' : 'missed';
      const { error: eventError } = await supabase
        .from('user_events')
        .update({ status: newEventStatus })
        .eq('user_id', appointment.user_id)
        .eq('event_date', appointment.appointment_date)
        .eq('type', 'profesional');
      
      if (eventError) console.error('Error updating calendar event:', eventError);
      
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    }
  });
}

// Admin: Update appointment meet link
export function useUpdateAppointmentMeetLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { appointmentId: string; meetLink: string }) => {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .update({ google_meet_link: data.meetLink })
        .eq('id', data.appointmentId)
        .select('user_id, appointment_date')
        .single();
      
      if (error) throw error;
      
      // Fetch current user_event and merge metadata
      const { data: eventData } = await supabase
        .from('user_events')
        .select('id, metadata')
        .eq('user_id', appointment.user_id)
        .eq('event_date', appointment.appointment_date)
        .eq('type', 'profesional')
        .single();
      
      if (eventData) {
        const currentMetadata = (eventData.metadata as Record<string, unknown>) || {};
        await supabase
          .from('user_events')
          .update({ 
            metadata: { ...currentMetadata, google_meet_link: data.meetLink }
          })
          .eq('id', eventData.id);
      }
      
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    }
  });
}
