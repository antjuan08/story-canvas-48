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
      books: {
        Row: {
          created_at: string
          id: string
          payload: Json
          premise: string | null
          template: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          premise?: string | null
          template: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          premise?: string | null
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_stories: {
        Row: {
          collection_id: string
          position: number
          story_id: string
        }
        Insert: {
          collection_id: string
          position?: number
          story_id: string
        }
        Update: {
          collection_id?: string
          position?: number
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_stories_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          context: string
          created_at: string
          description: string | null
          id: string
          name: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          context: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          story_id: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          story_id?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          story_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          context: string
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          user_id: string
        }
        Insert: {
          context: string
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      keynotes: {
        Row: {
          audience: string | null
          core_message: string | null
          created_at: string
          id: string
          length: string | null
          payload: Json
          story_ids: string[] | null
          title: string
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          core_message?: string | null
          created_at?: string
          id?: string
          length?: string | null
          payload?: Json
          story_ids?: string[] | null
          title: string
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          core_message?: string | null
          created_at?: string
          id?: string
          length?: string | null
          payload?: Json
          story_ids?: string[] | null
          title?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      license_requests: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          requester_id: string
          resolved_at: string | null
          status: string
          story_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          requester_id: string
          resolved_at?: string | null
          status?: string
          story_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          requester_id?: string
          resolved_at?: string | null
          status?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_requests_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          created_at: string
          episode_title: string
          format: string | null
          id: string
          length: string | null
          payload: Json
          show_name: string
          story_ids: string[] | null
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          episode_title: string
          format?: string | null
          id?: string
          length?: string | null
          payload?: Json
          show_name: string
          story_ids?: string[] | null
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          episode_title?: string
          format?: string | null
          id?: string
          length?: string | null
          payload?: Json
          show_name?: string
          story_ids?: string[] | null
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      presentation_stories: {
        Row: {
          position: number
          presentation_id: string
          story_id: string
        }
        Insert: {
          position?: number
          presentation_id: string
          story_id: string
        }
        Update: {
          position?: number
          presentation_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_stories_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          content: Json
          created_at: string
          folder_id: string | null
          id: string
          tags: string[] | null
          template_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          folder_id?: string | null
          id?: string
          tags?: string[] | null
          template_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          folder_id?: string | null
          id?: string
          tags?: string[] | null
          template_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          interests: string[] | null
          social_links: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          interests?: string[] | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          analysis: Json | null
          audio_url: string | null
          created_at: string
          duration_seconds: number | null
          folder_id: string | null
          id: string
          linked_presentation_id: string | null
          linked_story_id: string | null
          title: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          analysis?: Json | null
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          folder_id?: string | null
          id?: string
          linked_presentation_id?: string | null
          linked_story_id?: string | null
          title: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          analysis?: Json | null
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          folder_id?: string | null
          id?: string
          linked_presentation_id?: string | null
          linked_story_id?: string | null
          title?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordings_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_linked_presentation_id_fkey"
            columns: ["linked_presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_linked_story_id_fkey"
            columns: ["linked_story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      reimagined_stories: {
        Row: {
          angle: string | null
          cover_url: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          payload: Json
          source_story_id: string | null
          status: string
          title: string
          user_id: string
          video_prompt: string | null
          video_url: string | null
        }
        Insert: {
          angle?: string | null
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          payload?: Json
          source_story_id?: string | null
          status?: string
          title: string
          user_id: string
          video_prompt?: string | null
          video_url?: string | null
        }
        Update: {
          angle?: string | null
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          payload?: Json
          source_story_id?: string | null
          status?: string
          title?: string
          user_id?: string
          video_prompt?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          audio_url: string | null
          body: string | null
          category: string | null
          created_at: string
          folder_id: string | null
          grade: string | null
          id: string
          image_url: string | null
          is_licensable: boolean
          is_public: boolean
          section: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          folder_id?: string | null
          grade?: string | null
          id?: string
          image_url?: string | null
          is_licensable?: boolean
          is_public?: boolean
          section?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          folder_id?: string | null
          grade?: string | null
          id?: string
          image_url?: string | null
          is_licensable?: boolean
          is_public?: boolean
          section?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      story_collaborators: {
        Row: {
          collaborator_id: string
          created_at: string
          id: string
          perspective_text: string | null
          status: string
          story_id: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          id?: string
          perspective_text?: string | null
          status?: string
          story_id: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          id?: string
          perspective_text?: string | null
          status?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_collaborators_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
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
      get_public_profiles: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "support" | "user"
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
      app_role: ["admin", "support", "user"],
    },
  },
} as const
