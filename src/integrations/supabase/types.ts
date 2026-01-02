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
      cities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          province: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          province?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          province?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cuisine_types: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      food_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "food_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      food_posts: {
        Row: {
          caption: string | null
          created_at: string
          guest_name: string | null
          id: string
          image_url: string
          likes_count: number
          restaurant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          image_url: string
          likes_count?: number
          restaurant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          image_url?: string
          likes_count?: number
          restaurant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_posts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: string[] | null
          id: string
          imported_restaurants: number
          imported_reviews: number
          last_city: string | null
          processed_cities: number
          skipped_restaurants: number
          started_at: string | null
          status: string
          total_cities: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: string[] | null
          id?: string
          imported_restaurants?: number
          imported_reviews?: number
          last_city?: string | null
          processed_cities?: number
          skipped_restaurants?: number
          started_at?: string | null
          status?: string
          total_cities?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: string[] | null
          id?: string
          imported_restaurants?: number
          imported_reviews?: number
          last_city?: string | null
          processed_cities?: number
          skipped_restaurants?: number
          started_at?: string | null
          status?: string
          total_cities?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_claims: {
        Row: {
          business_email: string
          created_at: string
          documents_url: string[] | null
          id: string
          message: string | null
          phone: string | null
          rejection_reason: string | null
          restaurant_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_email: string
          created_at?: string
          documents_url?: string[] | null
          id?: string
          message?: string | null
          phone?: string | null
          rejection_reason?: string | null
          restaurant_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_email?: string
          created_at?: string
          documents_url?: string[] | null
          id?: string
          message?: string | null
          phone?: string | null
          rejection_reason?: string | null
          restaurant_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_claims_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_cuisines: {
        Row: {
          cuisine_id: string
          restaurant_id: string
        }
        Insert: {
          cuisine_id: string
          restaurant_id: string
        }
        Update: {
          cuisine_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_cuisines_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_cuisines_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          is_primary: boolean | null
          restaurant_id: string
          url: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_primary?: boolean | null
          restaurant_id: string
          url: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_primary?: boolean | null
          restaurant_id?: string
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          city_id: string | null
          created_at: string
          description: string | null
          email: string | null
          features: Json | null
          google_place_id: string | null
          id: string
          image_url: string | null
          is_claimed: boolean | null
          is_verified: boolean | null
          latitude: number
          longitude: number
          meta_description: string | null
          meta_title: string | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          price_range: Database["public"]["Enums"]["price_range"] | null
          rating: number | null
          review_count: number | null
          slug: string
          specialties: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          city_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          features?: Json | null
          google_place_id?: string | null
          id?: string
          image_url?: string | null
          is_claimed?: boolean | null
          is_verified?: boolean | null
          latitude: number
          longitude: number
          meta_description?: string | null
          meta_title?: string | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          price_range?: Database["public"]["Enums"]["price_range"] | null
          rating?: number | null
          review_count?: number | null
          slug: string
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          city_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          features?: Json | null
          google_place_id?: string | null
          id?: string
          image_url?: string | null
          is_claimed?: boolean | null
          is_verified?: boolean | null
          latitude?: number
          longitude?: number
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          price_range?: Database["public"]["Enums"]["price_range"] | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          created_at: string
          id: string
          review_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          guest_email: string | null
          guest_name: string | null
          id: string
          is_approved: boolean | null
          is_verified: boolean | null
          rating: number
          restaurant_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          rating: number
          restaurant_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          rating?: number
          restaurant_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_restaurant: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      claim_status: "pending" | "approved" | "rejected"
      price_range: "€" | "€€" | "€€€" | "€€€€"
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
      claim_status: ["pending", "approved", "rejected"],
      price_range: ["€", "€€", "€€€", "€€€€"],
    },
  },
} as const
