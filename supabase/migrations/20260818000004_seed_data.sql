-- Seed Admin User (you'll need to create this user via Supabase Auth first)
-- This is a template - replace with actual user ID after creating in Supabase Auth
-- INSERT INTO profiles (id, display_name, role) VALUES
--   ('00000000-0000-0000-0000-000000000000', 'Admin User', 'admin');

-- Seed sample round for development
INSERT INTO rounds (round_number, event_date, status, accepting_entries, created_by)
VALUES 
  (1, '2026-08-18', 'processing', true, NULL);

-- Seed sample queue entries
INSERT INTO queue_entries (round_id, queue_number, player_name, contact, position, status)
SELECT 
  r.id,
  'S-' || LPAD(n::TEXT, 3, '0'),
  'Player Support ' || n,
  '08' || LPAD(n::TEXT, 8, '0'),
  'support',
  (CASE 
    WHEN n <= 10 THEN 'completed'
    WHEN n <= 15 THEN 'called'
    WHEN n <= 20 THEN 'selected'
    ELSE 'waiting'
  END)::queue_status
FROM rounds r, generate_series(1, 50) AS n
WHERE r.round_number = 1 AND r.event_date = '2026-08-18';

INSERT INTO queue_entries (round_id, queue_number, player_name, contact, position, status)
SELECT 
  r.id,
  'G-' || LPAD(n::TEXT, 3, '0'),
  'Player General ' || n,
  '09' || LPAD(n::TEXT, 8, '0'),
  'general',
  (CASE 
    WHEN n <= 15 THEN 'completed'
    WHEN n <= 25 THEN 'called'
    WHEN n <= 35 THEN 'selected'
    ELSE 'waiting'
  END)::queue_status
FROM rounds r, generate_series(1, 100) AS n
WHERE r.round_number = 1 AND r.event_date = '2026-08-18';