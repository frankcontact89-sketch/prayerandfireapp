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
      devotionals: {
        Row: {
          application_en: string | null
          application_es: string | null
          application_pt: string | null
          context_en: string | null
          context_es: string | null
          context_pt: string | null
          created_at: string
          date: string
          id: string
          is_published: boolean
          prayer_en: string | null
          prayer_es: string | null
          prayer_pt: string | null
          questions_en: string[] | null
          questions_es: string[] | null
          questions_pt: string[] | null
          reflection_en: string | null
          reflection_es: string | null
          reflection_pt: string | null
          related_verses: string[] | null
          scripture_reference_en: string | null
          scripture_reference_es: string | null
          scripture_reference_pt: string | null
          scripture_text_en: string | null
          scripture_text_es: string | null
          scripture_text_pt: string | null
          title_en: string
          title_es: string | null
          title_pt: string | null
          updated_at: string
        }
        Insert: {
          application_en?: string | null
          application_es?: string | null
          application_pt?: string | null
          context_en?: string | null
          context_es?: string | null
          context_pt?: string | null
          created_at?: string
          date: string
          id?: string
          is_published?: boolean
          prayer_en?: string | null
          prayer_es?: string | null
          prayer_pt?: string | null
          questions_en?: string[] | null
          questions_es?: string[] | null
          questions_pt?: string[] | null
          reflection_en?: string | null
          reflection_es?: string | null
          reflection_pt?: string | null
          related_verses?: string[] | null
          scripture_reference_en?: string | null
          scripture_reference_es?: string | null
          scripture_reference_pt?: string | null
          scripture_text_en?: string | null
          scripture_text_es?: string | null
          scripture_text_pt?: string | null
          title_en: string
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
        }
        Update: {
          application_en?: string | null
          application_es?: string | null
          application_pt?: string | null
          context_en?: string | null
          context_es?: string | null
          context_pt?: string | null
          created_at?: string
          date?: string
          id?: string
          is_published?: boolean
          prayer_en?: string | null
          prayer_es?: string | null
          prayer_pt?: string | null
          questions_en?: string[] | null
          questions_es?: string[] | null
          questions_pt?: string[] | null
          reflection_en?: string | null
          reflection_es?: string | null
          reflection_pt?: string | null
          related_verses?: string[] | null
          scripture_reference_en?: string | null
          scripture_reference_es?: string | null
          scripture_reference_pt?: string | null
          scripture_text_en?: string | null
          scripture_text_es?: string | null
          scripture_text_pt?: string | null
          title_en?: string
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
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
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      greek_words: {
        Row: {
          biblical_usage_en: string | null
          biblical_usage_es: string | null
          biblical_usage_pt: string | null
          created_at: string
          explanation_en: string | null
          explanation_es: string | null
          explanation_pt: string | null
          greek: string
          id: string
          language_type: string
          meaning_en: string
          meaning_es: string
          meaning_pt: string
          order_index: number
          pronunciation: string
          scripture_refs: string | null
          slug: string
          transliteration: string
          updated_at: string
        }
        Insert: {
          biblical_usage_en?: string | null
          biblical_usage_es?: string | null
          biblical_usage_pt?: string | null
          created_at?: string
          explanation_en?: string | null
          explanation_es?: string | null
          explanation_pt?: string | null
          greek: string
          id?: string
          language_type?: string
          meaning_en: string
          meaning_es: string
          meaning_pt: string
          order_index?: number
          pronunciation: string
          scripture_refs?: string | null
          slug: string
          transliteration: string
          updated_at?: string
        }
        Update: {
          biblical_usage_en?: string | null
          biblical_usage_es?: string | null
          biblical_usage_pt?: string | null
          created_at?: string
          explanation_en?: string | null
          explanation_es?: string | null
          explanation_pt?: string | null
          greek?: string
          id?: string
          language_type?: string
          meaning_en?: string
          meaning_es?: string
          meaning_pt?: string
          order_index?: number
          pronunciation?: string
          scripture_refs?: string | null
          slug?: string
          transliteration?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_articles: {
        Row: {
          body_en: string | null
          body_es: string | null
          body_pt: string | null
          category: Database["public"]["Enums"]["library_category"]
          cover_image_url: string | null
          created_at: string
          id: string
          is_published: boolean
          order_index: number
          slug: string
          summary_en: string | null
          summary_es: string | null
          summary_pt: string | null
          title_en: string
          title_es: string | null
          title_pt: string | null
          updated_at: string
        }
        Insert: {
          body_en?: string | null
          body_es?: string | null
          body_pt?: string | null
          category: Database["public"]["Enums"]["library_category"]
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          slug: string
          summary_en?: string | null
          summary_es?: string | null
          summary_pt?: string | null
          title_en: string
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
        }
        Update: {
          body_en?: string | null
          body_es?: string | null
          body_pt?: string | null
          category?: Database["public"]["Enums"]["library_category"]
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string
          summary_en?: string | null
          summary_es?: string | null
          summary_pt?: string | null
          title_en?: string
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
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
          images: Json
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean
          name: string
          order_index: number
          price: number | null
          purchase_url: string
          sku: string | null
          stock_status: string
          updated_at: string | null
        }
        Insert: {
          button_label?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean
          name: string
          order_index?: number
          price?: number | null
          purchase_url: string
          sku?: string | null
          stock_status?: string
          updated_at?: string | null
        }
        Update: {
          button_label?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean
          name?: string
          order_index?: number
          price?: number | null
          purchase_url?: string
          sku?: string | null
          stock_status?: string
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
      reading_plan_days: {
        Row: {
          created_at: string
          day_number: number
          id: string
          passages: string[]
          plan_id: string
          title_en: string | null
          title_es: string | null
          title_pt: string | null
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          passages?: string[]
          plan_id: string
          title_en?: string | null
          title_es?: string | null
          title_pt?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          passages?: string[]
          plan_id?: string
          title_en?: string | null
          title_es?: string | null
          title_pt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plan_progress: {
        Row: {
          completed_at: string
          day_number: number
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_number: number
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          description_en: string | null
          description_es: string | null
          description_pt: string | null
          duration_days: number
          id: string
          is_published: boolean
          order_index: number
          slug: string
          title_en: string
          title_es: string | null
          title_pt: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          duration_days: number
          id?: string
          is_published?: boolean
          order_index?: number
          slug: string
          title_en: string
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          duration_days?: number
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string
          title_en?: string
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      solas: {
        Row: {
          application_en: string | null
          application_es: string | null
          application_pt: string | null
          created_at: string
          explanation_en: string | null
          explanation_es: string | null
          explanation_pt: string | null
          history_en: string | null
          history_es: string | null
          history_pt: string | null
          id: string
          latin: string
          name_en: string
          name_es: string
          name_pt: string
          order_index: number
          slug: string
          translation_en: string
          translation_es: string
          translation_pt: string
          updated_at: string
          verses_en: string | null
          verses_es: string | null
          verses_pt: string | null
        }
        Insert: {
          application_en?: string | null
          application_es?: string | null
          application_pt?: string | null
          created_at?: string
          explanation_en?: string | null
          explanation_es?: string | null
          explanation_pt?: string | null
          history_en?: string | null
          history_es?: string | null
          history_pt?: string | null
          id?: string
          latin: string
          name_en: string
          name_es: string
          name_pt: string
          order_index?: number
          slug: string
          translation_en: string
          translation_es: string
          translation_pt: string
          updated_at?: string
          verses_en?: string | null
          verses_es?: string | null
          verses_pt?: string | null
        }
        Update: {
          application_en?: string | null
          application_es?: string | null
          application_pt?: string | null
          created_at?: string
          explanation_en?: string | null
          explanation_es?: string | null
          explanation_pt?: string | null
          history_en?: string | null
          history_es?: string | null
          history_pt?: string | null
          id?: string
          latin?: string
          name_en?: string
          name_es?: string
          name_pt?: string
          order_index?: number
          slug?: string
          translation_en?: string
          translation_es?: string
          translation_pt?: string
          updated_at?: string
          verses_en?: string | null
          verses_es?: string | null
          verses_pt?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      library_category:
        | "bible_studies"
        | "doctrine"
        | "christology"
        | "pneumatology"
        | "soteriology"
        | "hermeneutics"
        | "homiletics"
        | "church_history"
        | "apologetics"
        | "leadership"
        | "missions"
        | "sermons"
        | "articles"
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
      library_category: [
        "bible_studies",
        "doctrine",
        "christology",
        "pneumatology",
        "soteriology",
        "hermeneutics",
        "homiletics",
        "church_history",
        "apologetics",
        "leadership",
        "missions",
        "sermons",
        "articles",
      ],
    },
  },
} as const
