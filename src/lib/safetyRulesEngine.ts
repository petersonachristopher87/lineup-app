export interface RestDayRule {
  min_pitches: number
  max_pitches: number
  rest_days: number
}

export interface PitchCountLimit {
  ageMin: number
  ageMax: number
  max_pitches: number
}

export interface SafetyRules {
  pitch_count_limits: PitchCountLimit[]
  rest_day_ladder: RestDayRule[]
}

export interface PitchLogEntry {
  player_id: string
  pitch_count: number
  pitched_at: string // ISO date
}

export interface SafetyBlock {
  playerId: string
  playerName: string
  reason: 'rest_required'
  message: string
  pitchCount?: number
  daysAgo?: number
  daysRemaining?: number
  // When the block lifts
  eligibleOn?: string
}

export interface PitcherEligibility {
  playerId: string
  playerName: string
  age: number | null
  dailyMaxPitches: number | null
  recentOuting?: { pitchCount: number; daysAgo: number }
  status: 'available' | 'rest_required'
  restRequiredUntil?: string
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysBetween(a: Date, b: Date): number {
  // Use UTC day boundaries so timezone shifts don't add/subtract a day
  const aUtc = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())
  const bUtc = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate())
  return Math.round((bUtc - aUtc) / MS_PER_DAY)
}

function requiredRestDays(pitchCount: number, ladder: RestDayRule[]): number {
  for (const rule of ladder) {
    if (pitchCount >= rule.min_pitches && pitchCount <= rule.max_pitches) {
      return rule.rest_days
    }
  }
  return 0
}

export function ageOnDate(birthYear: number, onDate: Date): number {
  // Approximate — uses the season year, not the actual birthday. Good enough for
  // looking up a Little League age bracket without a full DOB.
  return onDate.getUTCFullYear() - birthYear
}

export function pitchCountLimitForAge(
  age: number,
  limits: PitchCountLimit[]
): number | null {
  for (const limit of limits) {
    if (age >= limit.ageMin && age <= limit.ageMax) {
      return limit.max_pitches
    }
  }
  return null
}

export interface EligibilityPlayer {
  id: string
  name: string
  birth_year: number | null
}

export function calculatePitcherEligibility(
  players: EligibilityPlayer[],
  pitchLog: PitchLogEntry[],
  rules: SafetyRules,
  gameDate: Date
): PitcherEligibility[] {
  const ladder = rules.rest_day_ladder ?? []
  const limits = rules.pitch_count_limits ?? []

  const lastOutingByPlayer = new Map<string, PitchLogEntry>()
  for (const entry of pitchLog) {
    const existing = lastOutingByPlayer.get(entry.player_id)
    if (!existing || entry.pitched_at > existing.pitched_at) {
      lastOutingByPlayer.set(entry.player_id, entry)
    }
  }

  const result: PitcherEligibility[] = []
  for (const p of players) {
    const age = p.birth_year ? ageOnDate(p.birth_year, gameDate) : null
    const dailyMax = age != null ? pitchCountLimitForAge(age, limits) : null
    const outing = lastOutingByPlayer.get(p.id)

    let status: PitcherEligibility['status'] = 'available'
    let restRequiredUntil: string | undefined
    let recentOuting: PitcherEligibility['recentOuting']

    if (outing) {
      const lastDate = new Date(outing.pitched_at)
      const daysSince = daysBetween(lastDate, gameDate)
      const restNeeded = requiredRestDays(outing.pitch_count, ladder)
      recentOuting = { pitchCount: outing.pitch_count, daysAgo: daysSince }
      if (daysSince < restNeeded) {
        status = 'rest_required'
        restRequiredUntil = new Date(
          lastDate.getTime() + restNeeded * MS_PER_DAY
        )
          .toISOString()
          .slice(0, 10)
      }
    }

    result.push({
      playerId: p.id,
      playerName: p.name,
      age,
      dailyMaxPitches: dailyMax,
      recentOuting,
      status,
      restRequiredUntil,
    })
  }

  return result
}

/**
 * Find players who cannot pitch on `gameDate` based on rest-day rules.
 * Looks at each player's most recent pitching outing in pitchLog.
 */
export function calculatePitchingBlocks(
  pitchLog: PitchLogEntry[],
  rules: SafetyRules,
  gameDate: Date,
  playerNames: Record<string, string>
): SafetyBlock[] {
  const ladder = rules.rest_day_ladder ?? []
  if (ladder.length === 0) return []

  const lastOutingByPlayer = new Map<string, PitchLogEntry>()
  for (const entry of pitchLog) {
    const existing = lastOutingByPlayer.get(entry.player_id)
    if (!existing || entry.pitched_at > existing.pitched_at) {
      lastOutingByPlayer.set(entry.player_id, entry)
    }
  }

  const blocks: SafetyBlock[] = []
  for (const [playerId, outing] of lastOutingByPlayer) {
    const lastPitchDate = new Date(outing.pitched_at)
    const daysSince = daysBetween(lastPitchDate, gameDate)
    const restNeeded = requiredRestDays(outing.pitch_count, ladder)
    if (daysSince < restNeeded) {
      const eligibleDate = new Date(lastPitchDate.getTime() + restNeeded * MS_PER_DAY)
      const eligibleIso = eligibleDate.toISOString().slice(0, 10)
      const name = playerNames[playerId] ?? 'Player'
      const remaining = restNeeded - daysSince
      blocks.push({
        playerId,
        playerName: name,
        reason: 'rest_required',
        pitchCount: outing.pitch_count,
        daysAgo: daysSince,
        daysRemaining: remaining,
        eligibleOn: eligibleIso,
        message: `${name} threw ${outing.pitch_count} pitches ${daysSince}d ago — needs ${remaining} more rest day${remaining === 1 ? '' : 's'} (eligible ${eligibleIso})`,
      })
    }
  }

  return blocks
}
