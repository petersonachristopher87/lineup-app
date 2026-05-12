import { useMemo } from 'react'
import {
  calculateGameEquityWarnings,
  type EquityWarning,
  type EquityWeights,
  type PositionCategories,
} from '@/lib/equityEngine'

interface UseEquityWarningsArgs {
  attendingPlayers: Array<{ id: string; first_name: string; last_name: string }>
  inningsCount: number
  weights: EquityWeights | null | undefined
  positionCategories: PositionCategories | null | undefined
  positionAssignments: Array<{ inning: number; player_id: string; position: string }>
}

export function useEquityWarnings({
  attendingPlayers,
  inningsCount,
  weights,
  positionCategories,
  positionAssignments,
}: UseEquityWarningsArgs): EquityWarning[] {
  return useMemo(() => {
    if (!weights || !positionCategories) return []
    const playerNames: Record<string, string> = {}
    for (const p of attendingPlayers) {
      playerNames[p.id] = `${p.first_name} ${p.last_name}`
    }
    return calculateGameEquityWarnings({
      attendingPlayerIds: attendingPlayers.map((p) => p.id),
      playerNames,
      inningsCount,
      weights,
      positionCategories,
      assignments: positionAssignments,
    })
  }, [attendingPlayers, inningsCount, weights, positionCategories, positionAssignments])
}
