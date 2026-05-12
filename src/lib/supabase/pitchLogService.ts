import { supabase } from './client'
import type { Database } from '@/types/supabase'

type PitchLogRow = Database['public']['Tables']['pitch_log']['Row']

export const pitchLogService = {
  async insertPitchLog(
    entries: Array<{
      game_id: string
      player_id: string
      pitch_count: number
      pitched_at: string
    }>
  ) {
    if (entries.length === 0) return
    const { error } = await supabase.from('pitch_log').insert(entries)
    if (error) throw error
  },

  async getTeamPitchLog(teamId: string): Promise<PitchLogRow[]> {
    // Pull every pitch log entry visible under RLS, filtered to this team's games.
    const { data, error } = await supabase
      .from('pitch_log')
      .select('*, games!inner(team_id)')
      .eq('games.team_id', teamId)
      .order('pitched_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as PitchLogRow[]
  },
}
