export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type user_role = 'player' | 'staff' | 'admin';
export type round_status = 'draft' | 'open' | 'processing' | 'completed' | 'cancelled';
export type queue_status = 'waiting' | 'selected' | 'called' | 'serving' | 'completed' | 'no_show' | 'cancelled';
export type queue_position = 'support' | 'general';
export type audit_action =
  | 'create_round'
  | 'open_round'
  | 'close_round'
  | 'reopen_round'
  | 'register_queue'
  | 'random_queue'
  | 'random_confirm'
  | 'random_reject'
  | 'manual_call'
  | 'start_serving'
  | 'complete_queue'
  | 'no_show'
  | 'cancel_queue';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: user_role;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: user_role;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          role?: user_role;
          created_at?: string;
          updated_at?: string;
        };
      };
      rounds: {
        Row: {
          id: string;
          round_number: number;
          event_date: string;
          status: round_status;
          accepting_entries: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          opened_at: string | null;
          closed_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          round_number?: number;
          event_date: string;
          status?: round_status;
          accepting_entries?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          opened_at?: string | null;
          closed_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          round_number?: number;
          event_date?: string;
          status?: round_status;
          accepting_entries?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          opened_at?: string | null;
          closed_at?: string | null;
          completed_at?: string | null;
        };
      };
      queue_entries: {
        Row: {
          id: string;
          round_id: string;
          queue_number: string;
          player_name: string;
          contact: string;
          position: queue_position;
          status: queue_status;
          created_at: string;
          selected_at: string | null;
          called_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          selected_by: string | null;
          called_by: string | null;
          completed_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          round_id: string;
          queue_number: string;
          player_name: string;
          contact: string;
          position: queue_position;
          status?: queue_status;
          created_at?: string;
          selected_at?: string | null;
          called_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          selected_by?: string | null;
          called_by?: string | null;
          completed_by?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          round_id?: string;
          queue_number?: string;
          player_name?: string;
          contact?: string;
          position?: queue_position;
          status?: queue_status;
          created_at?: string;
          selected_at?: string | null;
          called_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          selected_by?: string | null;
          called_by?: string | null;
          completed_by?: string | null;
          notes?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: audit_action;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: audit_action;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: audit_action;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      generate_queue_number: {
        Args: {
          p_round_id: string;
          p_position: queue_position;
        };
        Returns: string;
      };
      register_queue_entry: {
        Args: {
          p_round_id: string;
          p_player_name: string;
          p_contact: string;
          p_position: queue_position;
        };
        Returns: string;
      };
      random_select_queue: {
        Args: {
          p_round_id: string;
          p_position: queue_position;
        };
        Returns: Json;
      };
      confirm_random_queue: {
        Args: {
          p_entry_id: string;
        };
        Returns: Json;
      };
      reject_random_queue: {
        Args: {
          p_entry_id: string;
        };
        Returns: Json;
      };
      manual_call_queue: {
        Args: {
          p_entry_id: string;
        };
        Returns: Json;
      };
      complete_queue: {
        Args: {
          p_entry_id: string;
        };
        Returns: Json;
      };
      mark_no_show: {
        Args: {
          p_entry_id: string;
        };
        Returns: Json;
      };
      cancel_queue: {
        Args: {
          p_entry_id: string;
        };
        Returns: Json;
      };
      reopen_round: {
        Args: {
          p_round_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      get_user_role: {
        Args: {};
        Returns: user_role;
      };
      is_staff_or_admin: {
        Args: {};
        Returns: boolean;
      };
    };
    Enums: {
      user_role: 'player' | 'staff' | 'admin';
      round_status: 'draft' | 'open' | 'processing' | 'completed' | 'cancelled';
      queue_status: 'waiting' | 'selected' | 'called' | 'serving' | 'completed' | 'no_show' | 'cancelled';
      queue_position: 'support' | 'general';
      audit_action:
        | 'create_round'
        | 'open_round'
        | 'close_round'
        | 'reopen_round'
        | 'register_queue'
        | 'random_queue'
        | 'random_confirm'
        | 'random_reject'
        | 'manual_call'
        | 'start_serving'
        | 'complete_queue'
        | 'no_show'
        | 'cancel_queue';
    };
  };
}