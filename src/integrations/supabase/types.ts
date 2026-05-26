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
      configurator_selections: {
        Row: {
          created_at: string
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          id: string
          package_id: string
          questionnaire_id: string | null
          selections: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          id?: string
          package_id: string
          questionnaire_id?: string | null
          selections?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          id?: string
          package_id?: string
          questionnaire_id?: string | null
          selections?: Json
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          method: string | null
          name: string | null
          package_id: string | null
          phone: string | null
          proof_url: string | null
          reference: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          method?: string | null
          name?: string | null
          package_id?: string | null
          phone?: string | null
          proof_url?: string | null
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          method?: string | null
          name?: string | null
          package_id?: string | null
          phone?: string | null
          proof_url?: string | null
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          packages_unlocked: boolean
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          packages_unlocked?: boolean
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          packages_unlocked?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      project_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          project_id: string | null
          sort_order: number | null
          type: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          sort_order?: number | null
          type?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          sort_order?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          location: string | null
          published: boolean
          title_ar: string | null
          title_en: string
          year: number | null
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          location?: string | null
          published?: boolean
          title_ar?: string | null
          title_en: string
          year?: number | null
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          location?: string | null
          published?: boolean
          title_ar?: string | null
          title_en?: string
          year?: number | null
        }
        Relationships: []
      }
      questionnaires: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          expectations: string | null
          family: string | null
          goals: string | null
          history: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          plan_images: Json
          project_type: string | null
          service: string | null
          source: string | null
          stage: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          expectations?: string | null
          family?: string | null
          goals?: string | null
          history?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          plan_images?: Json
          project_type?: string | null
          service?: string | null
          source?: string | null
          stage?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          expectations?: string | null
          family?: string | null
          goals?: string | null
          history?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          plan_images?: Json
          project_type?: string | null
          service?: string | null
          source?: string | null
          stage?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio_ar: string | null
          bio_en: string | null
          created_at: string
          department: string | null
          id: string
          image_url: string | null
          name: string
          published: boolean
          role_ar: string | null
          role_en: string | null
          sort_order: number | null
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          department?: string | null
          id?: string
          image_url?: string | null
          name: string
          published?: boolean
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number | null
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          department?: string | null
          id?: string
          image_url?: string | null
          name?: string
          published?: boolean
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          published: boolean
          quote_ar: string | null
          quote_en: string | null
          rating: number | null
          role_ar: string | null
          role_en: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          published?: boolean
          quote_ar?: string | null
          quote_en?: string | null
          rating?: number | null
          role_ar?: string | null
          role_en?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          published?: boolean
          quote_ar?: string | null
          quote_en?: string | null
          rating?: number | null
          role_ar?: string | null
          role_en?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_clients: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
      can_manage_content: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
      has_package_access: {
        Args: {
          _package_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_office_consultant: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "manager" | "client_followup" | "technical_office" | "office_consultant"
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
      app_role: ["admin", "customer", "manager", "client_followup", "technical_office", "office_consultant"],
    },
  },
} as const
