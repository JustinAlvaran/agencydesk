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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agencies: {
        Row: { id: string; name: string; slug: string; intake_enabled: boolean; created_at: string }
        Insert: { id?: string; name: string; slug: string; intake_enabled?: boolean; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; intake_enabled?: boolean; created_at?: string }
        Relationships: []
      }
      automation_rules: {
        Row: {
          provider: string
          agency_id: string
          id: string
          name: string
          event_type: string
          channel: string
          template_key: string
          delay_minutes: number
          approval_required: boolean
          enabled: boolean
          created_at: string
        }
        Insert: {
          provider?: string
          agency_id?: string
          id?: string
          name: string
          event_type: string
          channel?: string
          template_key: string
          delay_minutes?: number
          approval_required?: boolean
          enabled?: boolean
          created_at?: string
        }
        Update: {
          provider?: string
          agency_id?: string
          id?: string
          name?: string
          event_type?: string
          channel?: string
          template_key?: string
          delay_minutes?: number
          approval_required?: boolean
          enabled?: boolean
          created_at?: string
        }
        Relationships: []
      }
      message_jobs: {
        Row: {
          provider: string
          agency_id: string
          id: string
          rule_id: string
          event_id: string
          lead_id: string
          revision_id: string | null
          channel: string
          recipient: string
          subject: string
          body: string
          status: string
          due_at: string
          portal_path: string | null
          attempts: number
          lease_token: string | null
          lease_expires_at: string | null
          provider_message_id: string | null
          last_error: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          provider?: string
          agency_id?: string
          id?: string
          rule_id: string
          event_id: string
          lead_id: string
          revision_id?: string | null
          channel: string
          recipient: string
          subject: string
          body: string
          status: string
          due_at: string
          portal_path?: string | null
          attempts?: number
          lease_token?: string | null
          lease_expires_at?: string | null
          provider_message_id?: string | null
          last_error?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          provider?: string
          agency_id?: string
          id?: string
          rule_id?: string
          event_id?: string
          lead_id?: string
          revision_id?: string | null
          channel?: string
          recipient?: string
          subject?: string
          body?: string
          status?: string
          due_at?: string
          portal_path?: string | null
          attempts?: number
          lease_token?: string | null
          lease_expires_at?: string | null
          provider_message_id?: string | null
          last_error?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "message_jobs_rule_id_fkey"; columns: ["rule_id"]; isOneToOne: false; referencedRelation: "automation_rules"; referencedColumns: ["id"] },
          { foreignKeyName: "message_jobs_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "activity_events"; referencedColumns: ["id"] },
          { foreignKeyName: "message_jobs_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "message_jobs_revision_id_fkey"; columns: ["revision_id"]; isOneToOne: false; referencedRelation: "proposal_revisions"; referencedColumns: ["id"] },
        ]
      }
      message_attempts: {
        Row: {
          provider: string
          agency_id: string
          id: string
          job_id: string
          attempt_number: number
          lease_token: string
          started_at: string
          finished_at: string | null
          outcome: string
          provider_message_id: string | null
          error_code: string | null
        }
        Insert: {
          provider?: string
          agency_id?: string
          id?: string
          job_id: string
          attempt_number: number
          lease_token: string
          started_at?: string
          finished_at?: string | null
          outcome?: string
          provider_message_id?: string | null
          error_code?: string | null
        }
        Update: {
          provider?: string
          agency_id?: string
          id?: string
          job_id?: string
          attempt_number?: number
          lease_token?: string
          started_at?: string
          finished_at?: string | null
          outcome?: string
          provider_message_id?: string | null
          error_code?: string | null
        }
        Relationships: [{ foreignKeyName: "message_attempts_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "message_jobs"; referencedColumns: ["id"] }]
      }
      activity_events: {
        Row: {
          agency_id: string
          actor_id: string | null
          created_at: string
          detail: Json
          event_type: string
          id: string
          lead_id: string | null
          project_id: string | null
        }
        Insert: {
          agency_id?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          lead_id?: string | null
          project_id?: string | null
        }
        Update: {
          agency_id?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          lead_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_memberships: {
        Row: {
          agency_id: string
          active: boolean
          can_accept_proposals: boolean
          company_id: string
          user_id: string
        }
        Insert: {
          agency_id?: string
          active?: boolean
          can_accept_proposals?: boolean
          company_id: string
          user_id: string
        }
        Update: {
          agency_id?: string
          active?: boolean
          can_accept_proposals?: boolean
          company_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          agency_id: string
          author_id: string
          body: string
          created_at: string
          id: string
          update_id: string
        }
        Insert: {
          agency_id?: string
          author_id: string
          body: string
          created_at?: string
          id?: string
          update_id: string
        }
        Update: {
          agency_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "project_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          agency_id?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          agency_id: string
          company_id: string
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          agency_id?: string
          company_id: string
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          agency_id?: string
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          agency_id: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          due_at: string
          id: string
          lead_id: string
          title: string
        }
        Insert: {
          agency_id?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_at: string
          id?: string
          lead_id: string
          title: string
        }
        Update: {
          agency_id?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string
          id?: string
          lead_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follow_up_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          agency_id: string
          author_id: string
          body: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          agency_id?: string
          author_id: string
          body: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          agency_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agency_id: string
          phone: string | null
          source: string
          email_opt_in: boolean
          whatsapp_opt_in: boolean
          archived_at: string | null
          brief: string
          budget_cents: number
          company_id: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          owner_id: string | null
          service: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string
          phone?: string | null
          source?: string
          email_opt_in?: boolean
          whatsapp_opt_in?: boolean
          archived_at?: string | null
          brief: string
          budget_cents?: number
          company_id?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          owner_id?: string | null
          service: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          phone?: string | null
          source?: string
          email_opt_in?: boolean
          whatsapp_opt_in?: boolean
          archived_at?: string | null
          brief?: string
          budget_cents?: number
          company_id?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          owner_id?: string | null
          service?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["user_id"]
          },
        ]
      }
      milestones: {
        Row: {
          agency_id: string
          due_at: string | null
          id: string
          position: number
          project_id: string
          status: string
          title: string
        }
        Insert: {
          agency_id?: string
          due_at?: string | null
          id?: string
          position?: number
          project_id: string
          status?: string
          title: string
        }
        Update: {
          agency_id?: string
          due_at?: string | null
          id?: string
          position?: number
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          agency_id: string
          body: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          agency_id?: string
          body: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          agency_id?: string
          body?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          agency_id: string
          accepted_revision_id: string
          company_id: string
          created_at: string
          id: string
          lead_id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string
          accepted_revision_id: string
          company_id: string
          created_at?: string
          id?: string
          lead_id: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          accepted_revision_id?: string
          company_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_accepted_revision_id_fkey"
            columns: ["accepted_revision_id"]
            isOneToOne: true
            referencedRelation: "proposal_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          agency_id: string
          description: string
          id: string
          position: number
          quantity: number
          revision_id: string
          unit_price_cents: number
        }
        Insert: {
          agency_id?: string
          description: string
          id?: string
          position?: number
          quantity: number
          revision_id: string
          unit_price_cents: number
        }
        Update: {
          agency_id?: string
          description?: string
          id?: string
          position?: number
          quantity?: number
          revision_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "proposal_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_revisions: {
        Row: {
          agency_id: string
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          expires_at: string
          id: string
          published_at: string | null
          scope: string
          series_id: string
          status: string
          total_cents: number
          version: number
        }
        Insert: {
          agency_id?: string
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at: string
          id?: string
          published_at?: string | null
          scope: string
          series_id: string
          status?: string
          total_cents?: number
          version: number
        }
        Update: {
          agency_id?: string
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          published_at?: string | null
          scope?: string
          series_id?: string
          status?: string
          total_cents?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_revisions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "proposal_series"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_series: {
        Row: {
          agency_id: string
          company_id: string
          created_at: string
          id: string
          lead_id: string
          title: string
        }
        Insert: {
          agency_id?: string
          company_id: string
          created_at?: string
          id?: string
          lead_id: string
          title: string
        }
        Update: {
          agency_id?: string
          company_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_series_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_series_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          agency_id: string
          active: boolean
          role: string
          user_id: string
        }
        Insert: {
          agency_id?: string
          active?: boolean
          role: string
          user_id: string
        }
        Update: {
          agency_id?: string
          active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      suppress_lead_recipient: { Args: { p_lead_id: string; p_channel: string }; Returns: boolean }
      admin_clear_lead_recipient_suppression: { Args: { p_lead_id: string; p_channel: string }; Returns: boolean }
      lead_message_suppression: { Args: { p_lead_id: string }; Returns: { channel: string; suppressed: boolean; reason: string | null }[] }
      agency_intake_info: { Args: { agency_slug: string }; Returns: Json }
      provision_agency: { Args: { agency_name: string; agency_slug: string; owner_user_id: string }; Returns: string }
      workspace_account: { Args: { account_email: string }; Returns: string }
      create_business_contact: { Args: { contact_name: string; contact_email: string; company_id?: string | null; company_name?: string | null }; Returns: string }
      create_manual_lead: { Args: { p_action_id: string; p_details: Json }; Returns: string }
      record_message_receipts: { Args: { p_receipts: Json }; Returns: number }
      retry_message_job: { Args: { p_job_id: string }; Returns: boolean }
      log_lead_call: {
        Args: { p_lead_id: string; p_outcome: string; p_note?: string; p_callback_at?: string | null; p_action_id?: string }
        Returns: string
      }
      configure_automation_rule: {
        Args: { p_rule_id: string; p_enabled: boolean; p_delay_minutes: number; p_approval_required: boolean; p_channel: string; p_provider?: string }
        Returns: undefined
      }
      approve_message_job: { Args: { p_job_id: string }; Returns: boolean }
      cancel_message_job: { Args: { p_job_id: string }; Returns: boolean }
      claim_message_jobs: { Args: { p_limit?: number; p_agency_id?: string }; Returns: Database["public"]["Tables"]["message_jobs"]["Row"][] }
      revalidate_message_job: { Args: { p_job_id: string; p_lease_token: string }; Returns: boolean }
      finish_message_job: {
        Args: { p_job_id: string; p_lease_token: string; p_outcome: string; p_provider_message_id?: string | null; p_error_code?: string | null; p_retry_after_seconds?: number | null }
        Returns: boolean
      }
      record_message_receipt: {
        Args: { p_provider: string; p_event_id: string; p_provider_message_id: string; p_status: string }
        Returns: boolean
      }
      submit_inquiry_with_preferences: {
        Args: { contact_name: string; email: string; service: string; brief: string; budget_cents: number; request_key: string; phone: string | null; email_opt_in: boolean; whatsapp_opt_in: boolean; target_agency_id?: string }
        Returns: string
      }
      accept_proposal_revision: {
        Args: { revision_id: string }
        Returns: string
      }
      decline_proposal_revision: {
        Args: { revision_id: string }
        Returns: undefined
      }
      get_dashboard_metrics: { Args: never; Returns: Json }
      publish_proposal_revision: {
        Args: { revision_id: string }
        Returns: undefined
      }
      submit_inquiry: {
        Args: {
          brief: string
          budget_cents: number
          contact_name: string
          email: string
          request_key: string
          service: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

