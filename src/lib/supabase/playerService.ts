import { supabase } from './client'
import type { Database } from '@/types/supabase'

type Player = Database['public']['Tables']['players']['Row']

export const playerService = {
  async getTeamPlayers(teamId: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .eq('active', true)
      .order('last_name')

    if (error) throw error
    return data as Player[]
  },

  async getPlayerById(playerId: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (error) throw error
    return data as Player
  },

  async createPlayer(teamId: string, playerData: {
    first_name: string
    last_name: string
    jersey_number?: string
    birth_year?: number | null
    preferred_positions?: string[]
    restricted_positions?: string[]
    notes?: string
    development_goals?: Record<string, any>
  }) {
    const { data, error } = await supabase
      .from('players')
      .insert({
        team_id: teamId,
        ...playerData,
      })
      .select()
      .single()

    if (error) throw error
    return data as Player
  },

  async updatePlayer(playerId: string, updates: Partial<Player>) {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw error
    return data as Player
  },

  async deletePlayer(playerId: string) {
    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('players')
      .update({ active: false })
      .eq('id', playerId)

    if (error) throw error
  },

  async bulkCreatePlayers(teamId: string, players: Array<{
    first_name: string
    last_name: string
    jersey_number?: string
    preferred_positions?: string[]
  }>) {
    const playerData = players.map(p => ({
      ...p,
      team_id: teamId,
    }))

    const { data, error } = await supabase
      .from('players')
      .insert(playerData)
      .select()

    if (error) throw error
    return data as Player[]
  },
}
