import { supabase } from './client'
import type { Database } from '@/types/supabase'

type Lineup = Database['public']['Tables']['lineups']['Row']

export const lineupService = {
  async getGameLineup(gameId: string) {
    const { data, error } = await supabase
      .from('lineups')
      .select('*')
      .eq('game_id', gameId)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found, return null
      return null
    }

    if (error) throw error
    return data as Lineup
  },

  async createOrUpdateLineup(gameId: string, batting_order: string[]) {
    const existing = await this.getGameLineup(gameId)

    if (existing) {
      const { data, error } = await supabase
        .from('lineups')
        .update({ batting_order })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as Lineup
    } else {
      const { data, error } = await supabase
        .from('lineups')
        .insert({
          game_id: gameId,
          batting_order,
        })
        .select()
        .single()

      if (error) throw error
      return data as Lineup
    }
  },

  async subscribeToLineupUpdates(gameId: string, callback: (lineup: Lineup) => void) {
    return supabase
      .channel(`lineup:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lineups', filter: `game_id=eq.${gameId}` },
        (payload: any) => {
          callback(payload.new as Lineup)
        }
      )
      .subscribe()
  },
}
