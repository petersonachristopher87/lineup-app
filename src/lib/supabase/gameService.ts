import { supabase } from './client'
import type { Database } from '@/types/supabase'

type Game = Database['public']['Tables']['games']['Row']

export const gameService = {
  async getTeamGames(teamId: string) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .order('game_date', { ascending: false })

    if (error) throw error
    return data as Game[]
  },

  async getGameById(gameId: string) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (error) throw error
    return data as Game
  },

  async createGame(teamId: string, gameData: {
    opponent_name: string
    game_date: string
    location?: string
    innings_count: number
  }) {
    const { data, error } = await supabase
      .from('games')
      .insert({
        team_id: teamId,
        ...gameData,
        status: 'planned',
      })
      .select()
      .single()

    if (error) throw error
    return data as Game
  },

  async updateGame(gameId: string, updates: Partial<Game>) {
    const { data, error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', gameId)
      .select()
      .single()

    if (error) throw error

    // Pitch logs snapshot the game date into their own `pitched_at` column at
    // mark-complete time. Cascade date edits so rest-day math stays accurate.
    if (updates.game_date) {
      const pitchedAt = new Date(updates.game_date).toISOString().slice(0, 10)
      const { error: cascadeError } = await supabase
        .from('pitch_log')
        .update({ pitched_at: pitchedAt })
        .eq('game_id', gameId)
      if (cascadeError) throw cascadeError
    }

    return data as Game
  },

  async deleteGame(gameId: string) {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId)

    if (error) throw error
  },

  async subscribeToGameUpdates(gameId: string, callback: (game: Game) => void) {
    return supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload: any) => {
          callback(payload.new as Game)
        }
      )
      .subscribe()
  },
}
