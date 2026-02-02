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
      ai_reviews: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          requested_by: string
          result: Json
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          requested_by: string
          result: Json
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          requested_by?: string
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_reviews_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          contract_id: string
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          contract_id: string
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          contract_id?: string
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          break_minutes: number
          business_size: Database["public"]["Enums"]["business_size"]
          completed_at: string | null
          contract_type: "regular" | "contract"
          created_at: string
          deleted_at: string | null
          employer_id: string
          end_date: string | null
          expires_at: string | null
          folder_id: string | null
          hourly_wage: number | null
          id: string
          includes_weekly_allowance: boolean
          is_last_day_payment: boolean
          job_description: string
          monthly_wage: number | null
          pay_day: number
          payment_timing: string
          pdf_url: string | null
          resignation_date: string | null
          share_token: string
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          wage_type: string
          work_days: string[] | null
          work_days_per_week: number | null
          work_end_time: string
          work_location: string
          work_start_time: string
          worker_account_encrypted: string | null
          worker_bank_name: string | null
          worker_id: string | null
          worker_name: string
          worker_phone: string | null
          worker_ssn_encrypted: string | null
          workplace_id: string | null
          workplace_name: string | null
        }
        Insert: {
          break_minutes: number
          business_size: Database["public"]["Enums"]["business_size"]
          completed_at?: string | null
          contract_type?: "regular" | "contract"
          created_at?: string
          deleted_at?: string | null
          employer_id: string
          end_date?: string | null
          expires_at?: string | null
          folder_id?: string | null
          hourly_wage?: number | null
          id?: string
          includes_weekly_allowance?: boolean
          is_last_day_payment?: boolean
          job_description: string
          monthly_wage?: number | null
          pay_day: number
          payment_timing?: string
          pdf_url?: string | null
          resignation_date?: string | null
          share_token?: string
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          wage_type?: string
          work_days?: string[] | null
          work_days_per_week?: number | null
          work_end_time: string
          work_location: string
          work_start_time: string
          worker_account_encrypted?: string | null
          worker_bank_name?: string | null
          worker_id?: string | null
          worker_name: string
          worker_phone?: string | null
          worker_ssn_encrypted?: string | null
          workplace_id?: string | null
          workplace_name?: string | null
        }
        Update: {
          break_minutes?: number
          business_size?: Database["public"]["Enums"]["business_size"]
          completed_at?: string | null
          contract_type?: "regular" | "contract"
          created_at?: string
          deleted_at?: string | null
          employer_id?: string
          end_date?: string | null
          expires_at?: string | null
          folder_id?: string | null
          hourly_wage?: number | null
          id?: string
          includes_weekly_allowance?: boolean
          is_last_day_payment?: boolean
          job_description?: string
          monthly_wage?: number | null
          pay_day?: number
          payment_timing?: string
          pdf_url?: string | null
          resignation_date?: string | null
          share_token?: string
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          wage_type?: string
          work_days?: string[] | null
          work_days_per_week?: number | null
          work_end_time?: string
          work_location?: string
          work_start_time?: string
          worker_account_encrypted?: string | null
          worker_bank_name?: string | null
          worker_id?: string | null
          worker_name?: string
          worker_phone?: string | null
          worker_ssn_encrypted?: string | null
          workplace_id?: string | null
          workplace_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          credit_type: Database["public"]["Enums"]["credit_type"]
          description: string
          id: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          credit_type: Database["public"]["Enums"]["credit_type"]
          description: string
          id?: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          credit_type?: Database["public"]["Enums"]["credit_type"]
          description?: string
          id?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          amount: number
          credit_type: Database["public"]["Enums"]["credit_type"]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          credit_type: Database["public"]["Enums"]["credit_type"]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          credit_type?: Database["public"]["Enums"]["credit_type"]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credits_ai_review: number
          credits_contract: number
          id: string
          order_id: string
          paid_at: string | null
          payment_key: string | null
          product_name: string
          receipt_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_ai_review?: number
          credits_contract?: number
          id?: string
          order_id: string
          paid_at?: string | null
          payment_key?: string | null
          product_name: string
          receipt_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_ai_review?: number
          credits_contract?: number
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_key?: string | null
          product_name?: string
          receipt_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      sensitive_info_logs: {
        Row: {
          accessed_at: string
          contract_id: string
          id: string
          info_type: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          contract_id: string
          id?: string
          info_type: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          contract_id?: string
          id?: string
          info_type?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensitive_info_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitive_info_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          contract_id: string
          id: string
          ip_address: unknown
          signature_data: string
          signed_at: string
          signer_role: Database["public"]["Enums"]["signer_role"]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          contract_id: string
          id?: string
          ip_address?: unknown
          signature_data: string
          signed_at?: string
          signer_role: Database["public"]["Enums"]["signer_role"]
          user_agent?: string | null
          user_id: string
        }
        Update: {
          contract_id?: string
          id?: string
          ip_address?: unknown
          signature_data?: string
          signed_at?: string
          signer_role?: Database["public"]["Enums"]["signer_role"]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_details: {
        Row: {
          account_number_encrypted: string
          bank_name: string
          created_at: string
          id: string
          is_verified: boolean
          ssn_encrypted: string
          ssn_hash: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          account_number_encrypted: string
          bank_name: string
          created_at?: string
          id?: string
          is_verified?: boolean
          ssn_encrypted: string
          ssn_hash: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          account_number_encrypted?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          ssn_encrypted?: string
          ssn_hash?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_hidden_contracts: {
        Row: {
          contract_id: string
          hidden_at: string
          id: string
          worker_id: string
        }
        Insert: {
          contract_id: string
          hidden_at?: string
          id?: string
          worker_id: string
        }
        Update: {
          contract_id?: string
          hidden_at?: string
          id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_hidden_contracts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_hidden_contracts_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workplaces: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workplaces_user_id_fkey"
            columns: ["user_id"]
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
      add_credit: {
        Args: {
          p_amount: number
          p_credit_type: Database["public"]["Enums"]["credit_type"]
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: number
      }
      expire_pending_contracts: { Args: never; Returns: number }
      use_credit: {
        Args: {
          p_amount: number
          p_credit_type: Database["public"]["Enums"]["credit_type"]
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      business_size: "under_5" | "over_5"
      contract_status: "draft" | "pending" | "completed" | "expired" | "deleted"
      credit_type: "contract" | "ai_review"
      notification_type:
        | "contract_sent"
        | "contract_signed"
        | "contract_expired_soon"
        | "contract_expired"
        | "contract_modified"
      signer_role: "employer" | "worker"
      user_role: "employer" | "worker"
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
      business_size: ["under_5", "over_5"],
      contract_status: ["draft", "pending", "completed", "expired", "deleted"],
      credit_type: ["contract", "ai_review"],
      notification_type: [
        "contract_sent",
        "contract_signed",
        "contract_expired_soon",
        "contract_expired",
        "contract_modified",
      ],
      signer_role: ["employer", "worker"],
      user_role: ["employer", "worker"],
    },
  },
} as const
