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
      blog_posts: {
        Row: {
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      fabrication_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      fabrication_products: {
        Row: {
          active: boolean
          base_price: number
          category_id: string | null
          created_at: string
          description: string | null
          fields: Json
          icon: string | null
          id: string
          image_url: string | null
          images: Json
          name: string
          price_per_m2: number
          pricing: Json
          slug: string
          sort_order: number
          specs: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          name: string
          price_per_m2?: number
          pricing?: Json
          slug: string
          sort_order?: number
          specs?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          name?: string
          price_per_m2?: number
          pricing?: Json
          slug?: string
          sort_order?: number
          specs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fabrication_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fabrication_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrication_projects: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          data: Json
          id: string
          name: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          data?: Json
          id?: string
          name?: string
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          data?: Json
          id?: string
          name?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fabrication_settings: {
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
          old_price: number | null
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
          video_muted: boolean
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
          old_price?: number | null
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
          video_muted?: boolean
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
          old_price?: number | null
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
          video_muted?: boolean
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
      phone_accounts: {
        Row: {
          created_at: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone?: string
          user_id?: string
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
      restaurant_accessories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          price?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_calc_events: {
        Row: {
          created_at: string
          id: string
          product_name: string | null
          product_slug: string | null
          total_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_name?: string | null
          product_slug?: string | null
          total_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_name?: string | null
          product_slug?: string | null
          total_price?: number
        }
        Relationships: []
      }
      restaurant_calc_settings: {
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
      restaurant_equipment: {
        Row: {
          active: boolean
          brand_logo_url: string | null
          category: string | null
          country_of_origin: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          manufacturer: string | null
          name: string
          price_new: number
          price_used: number
          project_type_slugs: string[]
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand_logo_url?: string | null
          category?: string | null
          country_of_origin?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name: string
          price_new?: number
          price_used?: number
          project_type_slugs?: string[]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand_logo_url?: string | null
          category?: string | null
          country_of_origin?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name?: string
          price_new?: number
          price_used?: number
          project_type_slugs?: string[]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_products: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          id: string
          image_url: string | null
          kind: string
          name: string
          options: Json
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          name: string
          options?: Json
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          options?: Json
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_project_types: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      saved_restaurant_projects: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          total?: number
          updated_at?: string
          user_id?: string
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
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
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
      site_visits: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          id: string
          path: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          id?: string
          path?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          id?: string
          path?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      sellers_public: {
        Row: {
          city: string | null
          deals_count: number | null
          id: string | null
          member_since: string | null
          name: string | null
          rating: number | null
          reviews_count: number | null
          verified: boolean | null
        }
        Insert: {
          city?: string | null
          deals_count?: number | null
          id?: string | null
          member_since?: string | null
          name?: string | null
          rating?: number | null
          reviews_count?: number | null
          verified?: boolean | null
        }
        Update: {
          city?: string | null
          deals_count?: number | null
          id?: string | null
          member_since?: string | null
          name?: string | null
          rating?: number | null
          reviews_count?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      expire_old_listings: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_views: { Args: { _id: string }; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
