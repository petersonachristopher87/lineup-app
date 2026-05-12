-- Run this once on existing databases (the 001 migration was already applied
-- without this table). Idempotent via IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('head_coach', 'assistant_coach')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  accepted_by_user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON team_invitations TO authenticated;

-- Head coaches can manage invitations for their teams.
DROP POLICY IF EXISTS "Head coaches manage invitations" ON team_invitations;
CREATE POLICY "Head coaches manage invitations"
  ON team_invitations FOR ALL
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
      UNION
      SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role = 'head_coach'
    )
  );

-- Anyone authenticated can read + update invitations addressed to their own
-- email — needed so the dashboard can auto-claim pending invites.
DROP POLICY IF EXISTS "Invitees can see their own invites" ON team_invitations;
CREATE POLICY "Invitees can see their own invites"
  ON team_invitations FOR SELECT
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "Invitees can claim their own invites" ON team_invitations;
CREATE POLICY "Invitees can claim their own invites"
  ON team_invitations FOR UPDATE
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  WITH CHECK (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
