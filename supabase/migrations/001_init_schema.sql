-- Create teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL CHECK (level IN ('a', 'aa', 'aaa', 'coast', 'majors')),
  sport text NOT NULL CHECK (sport IN ('baseball', 'softball')),
  season_year integer NOT NULL,
  logo_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('head_coach', 'assistant_coach')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Invitations: head coaches invite assistants by email; claim happens on sign-in
CREATE TABLE team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('head_coach', 'assistant_coach')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  accepted_by_user_id uuid REFERENCES auth.users(id)
);

-- Create players table
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  jersey_number text,
  birth_year integer,
  preferred_positions text[] DEFAULT ARRAY[]::text[],
  restricted_positions text[] DEFAULT ARRAY[]::text[],
  notes text,
  development_goals jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_settings table
CREATE TABLE team_settings (
  team_id uuid PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  equity_enabled boolean DEFAULT true,
  equity_weights jsonb DEFAULT '{"playing_time": "high", "position_variety": "high", "batting_order_rotation": "high", "infield_outfield_balance": "high"}'::jsonb,
  safety_rules jsonb,
  position_categories jsonb DEFAULT '{"battery": ["P", "C"], "infield": ["1B", "2B", "3B", "SS"], "outfield": ["LF", "CF", "RF"], "bench": ["BENCH"]}'::jsonb,
  innings_per_game_default integer DEFAULT 6,
  continuous_batting_order boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create games table
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_name text NOT NULL,
  game_date timestamptz NOT NULL,
  location text,
  innings_count integer DEFAULT 6,
  innings_played integer,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'complete', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_attendance table
CREATE TABLE game_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'absent', 'maybe')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game_id, player_id)
);

-- Create lineups table
CREATE TABLE lineups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  batting_order uuid[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create position_assignments table
CREATE TABLE position_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  inning integer NOT NULL CHECK (inning > 0),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game_id, inning, player_id)
);

CREATE UNIQUE INDEX position_assignments_unique_non_bench
  ON position_assignments(game_id, inning, position)
  WHERE position != 'BENCH';

-- Create pitch_log table
CREATE TABLE pitch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pitch_count integer NOT NULL CHECK (pitch_count >= 0),
  pitched_at date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_games_team_id_date ON games(team_id, game_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_position_assignments_game_inning ON position_assignments(game_id, inning);
CREATE INDEX idx_position_assignments_player ON position_assignments(player_id);
CREATE INDEX idx_pitch_log_player ON pitch_log(player_id);
CREATE INDEX idx_pitch_log_game ON pitch_log(game_id);

-- Grant base privileges to Supabase roles (RLS layered on top)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Enable Row-Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can read/write only teams they're members of
-- Teams: user is creator or member
CREATE POLICY "Users can view teams they created or are members of"
  ON teams FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Head coaches can update team"
  ON teams FOR UPDATE
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

CREATE POLICY "Team creators can delete teams"
  ON teams FOR DELETE
  USING (created_by = auth.uid());

-- Team members: only head coaches can manage
-- Simplified to avoid recursion: users can only see their own membership rows.
CREATE POLICY "Users can view their own team memberships"
  ON team_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Head coaches can add team members"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

-- Players: team members can view/edit
CREATE POLICY "Team members can view players"
  ON players FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Head coaches can manage players"
  ON players FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

CREATE POLICY "Head coaches can update players"
  ON players FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

-- Team settings: head coaches only
CREATE POLICY "Team members can view settings"
  ON team_settings FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Head coaches can update settings"
  ON team_settings FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

-- Games: all team members can view, head coaches can edit
CREATE POLICY "Team members can view games"
  ON games FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Head coaches can manage games"
  ON games FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

CREATE POLICY "Head coaches can update games"
  ON games FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

-- Game attendance: all team members can view, assistants can edit
CREATE POLICY "Team members can view game attendance"
  ON game_attendance FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can update game attendance"
  ON game_attendance FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can update attendance"
  ON game_attendance FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Lineups: all team members can view, assistants can edit
CREATE POLICY "Team members can view lineups"
  ON lineups FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can manage lineups"
  ON lineups FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can update lineups"
  ON lineups FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Position assignments: all team members can view, assistants can edit
CREATE POLICY "Team members can view position assignments"
  ON position_assignments FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can manage position assignments"
  ON position_assignments FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can update position assignments"
  ON position_assignments FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can delete position assignments"
  ON position_assignments FOR DELETE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Pitch log: all team members can view, head coaches can edit
CREATE POLICY "Team members can view pitch log"
  ON pitch_log FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Head coaches can manage pitch log"
  ON pitch_log FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
      )
    )
  );

CREATE POLICY "Head coaches can update pitch log"
  ON pitch_log FOR UPDATE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
      )
    )
  );
