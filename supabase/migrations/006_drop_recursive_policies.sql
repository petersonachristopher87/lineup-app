-- Migration 005 added two SELECT policies that recursively reference each
-- other through the teams ↔ team_members relationship, causing Postgres
-- "infinite recursion detected in policy" errors on team queries — the
-- Dashboard ends up showing zero teams.
--
-- Drop both expanded policies. They are not actually needed:
--   * The Coaches page uses get_team_coaches (SECURITY DEFINER RPC) which
--     bypasses RLS, so an assistant can still see every coach + email.
--   * Pending invites are hidden from assistants in the UI now, and head
--     coaches retain full read/write via the existing "Head coaches manage
--     invitations" policy.
--
-- get_team_coaches and user_is_team_member stay — those are fine.

DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;
DROP POLICY IF EXISTS "Team members can read invitations on their team" ON team_invitations;
