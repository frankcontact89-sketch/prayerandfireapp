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
      app_content: {
        Row: {
          created_at: string | null
          id: string
          key: string
          label: string | null
          updated_at: string | null
          value_en: string | null
          value_es: string | null
          value_pt: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          label?: string | null
          updated_at?: string | null
          value_en?: string | null
          value_es?: string | null
          value_pt?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          label?: string | null
          updated_at?: string | null
          value_en?: string | null
          value_es?: string | null
          value_pt?: string | null
        }
        Relationships: []
      }
      app_links: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      app_videos: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          is_live: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          button_label: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_type: string
          link_url: string | null
          order_index: number | null
          price: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          button_label?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_type?: string
          link_url?: string | null
          order_index?: number | null
          price?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          button_label?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_type?: string
          link_url?: string | null
          order_index?: number | null
          price?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_online: boolean | null
          location: string | null
          max_attendees: number | null
          registration_url: string | null
          rsvp_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_url?: string | null
          rsvp_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_url?: string | null
          rsvp_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          button_label: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number | null
          purchase_url: string
          updated_at: string | null
        }
        Insert: {
          button_label?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price?: number | null
          purchase_url: string
          updated_at?: string | null
        }
        Update: {
          button_label?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number | null
          purchase_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          updated_at: string
          username: string
          welcome_seen: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          updated_at?: string
          username: string
          welcome_seen?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          username?: string
          welcome_seen?: boolean | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          price_paid: number | null
          product_id: string
          purchase_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_paid?: number | null
          product_id: string
          purchase_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price_paid?: number | null
          product_id?: string
          purchase_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verses: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          ref_en: string | null
          ref_es: string | null
          ref_pt: string | null
          text_en: string | null
          text_es: string | null
          text_pt: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          ref_en?: string | null
          ref_es?: string | null
          ref_pt?: string | null
          text_en?: string | null
          text_es?: string | null
          text_pt?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          ref_en?: string | null
          ref_es?: string | null
          ref_pt?: string | null
          text_en?: string | null
          text_es?: string | null
          text_pt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_username_by_email: { Args: { _email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
