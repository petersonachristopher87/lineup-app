-- Let an invitee insert their own team_members row when a matching pending
-- invitation exists for their email. Without this, the auto-claim flow on the
-- Dashboard would be blocked by the existing "Head coaches can add team
-- members" policy (which only permits head coaches / team creators to insert).

DROP POLICY IF EXISTS "Invitees can add themselves via pending invitation" ON team_members;
CREATE POLICY "Invitees can add themselves via pending invitation"
  ON team_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_invitations
      WHERE team_invitations.team_id = team_members.team_id
        AND team_invitations.role = team_members.role
        AND lower(team_invitations.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND team_invitations.accepted_at IS NULL
    )
  );
