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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_table: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_table: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_table?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_usage: {
        Row: {
          created_at: string
          email_type: string
          id: string
          recipient_email: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type?: string
          id?: string
          recipient_email: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          recipient_email?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          consent_marketing: boolean | null
          created_at: string
          email: string
          id: string
          last_contacted_at: string | null
          lead_source: Database["public"]["Enums"]["lead_source"] | null
          loan_officer_id: string
          name: string | null
          notes: string | null
          phone: string | null
          property_address: string | null
          quote_data: Json | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          consent_marketing?: boolean | null
          created_at?: string
          email: string
          id?: string
          last_contacted_at?: string | null
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          loan_officer_id: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          property_address?: string | null
          quote_data?: Json | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          consent_marketing?: boolean | null
          created_at?: string
          email?: string
          id?: string
          last_contacted_at?: string | null
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          loan_officer_id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          property_address?: string | null
          quote_data?: Json | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      loan_officer_slugs: {
        Row: {
          created_at: string
          id: string
          slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_address: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          custom_font_url: string | null
          email: string
          full_name: string
          id: string
          logo_aspect_ratio: string | null
          logo_url: string | null
          nmls_company: string | null
          nmls_license: string | null
          phone: string | null
          preferred_font: string | null
          state_license_text: string | null
          title: string | null
          updated_at: string
          website: string | null
          work_email: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_address?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          custom_font_url?: string | null
          email: string
          full_name: string
          id: string
          logo_aspect_ratio?: string | null
          logo_url?: string | null
          nmls_company?: string | null
          nmls_license?: string | null
          phone?: string | null
          preferred_font?: string | null
          state_license_text?: string | null
          title?: string | null
          updated_at?: string
          website?: string | null
          work_email?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_address?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          custom_font_url?: string | null
          email?: string
          full_name?: string
          id?: string
          logo_aspect_ratio?: string | null
          logo_url?: string | null
          nmls_company?: string | null
          nmls_license?: string | null
          phone?: string | null
          preferred_font?: string | null
          state_license_text?: string | null
          title?: string | null
          updated_at?: string
          website?: string | null
          work_email?: string | null
        }
        Relationships: []
      }
      saved_quotes: {
        Row: {
          calculator_type: string
          created_at: string
          id: string
          inputs: Json
          quote_name: string
          results: Json
          special_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calculator_type?: string
          created_at?: string
          id?: string
          inputs: Json
          quote_name: string
          results: Json
          special_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calculator_type?: string
          created_at?: string
          id?: string
          inputs?: Json
          quote_name?: string
          results?: Json
          special_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_quotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_daily_email_count: { Args: { p_user_id: string }; Returns: number }
      get_loan_officer_id_by_slug: { Args: { p_slug: string }; Returns: string }
      get_user_quote_count: { Args: { user_id: string }; Returns: number }
      get_user_tier: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tier_access: {
        Args: {
          required_tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }
        Returns: boolean
      }
      is_owner_or_admin: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_target_table?: string
          p_target_user_id?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
      lead_source:
        | "calculator"
        | "landing_page"
        | "qr_code"
        | "referral"
        | "direct"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "closed"
        | "lost"
      subscription_tier: "free" | "professional" | "business"
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
      app_role: ["owner", "admin", "user"],
      lead_source: [
        "calculator",
        "landing_page",
        "qr_code",
        "referral",
        "direct",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "closed",
        "lost",
      ],
      subscription_tier: ["free", "professional", "business"],
    },
  },
} as const
