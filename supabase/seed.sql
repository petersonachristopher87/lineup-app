-- Seed data for development
-- Creates "Issaquah AA Mariners" team with 12 players and 3 past games
-- Wired to user 3be4f5f8-4d47-49a2-9f16-9f92d98654e0

-- Insert team
INSERT INTO teams (id, name, level, sport, season_year, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Issaquah AA Mariners', 'aa', 'baseball', 2024,
   '3be4f5f8-4d47-49a2-9f16-9f92d98654e0'::uuid);

-- Insert team membership (head coach) so RLS policies match
INSERT INTO team_members (team_id, user_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::uuid,
   '3be4f5f8-4d47-49a2-9f16-9f92d98654e0'::uuid,
   'head_coach');

-- Insert team settings based on AA template
INSERT INTO team_settings (team_id, equity_enabled, equity_weights, safety_rules, position_categories, innings_per_game_default, continuous_batting_order) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  true,
  '{"playing_time": "high", "position_variety": "high", "batting_order_rotation": "high", "infield_outfield_balance": "high"}'::jsonb,
  '{"pitch_count_limits": [{"ageMin": 7, "ageMax": 8, "max_pitches": 50}, {"ageMin": 9, "ageMax": 10, "max_pitches": 75}], "rest_day_ladder": [{"min_pitches": 1, "max_pitches": 20, "rest_days": 0}, {"min_pitches": 21, "max_pitches": 35, "rest_days": 1}, {"min_pitches": 36, "max_pitches": 50, "rest_days": 2}, {"min_pitches": 51, "max_pitches": 65, "rest_days": 3}, {"min_pitches": 66, "max_pitches": 1000, "rest_days": 4}]}'::jsonb,
  '{"battery": ["P", "RP", "C"], "infield": ["1B", "2B", "3B", "SS"], "outfield": ["LF", "CF", "RF"], "bench": ["BENCH", "BENCH2", "BENCH3"]}'::jsonb,
  6,
  true
);

-- Insert 12 players
INSERT INTO players (id, team_id, first_name, last_name, jersey_number, preferred_positions, restricted_positions, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Emma', 'Johnson', '1', ARRAY['P', 'SS'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Liam', 'Smith', '2', ARRAY['C'], ARRAY['P'], true),
  ('550e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Sofia', 'Williams', '3', ARRAY['1B', '2B'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Noah', 'Brown', '4', ARRAY['3B', 'SS'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Olivia', 'Davis', '5', ARRAY['LF', 'CF'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440015'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Ava', 'Miller', '6', ARRAY['CF', 'RF'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440016'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Ethan', 'Wilson', '7', ARRAY['RF', 'SS'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440017'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Isabella', 'Moore', '8', ARRAY['2B'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440018'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Mason', 'Taylor', '9', ARRAY['1B', 'LF'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440019'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Charlotte', 'Anderson', '10', ARRAY['P', 'C'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Lucas', 'Thomas', '11', ARRAY['3B', 'LF'], NULL, true),
  ('550e8400-e29b-41d4-a716-446655440021'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Amelia', 'Jackson', '12', ARRAY['RF', 'CF'], NULL, true);

-- Insert 3 past games + 1 upcoming, dated relative to NOW so seeds stay sensible
INSERT INTO games (id, team_id, opponent_name, game_date, innings_count, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Bellevue Bears', NOW() - interval '21 days', 6, 'complete'),
  ('550e8400-e29b-41d4-a716-446655440031'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Redmond Rockets', NOW() - interval '14 days', 6, 'complete'),
  ('550e8400-e29b-41d4-a716-446655440032'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Kirkland Kraken', NOW() - interval '7 days', 6, 'complete'),
  ('550e8400-e29b-41d4-a716-446655440033'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Sammamish Sharks', NOW() + interval '7 days', 6, 'planned');

-- Insert attendance for first game
INSERT INTO game_attendance (game_id, player_id, status) 
SELECT '550e8400-e29b-41d4-a716-446655440030'::uuid, id, 'attending'
FROM players WHERE team_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Insert attendance for second game
INSERT INTO game_attendance (game_id, player_id, status) 
SELECT '550e8400-e29b-41d4-a716-446655440031'::uuid, id, 'attending'
FROM players WHERE team_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
AND id != '550e8400-e29b-41d4-a716-446655440012'::uuid; -- Sofia absent

-- Insert attendance for third game
INSERT INTO game_attendance (game_id, player_id, status) 
SELECT '550e8400-e29b-41d4-a716-446655440032'::uuid, id, 'attending'
FROM players WHERE team_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Create sample lineups for first game
INSERT INTO lineups (game_id, batting_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 
   ARRAY['550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440011'::uuid, 
         '550e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440013'::uuid,
         '550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440015'::uuid,
         '550e8400-e29b-41d4-a716-446655440016'::uuid, '550e8400-e29b-41d4-a716-446655440017'::uuid,
         '550e8400-e29b-41d4-a716-446655440018'::uuid, '550e8400-e29b-41d4-a716-446655440019'::uuid,
         '550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440021'::uuid]);

-- Create sample position assignments for first game (6 innings)
INSERT INTO position_assignments (game_id, inning, player_id, position) VALUES
  -- Inning 1
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440010'::uuid, 'P'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440011'::uuid, 'C'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440012'::uuid, '1B'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440013'::uuid, 'SS'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440014'::uuid, 'LF'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440015'::uuid, 'CF'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440016'::uuid, 'RF'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440017'::uuid, '2B'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 1, '550e8400-e29b-41d4-a716-446655440018'::uuid, '3B'),
  -- Inning 2 (some rotations)
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440019'::uuid, 'P'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440011'::uuid, 'C'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440012'::uuid, 'SS'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440013'::uuid, '3B'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440014'::uuid, 'LF'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440020'::uuid, 'CF'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440016'::uuid, 'RF'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440021'::uuid, '2B'),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, 2, '550e8400-e29b-41d4-a716-446655440018'::uuid, '1B');

-- Add pitch log for first game (matched to game_date above)
INSERT INTO pitch_log (game_id, player_id, pitch_count, pitched_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, 42, (NOW() - interval '21 days')::date),
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, '550e8400-e29b-41d4-a716-446655440019'::uuid, 38, (NOW() - interval '21 days')::date);
