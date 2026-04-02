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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignment_tasks: {
        Row: {
          assignment_id: string
          created_at: string
          description: string | null
          display_order: number
          estimated_minutes: number | null
          id: string
          status: Database["public"]["Enums"]["task_status"]
          suggested_due_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          estimated_minutes?: number | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          suggested_due_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          estimated_minutes?: number | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          suggested_due_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_tasks_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: Database["public"]["Enums"]["assignment_type"] | null
          course_name: string | null
          created_at: string
          difficulty_estimate: string | null
          due_date: string | null
          effort_estimate: string | null
          id: string
          parsed_requirements: Json | null
          parsed_warnings: Json | null
          priority_level: Database["public"]["Enums"]["priority_level"] | null
          raw_input_text: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_type?:
            | Database["public"]["Enums"]["assignment_type"]
            | null
          course_name?: string | null
          created_at?: string
          difficulty_estimate?: string | null
          due_date?: string | null
          effort_estimate?: string | null
          id?: string
          parsed_requirements?: Json | null
          parsed_warnings?: Json | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          raw_input_text: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_type?:
            | Database["public"]["Enums"]["assignment_type"]
            | null
          course_name?: string | null
          created_at?: string
          difficulty_estimate?: string | null
          due_date?: string | null
          effort_estimate?: string | null
          id?: string
          parsed_requirements?: Json | null
          parsed_warnings?: Json | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          raw_input_text?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          school: string | null
          student_type: Database["public"]["Enums"]["student_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          school?: string | null
          student_type?: Database["public"]["Enums"]["student_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          school?: string | null
          student_type?: Database["public"]["Enums"]["student_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          biggest_struggle: string | null
          break_length: number
          created_at: string
          default_session_length: number
          help_topics: string[] | null
          id: string
          onboarding_completed: boolean
          planning_style: Database["public"]["Enums"]["planning_style"] | null
          theme: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          biggest_struggle?: string | null
          break_length?: number
          created_at?: string
          default_session_length?: number
          help_topics?: string[] | null
          id?: string
          onboarding_completed?: boolean
          planning_style?: Database["public"]["Enums"]["planning_style"] | null
          theme?: string
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          biggest_struggle?: string | null
          break_length?: number
          created_at?: string
          default_session_length?: number
          help_topics?: string[] | null
          id?: string
          onboarding_completed?: boolean
          planning_style?: Database["public"]["Enums"]["planning_style"] | null
          theme?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      assignment_type:
        | "essay"
        | "lab_report"
        | "programming"
        | "reading_response"
        | "presentation"
        | "project"
        | "other"
      planning_style: "simple_checklist" | "daily_schedule" | "detailed_plan"
      priority_level: "low" | "medium" | "high" | "urgent"
      student_type: "high_school" | "college" | "grad" | "other"
      task_status: "not_started" | "in_progress" | "completed"
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
      assignment_type: [
        "essay",
        "lab_report",
        "programming",
        "reading_response",
        "presentation",
        "project",
        "other",
      ],
      planning_style: ["simple_checklist", "daily_schedule", "detailed_plan"],
      priority_level: ["low", "medium", "high", "urgent"],
      student_type: ["high_school", "college", "grad", "other"],
      task_status: ["not_started", "in_progress", "completed"],
    },
  },
} as const
