import {
  categoryForPosition,
  type PositionCategories,
  type PositionCategory,
} from './equityEngine'

export interface AutoFillPlayer {
  id: string
  first_name: string
  last_name: string
  jersey_number: string | null
  preferred_positions: string[] | null
  restricted_positions: string[] | null
}

export interface AutoFillContext {
  attendingPlayers: AutoFillPlayer[]
  inningsCount: number
  /** Ordered list of positions present on the team (battery → infield → outfield → bench). */
  positions: string[]
  positionCategories: PositionCategories
  blockedPitcherIds: Set<string>
}

export interface AutoFillAssignment {
  inning: number
  player_id: string
  position: string
}

/**
 * First-game-of-season batting order: lowest jersey number first, with
 * jersey-less players sorted alphabetically at the end.
 */
export function autoFillBattingOrder(players: AutoFillPlayer[]): string[] {
  return [...players]
    .sort((a, b) => {
      const aNum = parseInt(a.jersey_number ?? '', 10)
      const bNum = parseInt(b.jersey_number ?? '', 10)
      const aHas = Number.isFinite(aNum)
      const bHas = Number.isFinite(bNum)
      if (aHas && bHas) {
        if (aNum !== bNum) return aNum - bNum
        return a.last_name.localeCompare(b.last_name)
      }
      if (aHas) return -1
      if (bHas) return 1
      return a.last_name.localeCompare(b.last_name)
    })
    .map((p) => p.id)
}

interface PlayerStats {
  benchStreak: number
  lastPos: string | null
  positionCounts: Record<string, number>
  categoryCounts: Record<PositionCategory, number>
  fieldingInnings: number
}

function scorePlayerForPosition(
  player: AutoFillPlayer,
  position: string,
  category: PositionCategory,
  stats: PlayerStats,
  inning: number,
  inningsCount: number
): number {
  let score = 0

  // Player preference (medium signal)
  if (player.preferred_positions?.includes(position)) score += 5

  // PLAYING TIME — minimize bench_streak warnings
  // The longer they've been benched, the higher priority to field them now.
  // The equity engine warns at 2+ consecutive bench innings (high weight),
  // so weight this heavily.
  score += stats.benchStreak * 12

  // POSITION VARIETY — minimize position_repeat warnings
  // Hard penalty for the exact same position back-to-back, plus a softer
  // penalty for over-using one position across the whole game.
  if (stats.lastPos === position) score -= 18
  score -= (stats.positionCounts[position] ?? 0) * 5

  // CATEGORY VARIETY — minimize category_gap warnings
  // The engine fires after halfway through the game if a player hasn't
  // touched infield or outfield, so escalate that bonus as we cross halftime.
  if ((stats.categoryCounts[category] ?? 0) === 0) {
    const halfway = Math.ceil(inningsCount / 2)
    score += inning >= halfway ? 18 : 8
  }

  // PLAYING TIME BALANCE — minimize playing_time_gap warnings
  // Players with fewer fielding innings get priority. Linear penalty so a
  // player at 1 inning beats a player at 3, etc.
  score -= stats.fieldingInnings * 2.5

  // Tiny random tie-breaker so identical scores don't always pick the same
  // player on every retry
  score += Math.random() * 0.3

  return score
}

/**
 * Greedy equity-aware position fill for a single game.
 * Assigns every attending player a position in every inning (fielding or
 * bench). Honors safety blocks for the P slot.
 */
export function autoFillPositions(ctx: AutoFillContext): AutoFillAssignment[] {
  const assignments: AutoFillAssignment[] = []
  const stats: Record<string, PlayerStats> = {}

  for (const p of ctx.attendingPlayers) {
    stats[p.id] = {
      benchStreak: 0,
      lastPos: null,
      positionCounts: {},
      categoryCounts: { battery: 0, infield: 0, outfield: 0, bench: 0 },
      fieldingInnings: 0,
    }
  }

  const benchSet = new Set(ctx.positionCategories.bench)
  const fieldingPositions = ctx.positions.filter((p) => !benchSet.has(p))
  const benchPositions = ctx.positions.filter((p) => benchSet.has(p))

  for (let inning = 1; inning <= ctx.inningsCount; inning++) {
    const used = new Set<string>()

    for (const position of fieldingPositions) {
      const cat = categoryForPosition(position, ctx.positionCategories)
      if (!cat || cat === 'bench') continue

      const candidates = ctx.attendingPlayers
        .filter((p) => !used.has(p.id))
        .filter((p) => position !== 'P' || !ctx.blockedPitcherIds.has(p.id))
        .filter((p) => !p.restricted_positions?.includes(position))

      if (candidates.length === 0) continue

      const ranked = candidates
        .map((p) => ({
          player: p,
          score: scorePlayerForPosition(
            p,
            position,
            cat,
            stats[p.id],
            inning,
            ctx.inningsCount
          ),
        }))
        .sort((a, b) => b.score - a.score)

      const chosen = ranked[0].player
      assignments.push({ inning, player_id: chosen.id, position })
      used.add(chosen.id)

      const s = stats[chosen.id]
      s.benchStreak = 0
      s.lastPos = position
      s.fieldingInnings += 1
      s.positionCounts[position] = (s.positionCounts[position] ?? 0) + 1
      s.categoryCounts[cat] = (s.categoryCounts[cat] ?? 0) + 1
    }

    // Distribute remaining attending players across bench slots — prefer
    // players who've sat the LEAST so far so we don't keep benching the same
    // people game-long. (Minimizes bench_streak / playing_time_gap.)
    const remaining = ctx.attendingPlayers
      .filter((p) => !used.has(p.id))
      .sort((a, b) => {
        const aBench = stats[a.id].categoryCounts.bench ?? 0
        const bBench = stats[b.id].categoryCounts.bench ?? 0
        return aBench - bBench
      })
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i]
      // BENCH1/2/3 are unique-per-inning by the partial unique constraint —
      // only the literal 'BENCH' position allows multiple players per inning.
      // If we overflow past the available numbered slots, route the rest to
      // 'BENCH' so the upsert doesn't 409.
      const benchPos = benchPositions[i] ?? 'BENCH'
      assignments.push({ inning, player_id: p.id, position: benchPos })

      const s = stats[p.id]
      s.benchStreak += 1
      s.lastPos = null
      s.categoryCounts.bench = (s.categoryCounts.bench ?? 0) + 1
    }
  }

  return assignments
}
