import { supabase } from './client'
import type { Database } from '@/types/supabase'
import { LEVEL_TEMPLATES } from '@/lib/levelTemplates'

type Team = Database['public']['Tables']['teams']['Row']
type TeamInsert = Database['public']['Tables']['teams']['Insert']
type TeamSettings = Database['public']['Tables']['team_settings']['Row']

export const teamService = {
  async createTeam(data: {
    name: string
    level: 'single_a' | 'aa' | 'aaa' | 'coast' | 'majors'
    sport: 'baseball' | 'softball'
    season_year: number
  }) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

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

    // Create team_member entry for creator
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.user.id,
        role: 'head_coach',
      })

    if (memberError) throw memberError

    // Create team_settings with level template
    const template = LEVEL_TEMPLATES[data.level]
    const { error: settingsError } = await supabase
      .from('team_settings')
      .insert({
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
      })

    if (settingsError) throw settingsError

    return team
  },

  async getUserTeams() {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .or(
        `created_by.eq.${user.user.id},id.in.(select team_id from team_members where user_id = ${user.user.id})`
      )

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
      .select('*, users:user_id(id, email)')
      .eq('team_id', teamId)

    if (error) throw error
    return data
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
