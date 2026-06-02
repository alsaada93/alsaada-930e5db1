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
      auction_bids: {
        Row: {
          amount: number
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          category_id: string
          created_at: string
          id: string
          item_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          item_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          item_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_requests: {
        Row: {
          budget: number | null
          category_id: string | null
          city: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          images: string[]
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          budget?: number | null
          category_id?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          budget?: number | null
          category_id?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          link: string | null
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          link?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      listing_deletions: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          listing_title: string | null
          other_site: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          listing_title?: string | null
          other_site?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          listing_title?: string | null
          other_site?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lang: string
          listing_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lang: string
          listing_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lang?: string
          listing_id?: string
          title?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          area_sqm: number | null
          auction_ends_at: string | null
          brand: string | null
          category_id: string | null
          city: string | null
          condition: string
          contact_name: string | null
          contact_phone: string | null
          country_of_origin: string | null
          created_at: string
          delivery_available: boolean | null
          description: string | null
          expires_at: string
          featured: boolean
          group_name: string | null
          has_license: boolean | null
          id: string
          images: string[]
          includes_equipment: boolean | null
          item_name: string | null
          lat: number | null
          listing_type: string
          lng: number | null
          monthly_revenue: number | null
          negotiable: boolean
          negotiable_flag: boolean | null
          operating_cost: number | null
          outlets: number | null
          price: number
          published_at: string
          rent: number | null
          sale_reason: string | null
          staff_count: number | null
          start_price: number | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
          video: string | null
          views: number
        }
        Insert: {
          area_sqm?: number | null
          auction_ends_at?: string | null
          brand?: string | null
          category_id?: string | null
          city?: string | null
          condition?: string
          contact_name?: string | null
          contact_phone?: string | null
          country_of_origin?: string | null
          created_at?: string
          delivery_available?: boolean | null
          description?: string | null
          expires_at?: string
          featured?: boolean
          group_name?: string | null
          has_license?: boolean | null
          id?: string
          images?: string[]
          includes_equipment?: boolean | null
          item_name?: string | null
          lat?: number | null
          listing_type?: string
          lng?: number | null
          monthly_revenue?: number | null
          negotiable?: boolean
          negotiable_flag?: boolean | null
          operating_cost?: number | null
          outlets?: number | null
          price?: number
          published_at?: string
          rent?: number | null
          sale_reason?: string | null
          staff_count?: number | null
          start_price?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
          video?: string | null
          views?: number
        }
        Update: {
          area_sqm?: number | null
          auction_ends_at?: string | null
          brand?: string | null
          category_id?: string | null
          city?: string | null
          condition?: string
          contact_name?: string | null
          contact_phone?: string | null
          country_of_origin?: string | null
          created_at?: string
          delivery_available?: boolean | null
          description?: string | null
          expires_at?: string
          featured?: boolean
          group_name?: string | null
          has_license?: boolean | null
          id?: string
          images?: string[]
          includes_equipment?: boolean | null
          item_name?: string | null
          lat?: number | null
          listing_type?: string
          lng?: number | null
          monthly_revenue?: number | null
          negotiable?: boolean
          negotiable_flag?: boolean | null
          operating_cost?: number | null
          outlets?: number | null
          price?: number
          published_at?: string
          rent?: number | null
          sale_reason?: string | null
          staff_count?: number | null
          start_price?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          video?: string | null
          views?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          message: string | null
          read: boolean
          recipient_id: string
          sender_name: string | null
          sender_phone: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          read?: boolean
          recipient_id: string
          sender_name?: string | null
          sender_phone?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          read?: boolean
          recipient_id?: string
          sender_name?: string | null
          sender_phone?: string | null
          type?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      price_offers: {
        Row: {
          amount: number
          created_at: string
          id: string
          listing_id: string
          message: string | null
          recipient_id: string
          sender_id: string | null
          sender_name: string | null
          sender_phone: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          recipient_id: string
          sender_id?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          recipient_id?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          verification_status: string
          verified: boolean
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          verification_status?: string
          verified?: boolean
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          verification_status?: string
          verified?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          label: string | null
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          seller_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          seller_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          city: string | null
          created_at: string
          deals_count: number
          id: string
          member_since: string
          name: string
          phone: string | null
          rating: number
          reviews_count: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          city?: string | null
          created_at?: string
          deals_count?: number
          id: string
          member_since?: string
          name: string
          phone?: string | null
          rating?: number
          reviews_count?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          city?: string | null
          created_at?: string
          deals_count?: number
          id?: string
          member_since?: string
          name?: string
          phone?: string | null
          rating?: number
          reviews_count?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
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
      expire_old_listings: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_views: { Args: { _id: string }; Returns: undefined }
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
