// User Role
export type UserRole = 'player' | 'staff' | 'admin';

// Round Status
export type RoundStatus = 'draft' | 'open' | 'processing' | 'completed' | 'cancelled';

// Queue Status
export type QueueStatus = 'waiting' | 'selected' | 'called' | 'serving' | 'completed' | 'no_show' | 'cancelled';

// Queue Position
export type QueuePosition = 'support' | 'general';

// Audit Action
export type AuditAction = 
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

// Profile
export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Round
export interface Round {
  id: string;
  round_number: number;
  event_date: string;
  status: RoundStatus;
  accepting_entries: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  opened_at?: string;
  closed_at?: string;
  completed_at?: string;
}

// Queue Entry
export interface QueueEntry {
  id: string;
  round_id: string;
  queue_number: string;
  player_name: string;
  contact: string;
  position: QueuePosition;
  status: QueueStatus;
  created_at: string;
  selected_at?: string;
  called_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  selected_by?: string;
  called_by?: string;
  completed_by?: string;
  notes?: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  actor_id?: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
}

// Queue Stats
export interface QueueStats {
  total: number;
  waiting: number;
  selected: number;
  called: number;
  serving: number;
  completed: number;
  no_show: number;
  cancelled: number;
}

// Position Stats
export interface PositionStats {
  support: QueueStats;
  general: QueueStats;
}

// Round with Stats
export interface RoundWithStats extends Round {
  stats: PositionStats;
}