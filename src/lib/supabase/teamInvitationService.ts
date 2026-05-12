import { supabase } from './client'
import type { Database } from '@/types/supabase'

type Invitation = Database['public']['Tables']['team_invitations']['Row']

export const teamInvitationService = {
  async listForTeam(teamId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Invitation[]
  },

  async create(teamId: string, email: string, role: 'head_coach' | 'assistant_coach') {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: email.trim().toLowerCase(),
        role,
        created_by: user.user.id,
      })
      .select()
      .single()
    if (error) throw error
    return data as Invitation
  },

  async remove(invitationId: string) {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId)
    if (error) throw error
  },

  /**
   * Pending invitations addressed to the current user's email. Used by the
   * Dashboard to auto-claim any team_members rows on sign-in.
   */
  async listPendingForMe(): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .is('accepted_at', null)
    if (error) throw error
    return (data ?? []) as Invitation[]
  },

  /**
   * Claim a pending invitation: insert the team_members row and mark the
   * invitation accepted. Safe to call multiple times — if the team_member
   * row already exists the unique constraint will reject the insert but we
   * still mark the invitation accepted.
   */
  async claim(invitationId: string) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data: inv, error: invErr } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()
    if (invErr) throw invErr
    const invitation = inv as Invitation
    if (invitation.accepted_at) return invitation

    // Try to insert the team_member row. Ignore the unique-violation case
    // (member already exists) — happens if a head coach manually re-added
    // someone outside the invite flow.
    const { error: insErr } = await supabase.from('team_members').insert({
      team_id: invitation.team_id,
      user_id: user.user.id,
      role: invitation.role,
    })
    if (insErr && (insErr as any).code !== '23505') {
      throw insErr
    }

    const { data: updated, error: updErr } = await supabase
      .from('team_invitations')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: user.user.id,
      })
      .eq('id', invitationId)
      .select()
      .single()
    if (updErr) throw updErr
    return updated as Invitation
  },
}
