import { supabase } from './client'
import type { Database } from '@/types/supabase'

type PositionAssignment = Database['public']['Tables']['position_assignments']['Row']

export const positionAssignmentService = {
  async getGamePositionAssignments(gameId: string) {
    const { data, error } = await supabase
      .from('position_assignments')
      .select('*')
      .eq('game_id', gameId)
      .order('inning')

    if (error) throw error
    return data as PositionAssignment[]
  },

  async setPositionAssignment(
    gameId: string,
    inning: number,
    player_id: string,
    position: string
  ) {
    // Check if player already assigned to a position in this inning
    const { data: existing } = await supabase
      .from('position_assignments')
      .select('id')
      .eq('game_id', gameId)
      .eq('inning', inning)
      .eq('player_id', player_id)
      .single()

    if (existing) {
      // Update existing assignment
      const { error } = await supabase
        .from('position_assignments')
        .update({ position })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Create new assignment
      const { error } = await supabase
        .from('position_assignments')
        .insert({
          game_id: gameId,
          inning,
          player_id,
          position,
        })

      if (error) throw error
    }
  },

  async deletePositionAssignment(assignmentId: string) {
    const { error } = await supabase
      .from('position_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error
  },

  async clearInningAssignments(gameId: string, inning: number) {
    const { error } = await supabase
      .from('position_assignments')
      .delete()
      .eq('game_id', gameId)
      .eq('inning', inning)

    if (error) throw error
  },

  async subscribeToPositionUpdates(gameId: string, callback: (assignment: PositionAssignment) => void) {
    return supabase
      .channel(`positions:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'position_assignments',
          filter: `game_id=eq.${gameId}`,
        },
        (payload: any) => {
          callback(payload.new as PositionAssignment)
        }
      )
      .subscribe()
  },
}
