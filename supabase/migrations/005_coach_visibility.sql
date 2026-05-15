-- Let any team member (head coach, assistant, creator) see the full coach
-- roster and invitation history for teams they belong to. The Coaches page
-- is now view-only for assistants, but they need read access to render it.

-- SECURITY DEFINER helper used by team_members policies to avoid recursive
-- RLS evaluation (a SELECT policy that itself queries team_members).
CREATE OR REPLACE FUNCTION public.user_is_team_member(_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_is_team_member(uuid) TO authenticated;

-- team_invitations: members can read every invite for their team.
DROP POLICY IF EXISTS "Team members can read invitations on their team" ON team_invitations;
CREATE POLICY "Team members can read invitations on their team"
  ON team_invitations FOR SELECT
  USING (
    public.user_is_team_member(team_id)
    OR team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- team_members: members can read every membership row on their team.
DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;
CREATE POLICY "Team members can view team roster"
  ON team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.user_is_team_member(team_id)
    OR team_id IN (SELECT id FROM teams WHERE created_by = auth.uid())
  );

-- RPC that returns every coach on a team with their email. Joins
-- team_members → auth.users; the SECURITY DEFINER bypass lets a team
-- member see other coaches' emails even though they can't query auth.users
-- directly. The internal check still gates access to team members and
-- the team creator.
DROP FUNCTION IF EXISTS public.get_team_coaches(uuid);
CREATE FUNCTION public.get_team_coaches(_team_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tm.user_id, u.email::text, tm.role, tm.created_at
  FROM public.team_members tm
  JOIN auth.users u ON u.id = tm.user_id
  WHERE tm.team_id = _team_id
    AND (
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = _team_id AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.teams
        WHERE id = _team_id AND created_by = auth.uid()
      )
    )
  ORDER BY tm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_coaches(uuid) TO authenticated;
