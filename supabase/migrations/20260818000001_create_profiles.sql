-- Create ENUM types
CREATE TYPE user_role AS ENUM ('player', 'staff', 'admin');
CREATE TYPE round_status AS ENUM ('draft', 'open', 'processing', 'completed', 'cancelled');
CREATE TYPE queue_status AS ENUM ('waiting', 'selected', 'called', 'serving', 'completed', 'no_show', 'cancelled');
CREATE TYPE queue_position AS ENUM ('support', 'general');
CREATE TYPE audit_action AS ENUM (
  'create_round', 'open_round', 'close_round', 'reopen_round',
  'register_queue', 'random_queue', 'random_confirm', 'random_reject',
  'manual_call', 'start_serving', 'complete_queue', 'no_show', 'cancel_queue'
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rounds table
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number SERIAL NOT NULL,
  event_date DATE NOT NULL,
  status round_status NOT NULL DEFAULT 'draft',
  accepting_entries BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(round_number, event_date)
);

-- Create queue_entries table
CREATE TABLE queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  queue_number TEXT NOT NULL,
  player_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  position queue_position NOT NULL,
  status queue_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  selected_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  selected_by UUID REFERENCES profiles(id),
  called_by UUID REFERENCES profiles(id),
  completed_by UUID REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(round_id, queue_number)
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_queue_entries_round_id ON queue_entries(round_id);
CREATE INDEX idx_queue_entries_round_position_status ON queue_entries(round_id, position, status);
CREATE INDEX idx_queue_entries_round_queue_number ON queue_entries(round_id, queue_number);
CREATE INDEX idx_queue_entries_round_created_at ON queue_entries(round_id, created_at);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_rounds_event_date ON rounds(event_date);
CREATE INDEX idx_rounds_status ON rounds(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;