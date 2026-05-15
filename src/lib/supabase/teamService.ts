import { supabase } from './client'
import type { Database } from '@/types/supabase'
import { getTemplate } from '@/lib/templateOverrides'

type Team = Database['public']['Tables']['teams']['Row']
type TeamInsert = Database['public']['Tables']['teams']['Insert']
type TeamSettings = Database['public']['Tables']['team_settings']['Row']

export const teamService = {
  async createTeam(data: {
    name: string
    level: 'a' | 'aa' | 'aaa' | 'coast' | 'majors'
    sport: 'baseball' | 'softball'
    season_year: number
    copyFromTeamId?: string
  }) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    // If we're cloning, fetch source players BEFORE creating the new team so
    // a fetch failure doesn't leave an orphan row behind. Settings always
    // come from the level template — only the roster carries over.
    let sourcePlayers: Database['public']['Tables']['players']['Row'][] = []
    if (data.copyFromTeamId) {
      const { data: pl, error: plErr } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', data.copyFromTeamId)
        .eq('active', true)
      if (plErr) throw plErr
      sourcePlayers =
        (pl as Database['public']['Tables']['players']['Row'][]) ?? []
    }

    const teamData: TeamInsert = {
      name: data.name,
      level: data.level,
      sport: data.sport,
      season_year: data.season_year,
      created_by: user.user.id,
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single()

    if (teamError) throw teamError

    // If any downstream insert fails, roll back by deleting the team so we
    // don't leave orphaned rows the user has to clean up manually.
    try {
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.user.id,
          role: 'head_coach',
        })

      if (memberError) throw memberError

      // Settings: always seed from the level template (so a new season at a
      // higher level picks up the right defaults rather than carrying old
      // weights forward).
      const template = getTemplate(data.level)
      const settingsRow: Database['public']['Tables']['team_settings']['Insert'] = {
        team_id: team.id,
        equity_enabled: true,
        equity_weights: template.equityWeights,
        safety_rules: {
          pitch_count_limits: template.safetyRules.pitch_count_limits,
          rest_day_ladder: template.safetyRules.rest_day_ladder,
        },
        position_categories: template.positionCategories,
        innings_per_game_default: template.inningsPerGame,
        continuous_batting_order: template.continuousBattingOrder,
      }
      const { error: settingsError } = await supabase
        .from('team_settings')
        .insert(settingsRow)
      if (settingsError) throw settingsError

      // Players: clone with fresh ids
      if (sourcePlayers.length > 0) {
        const playerRows = sourcePlayers.map((p) => ({
          team_id: team.id,
          first_name: p.first_name,
          last_name: p.last_name,
          jersey_number: p.jersey_number,
          birth_year: p.birth_year,
          preferred_positions: p.preferred_positions,
          restricted_positions: p.restricted_positions,
          notes: p.notes,
          development_goals: p.development_goals,
          active: true,
        }))
        const { error: playersError } = await supabase
          .from('players')
          .insert(playerRows)
        if (playersError) throw playersError
      }
    } catch (err) {
      await supabase.from('teams').delete().eq('id', team.id)
      throw err
    }

    return team
  },

  async getUserTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Team[]
  },

  async getTeamById(teamId: string) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (error) throw error
    return data as Team
  },

  async updateTeam(
    teamId: string,
    updates: Partial<Database['public']['Tables']['teams']['Update']>
  ) {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTeam(teamId: string) {
    const { data, error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
      .select()
    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error(
        'Delete returned 0 rows. RLS may be blocking — verify the DELETE policy exists on the teams table.'
      )
    }
  },

  async getTeamSettings(teamId: string) {
    const { data, error } = await supabase
      .from('team_settings')
      .select('*')
      .eq('team_id', teamId)
      .single()

    if (error) throw error
    return data as TeamSettings
  },

  async updateTeamSettings(teamId: string, updates: Partial<TeamSettings>) {
    const { data, error } = await supabase
      .from('team_settings')
      .update(updates)
      .eq('team_id', teamId)
      .select()
      .single()

    if (error) throw error
    return data as TeamSettings
  },

  async inviteAssistant(teamId: string, email: string) {
    // For v1, just send magic link and manually add as team member
    // In v2, create proper invitation flow
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/team/${teamId}`,
      },
    })

    if (error) throw error
    return data
  },

  async getTeamMembers(teamId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)

    if (error) throw error
    return data
  },

  /**
   * Every coach on the team with their email + role. Uses a SECURITY DEFINER
   * RPC (migration 005) so an assistant can see the head coach's email even
   * without direct SELECT access to auth.users.
   */
  async getTeamCoaches(teamId: string) {
    // RPC defined in migration 005; not in the generated Database type, so
    // we cast through `any` to call it.
    const { data, error } = await (supabase as any).rpc('get_team_coaches', {
      _team_id: teamId,
    })
    if (error) throw error
    return (data ?? []) as Array<{
      user_id: string
      email: string
      role: 'head_coach' | 'assistant_coach'
      joined_at: string
    }>
  },

  async addTeamMember(teamId: string, userId: string, role: 'head_coach' | 'assistant_coach') {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
