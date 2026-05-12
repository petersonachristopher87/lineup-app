import { useMemo } from 'react'
import {
  calculatePitchingBlocks,
  calculatePitcherEligibility,
  type SafetyBlock,
  type SafetyRules,
  type PitchLogEntry,
  type PitcherEligibility,
  type EligibilityPlayer,
} from '@/lib/safetyRulesEngine'

interface UseSafetyBlocksArgs {
  pitchLog: PitchLogEntry[]
  rules: SafetyRules | null | undefined
  gameDate: string | null | undefined
  playerNames: Record<string, string>
  /**
   * If provided, blocks for outings that happened in this game itself are
   * dropped — a pitcher's *own* current-game pitches shouldn't block them
   * from continuing this game.
   */
  excludeGameId?: string
  pitchLogWithGameId?: Array<PitchLogEntry & { game_id: string }>
  attendingPitcherCandidates?: EligibilityPlayer[]
}

interface UseSafetyBlocksResult {
  blocks: SafetyBlock[]
  eligibility: PitcherEligibility[]
}

export function useSafetyBlocks({
  pitchLog,
  rules,
  gameDate,
  playerNames,
  excludeGameId,
  pitchLogWithGameId,
  attendingPitcherCandidates,
}: UseSafetyBlocksArgs): UseSafetyBlocksResult {
  return useMemo(() => {
    if (!rules || !gameDate) return { blocks: [], eligibility: [] }

    const filteredLog = excludeGameId && pitchLogWithGameId
      ? pitchLogWithGameId.filter((e) => e.game_id !== excludeGameId)
      : pitchLog

    const date = new Date(gameDate)
    const blocks = calculatePitchingBlocks(filteredLog, rules, date, playerNames)
    const eligibility = attendingPitcherCandidates
      ? calculatePitcherEligibility(
          attendingPitcherCandidates,
          filteredLog,
          rules,
          date
        )
      : []
    return { blocks, eligibility }
  }, [
    pitchLog,
    rules,
    gameDate,
    playerNames,
    excludeGameId,
    pitchLogWithGameId,
    attendingPitcherCandidates,
  ])
}
