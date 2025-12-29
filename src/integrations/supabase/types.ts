export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          additional_comments: string | null
          appointment_date: string
          available_equipment: string[] | null
          calendar_event_id: string | null
          consultation_goal: string
          created_at: string
          currency: string
          end_time: string
          google_meet_link: string | null
          id: string
          injury_condition: string
          payment_id: string | null
          payment_provider: string | null
          payment_status: string
          price_amount: number
          professional_id: string
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_comments?: string | null
          appointment_date: string
          available_equipment?: string[] | null
          calendar_event_id?: string | null
          consultation_goal: string
          created_at?: string
          currency?: string
          end_time: string
          google_meet_link?: string | null
          id?: string
          injury_condition: string
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string
          price_amount?: number
          professional_id: string
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_comments?: string | null
          appointment_date?: string
          available_equipment?: string[] | null
          calendar_event_id?: string | null
          consultation_goal?: string
          created_at?: string
          currency?: string
          end_time?: string
          google_meet_link?: string | null
          id?: string
          injury_condition?: string
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string
          price_amount?: number
          professional_id?: string
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_exceptions: {
        Row: {
          all_day: boolean
          created_at: string
          end_time: string | null
          exception_date: string
          id: string
          professional_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          end_time?: string | null
          exception_date: string
          id?: string
          professional_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          all_day?: boolean
          created_at?: string
          end_time?: string | null
          exception_date?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_settings: {
        Row: {
          buffer_minutes: number
          created_at: string
          id: string
          meeting_duration_minutes: number
          professional_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          buffer_minutes?: number
          created_at?: string
          id?: string
          meeting_duration_minutes?: number
          professional_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          buffer_minutes?: number
          created_at?: string
          id?: string
          meeting_duration_minutes?: number
          professional_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      block_exercises: {
        Row: {
          block_id: string
          created_at: string
          exercise_id: string
          id: string
          orden: number
          repeticiones: number | null
          tiempo: number | null
          tipo_ejecucion: string
        }
        Insert: {
          block_id: string
          created_at?: string
          exercise_id: string
          id?: string
          orden?: number
          repeticiones?: number | null
          tiempo?: number | null
          tipo_ejecucion?: string
        }
        Update: {
          block_id?: string
          created_at?: string
          exercise_id?: string
          id?: string
          orden?: number
          repeticiones?: number | null
          tiempo?: number | null
          tipo_ejecucion?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_exercises_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "routine_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_type: Database["public"]["Enums"]["email_audience_type"]
          body: string
          body_format: Database["public"]["Enums"]["email_body_format"]
          created_at: string
          created_by_admin_id: string
          cta_text: string | null
          cta_url: string | null
          filters_json: Json | null
          finished_at: string | null
          id: string
          is_test: boolean
          name: string | null
          preheader: string | null
          scheduled_at: string | null
          selected_user_ids_json: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["email_campaign_status"]
          subject: string
          total_recipients: number
        }
        Insert: {
          audience_type: Database["public"]["Enums"]["email_audience_type"]
          body: string
          body_format?: Database["public"]["Enums"]["email_body_format"]
          created_at?: string
          created_by_admin_id: string
          cta_text?: string | null
          cta_url?: string | null
          filters_json?: Json | null
          finished_at?: string | null
          id?: string
          is_test?: boolean
          name?: string | null
          preheader?: string | null
          scheduled_at?: string | null
          selected_user_ids_json?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["email_campaign_status"]
          subject: string
          total_recipients?: number
        }
        Update: {
          audience_type?: Database["public"]["Enums"]["email_audience_type"]
          body?: string
          body_format?: Database["public"]["Enums"]["email_body_format"]
          created_at?: string
          created_by_admin_id?: string
          cta_text?: string | null
          cta_url?: string | null
          filters_json?: Json | null
          finished_at?: string | null
          id?: string
          is_test?: boolean
          name?: string | null
          preheader?: string | null
          scheduled_at?: string | null
          selected_user_ids_json?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["email_campaign_status"]
          subject?: string
          total_recipients?: number
        }
        Relationships: []
      }
      email_messages: {
        Row: {
          campaign_id: string
          email_to: string
          error_message: string | null
          id: string
          provider_message_id: string | null
          provider_name: string | null
          queued_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_message_status"]
          user_id: string
        }
        Insert: {
          campaign_id: string
          email_to: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          provider_name?: string | null
          queued_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_message_status"]
          user_id: string
        }
        Update: {
          campaign_id?: string
          email_to?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          provider_name?: string | null
          queued_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_message_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          aptitudes_primarias: string[] | null
          aptitudes_secundarias: string[] | null
          created_at: string
          dificultad: string
          grupo_muscular: string[] | null
          id: string
          implementos: string[] | null
          mecanicas: string[] | null
          musculos_principales: string[] | null
          nombre: string
          thumbnail_url: string | null
          tips: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          aptitudes_primarias?: string[] | null
          aptitudes_secundarias?: string[] | null
          created_at?: string
          dificultad: string
          grupo_muscular?: string[] | null
          id?: string
          implementos?: string[] | null
          mecanicas?: string[] | null
          musculos_principales?: string[] | null
          nombre: string
          thumbnail_url?: string | null
          tips?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          aptitudes_primarias?: string[] | null
          aptitudes_secundarias?: string[] | null
          created_at?: string
          dificultad?: string
          grupo_muscular?: string[] | null
          id?: string
          implementos?: string[] | null
          mecanicas?: string[] | null
          musculos_principales?: string[] | null
          nombre?: string
          thumbnail_url?: string | null
          tips?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      professional_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          professional_id: string
          slot_duration_minutes: number
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          professional_id: string
          slot_duration_minutes?: number
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          professional_id?: string
          slot_duration_minutes?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          specialty: string | null
          title: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          specialty?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          specialty?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aptitudes: Json | null
          birth_date: string
          city: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          sex: string
          updated_at: string
          user_id: string
          weekly_training_goal: number
        }
        Insert: {
          aptitudes?: Json | null
          birth_date: string
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          sex: string
          updated_at?: string
          user_id: string
          weekly_training_goal?: number
        }
        Update: {
          aptitudes?: Json | null
          birth_date?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          sex?: string
          updated_at?: string
          user_id?: string
          weekly_training_goal?: number
        }
        Relationships: []
      }
      program_week_routines: {
        Row: {
          created_at: string
          custom_data: Json | null
          id: string
          orden: number
          routine_id: string
          week_id: string
        }
        Insert: {
          created_at?: string
          custom_data?: Json | null
          id?: string
          orden?: number
          routine_id: string
          week_id: string
        }
        Update: {
          created_at?: string
          custom_data?: Json | null
          id?: string
          orden?: number
          routine_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_week_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_week_routines_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      program_weeks: {
        Row: {
          created_at: string
          id: string
          program_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          week_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_blocks: {
        Row: {
          created_at: string
          descanso_entre_ejercicios: number | null
          descanso_entre_series: number | null
          id: string
          nombre: string
          orden: number
          repetir_bloque: boolean | null
          routine_id: string
          series: number | null
          usar_mismo_descanso: boolean | null
        }
        Insert: {
          created_at?: string
          descanso_entre_ejercicios?: number | null
          descanso_entre_series?: number | null
          id?: string
          nombre: string
          orden?: number
          repetir_bloque?: boolean | null
          routine_id: string
          series?: number | null
          usar_mismo_descanso?: boolean | null
        }
        Update: {
          created_at?: string
          descanso_entre_ejercicios?: number | null
          descanso_entre_series?: number | null
          id?: string
          nombre?: string
          orden?: number
          repetir_bloque?: boolean | null
          routine_id?: string
          series?: number | null
          usar_mismo_descanso?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_blocks_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          assigned_user_id: string | null
          calificacion: number | null
          categoria: string
          created_at: string
          descanso_entre_bloques: number | null
          descripcion: string | null
          dificultad: string
          dificultad_mode: string | null
          duracion_semanas: number | null
          estado: string
          id: string
          nombre: string
          objetivo: Json | null
          objetivo_mode: string | null
          portada_type: string | null
          portada_url: string | null
          tipo: string
          updated_at: string
          veces_realizada: number | null
        }
        Insert: {
          assigned_user_id?: string | null
          calificacion?: number | null
          categoria: string
          created_at?: string
          descanso_entre_bloques?: number | null
          descripcion?: string | null
          dificultad: string
          dificultad_mode?: string | null
          duracion_semanas?: number | null
          estado?: string
          id?: string
          nombre: string
          objetivo?: Json | null
          objetivo_mode?: string | null
          portada_type?: string | null
          portada_url?: string | null
          tipo?: string
          updated_at?: string
          veces_realizada?: number | null
        }
        Update: {
          assigned_user_id?: string | null
          calificacion?: number | null
          categoria?: string
          created_at?: string
          descanso_entre_bloques?: number | null
          descripcion?: string | null
          dificultad?: string
          dificultad_mode?: string | null
          duracion_semanas?: number | null
          estado?: string
          id?: string
          nombre?: string
          objetivo?: Json | null
          objetivo_mode?: string | null
          portada_type?: string | null
          portada_url?: string | null
          tipo?: string
          updated_at?: string
          veces_realizada?: number | null
        }
        Relationships: []
      }
      scheduled_routines: {
        Row: {
          created_at: string
          id: string
          routine_id: string
          scheduled_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          routine_id: string
          scheduled_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          routine_id?: string
          scheduled_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date: string
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          created_at: string
          id: string
          opt_out: boolean
          opt_out_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opt_out?: boolean
          opt_out_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opt_out?: boolean
          opt_out_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_date: string
          id: string
          metadata: Json | null
          status: string
          time_end: string | null
          time_start: string | null
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          metadata?: Json | null
          status?: string
          time_end?: string | null
          time_start?: string | null
          title?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          metadata?: Json | null
          status?: string
          time_end?: string | null
          time_start?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          routine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          routine_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          routine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      user_programs: {
        Row: {
          current_week: number
          enrolled_at: string
          id: string
          program_id: string
          start_week: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_week?: number
          enrolled_at?: string
          id?: string
          program_id: string
          start_week?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_week?: number
          enrolled_at?: string
          id?: string
          program_id?: string
          start_week?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_subscription: {
        Args: { _user_id: string }
        Returns: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_old_subscriptions: { Args: never; Returns: undefined }
      has_valid_subscription: { Args: { _user_id: string }; Returns: boolean }
      mark_subscription_past_due: {
        Args: { _user_id: string }
        Returns: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      renew_subscription: {
        Args: { _user_id: string }
        Returns: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      email_audience_type: "single" | "selected" | "filtered"
      email_body_format: "markdown" | "html"
      email_campaign_status: "draft" | "queued" | "sending" | "sent" | "failed"
      email_message_status: "queued" | "sent" | "failed" | "skipped_opt_out"
      subscription_plan: "globo" | "volea" | "bandeja" | "smash"
      subscription_status: "activa" | "cancelada" | "vencida" | "pago_fallido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      email_audience_type: ["single", "selected", "filtered"],
      email_body_format: ["markdown", "html"],
      email_campaign_status: ["draft", "queued", "sending", "sent", "failed"],
      email_message_status: ["queued", "sent", "failed", "skipped_opt_out"],
      subscription_plan: ["globo", "volea", "bandeja", "smash"],
      subscription_status: ["activa", "cancelada", "vencida", "pago_fallido"],
    },
  },
} as const
