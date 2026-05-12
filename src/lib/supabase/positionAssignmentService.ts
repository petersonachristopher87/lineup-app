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

  async bulkSetPositionAssignments(
    gameId: string,
    assignments: Array<{ inning: number; player_id: string; position: string }>
  ) {
    if (assignments.length === 0) return
    // Two-pass upsert avoids the partial-unique constraint on
    // (game_id, inning, position) where position != 'BENCH'. Pass 1 parks
    // every player at BENCH for their inning (no constraint conflict); pass
    // 2 moves them to their target position one row at a time.
    const benchRows = assignments.map((a) => ({
      game_id: gameId,
      inning: a.inning,
      player_id: a.player_id,
      position: 'BENCH',
    }))
    const { error: pass1 } = await supabase
      .from('position_assignments')
      .upsert(benchRows, { onConflict: 'game_id,inning,player_id' })
    if (pass1) throw pass1

    const finalRows = assignments.map((a) => ({
      game_id: gameId,
      inning: a.inning,
      player_id: a.player_id,
      position: a.position,
    }))
    const { error: pass2 } = await supabase
      .from('position_assignments')
      .upsert(finalRows, { onConflict: 'game_id,inning,player_id' })
    if (pass2) throw pass2
  },

  async clearInningAssignments(gameId: string, inning: number) {
    const { error } = await supabase
      .from('position_assignments')
      .delete()
      .eq('game_id', gameId)
      .eq('inning', inning)

    if (error) throw error
  },

  async getTeamCompletedAssignments(teamId: string) {
    // Pull every position_assignments row for this team's completed games
    // in one round trip via PostgREST embed.
    const { data, error } = await supabase
      .from('position_assignments')
      .select('*, games!inner(team_id, status, innings_played, opponent_name, game_date)')
      .eq('games.team_id', teamId)
      .eq('games.status', 'complete')
    if (error) throw error
    return (data ?? []) as Array<{
      id: string
      game_id: string
      inning: number
      player_id: string
      position: string
      games: {
        team_id: string
        status: string
        innings_played: number | null
        opponent_name: string
        game_date: string
      }
    }>
  },

  async clearPlayerInningAssignment(gameId: string, inning: number, playerId: string) {
    const { data, error } = await supabase
      .from('position_assignments')
      .delete()
      .eq('game_id', gameId)
      .eq('inning', inning)
      .eq('player_id', playerId)
      .select()
    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error(
        'Delete returned 0 rows. The DELETE RLS policy on position_assignments may not be applied — run the SQL from the previous step.'
      )
    }
  },

  async clearGameAssignments(gameId: string) {
    const { error } = await supabase
      .from('position_assignments')
      .delete()
      .eq('game_id', gameId)

    if (error) throw error
  },

  /**
   * Reorder innings: takes a mapping of oldInning → newInning and rewrites
   * all rows. Wipes existing assignments and re-inserts with new numbers
   * so the partial-unique constraint never sees a transient conflict.
   */
  async reorderInnings(gameId: string, oldOrder: number[]) {
    const { data: existing, error: fetchErr } = await supabase
      .from('position_assignments')
      .select('inning, player_id, position')
      .eq('game_id', gameId)
    if (fetchErr) throw fetchErr

    const oldToNew: Record<number, number> = {}
    oldOrder.forEach((oldInning, idx) => {
      oldToNew[oldInning] = idx + 1
    })

    const { error: delErr } = await supabase
      .from('position_assignments')
      .delete()
      .eq('game_id', gameId)
    if (delErr) throw delErr

    if (existing && existing.length > 0) {
      const rows = existing.map((row: any) => ({
        game_id: gameId,
        inning: oldToNew[row.inning] ?? row.inning,
        player_id: row.player_id,
        position: row.position,
      }))
      const { error: insErr } = await supabase
        .from('position_assignments')
        .insert(rows)
      if (insErr) throw insErr
    }
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
