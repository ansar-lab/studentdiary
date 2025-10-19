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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          status: string | null
          student_id: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          status?: string | null
          student_id?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          status?: string | null
          student_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          biometric_verified: boolean | null
          location_lat: number | null
          location_long: number | null
          record_id: string
          scan_time: string
          session_id: string | null
          status: string | null
          student_id: string | null
          subject: string
        }
        Insert: {
          biometric_verified?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          record_id?: string
          scan_time?: string
          session_id?: string | null
          status?: string | null
          student_id?: string | null
          subject: string
        }
        Update: {
          biometric_verified?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          record_id?: string
          scan_time?: string
          session_id?: string | null
          status?: string | null
          student_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          is_active: boolean
          session_id: string
          subject: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          is_active?: boolean
          session_id: string
          subject: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          is_active?: boolean
          session_id?: string
          subject?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          course: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["app_role"]
          roll_number: string | null
          updated_at: string | null
        }
        Insert: {
          course?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          profile_picture_url?: string | null
          role: Database["public"]["Enums"]["app_role"]
          roll_number?: string | null
          updated_at?: string | null
        }
        Update: {
          course?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          roll_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      timetable: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          faculty_name: string | null
          id: string
          room: string | null
          start_time: string
          student_id: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          faculty_name?: string | null
          id?: string
          room?: string | null
          start_time: string
          student_id?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          faculty_name?: string | null
          id?: string
          room?: string | null
          start_time?: string
          student_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      app_role: "student" | "faculty"
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
      app_role: ["student", "faculty"],
    },
  },
} as const
