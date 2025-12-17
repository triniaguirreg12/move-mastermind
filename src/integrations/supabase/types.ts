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
      profiles: {
        Row: {
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
        }
        Insert: {
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
        }
        Update: {
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
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
