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
          consultation_goal: string
          created_at: string
          end_time: string
          google_meet_link: string | null
          id: string
          injury_condition: string
          payment_id: string | null
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
          consultation_goal: string
          created_at?: string
          end_time: string
          google_meet_link?: string | null
          id?: string
          injury_condition: string
          payment_id?: string | null
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
          consultation_goal?: string
          created_at?: string
          end_time?: string
          google_meet_link?: string | null
          id?: string
          injury_condition?: string
          payment_id?: string | null
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
          created_at: string
          end_date: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
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
      [_ in never]: never
    }
    Enums: {
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
      subscription_plan: ["globo", "volea", "bandeja", "smash"],
      subscription_status: ["activa", "cancelada", "vencida", "pago_fallido"],
    },
  },
} as const
