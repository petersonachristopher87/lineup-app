import { supabase } from './client'
import type { Database } from '@/types/supabase'

type GameAttendance = Database['public']['Tables']['game_attendance']['Row']

export const attendanceService = {
  async getGameAttendance(gameId: string) {
    const { data, error } = await supabase
      .from('game_attendance')
      .select('*, players(*)')
      .eq('game_id', gameId)
      .order('players(last_name)')

    if (error) throw error
    return data as any[]
  },

  async setAttendance(
    gameId: string,
    playerId: string,
    status: 'attending' | 'absent' | 'maybe'
  ) {
    const { data: existing } = await supabase
      .from('game_attendance')
      .select('id')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('game_attendance')
        .update({ status })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('game_attendance')
        .insert({
          game_id: gameId,
          player_id: playerId,
          status,
        })

      if (error) throw error
    }
  },

  async initializeGameAttendance(gameId: string, playerIds: string[]) {
    const attendance = playerIds.map((playerId) => ({
      game_id: gameId,
      player_id: playerId,
      status: 'attending' as const,
    }))

    const { error } = await supabase.from('game_attendance').insert(attendance)

    if (error) throw error
  },

  async subscribeToAttendanceUpdates(gameId: string, callback: (attendance: any) => void) {
    return supabase
      .channel(`attendance:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_attendance', filter: `game_id=eq.${gameId}` },
        (payload: any) => {
          callback(payload.new as GameAttendance)
        }
      )
      .subscribe()
  },
}
