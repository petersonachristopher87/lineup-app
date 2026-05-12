export type EquityWeight = 'none' | 'low' | 'medium' | 'high'

export interface EquityWeights {
  playing_time: EquityWeight
  position_variety: EquityWeight
  batting_order_rotation: EquityWeight
  infield_outfield_balance: EquityWeight
}

export interface PositionCategories {
  battery: string[]
  infield: string[]
  outfield: string[]
  bench: string[]
}

export type PositionCategory = keyof PositionCategories

export type EquityWarningType =
  | 'bench_streak'
  | 'position_repeat'
  | 'category_gap'
  | 'playing_time_gap'

export interface EquityWarning {
  playerId: string
  type: EquityWarningType
  severity: 'info' | 'warning'
  message: string
  inning?: number
  position?: string
  category?: PositionCategory
}

export interface EquityAssignment {
  inning: number
  player_id: string
  position: string
}

export interface EquityContext {
  attendingPlayerIds: string[]
  playerNames: Record<string, string>
  inningsCount: number
  weights: EquityWeights
  positionCategories: PositionCategories
  assignments: EquityAssignment[]
}

const BENCH_STREAK_THRESHOLD: Record<EquityWeight, number> = {
  high: 2,
  medium: 3,
  low: 4,
  none: Infinity,
}

const POSITION_REPEAT_THRESHOLD: Record<EquityWeight, number> = {
  high: 3,
  medium: 4,
  low: 5,
  none: Infinity,
}

const PLAYING_TIME_GAP_DELTA: Record<EquityWeight, number> = {
  high: 2,
  medium: 3,
  low: 4,
  none: Infinity,
}

export function categoryForPosition(
  position: string,
  categories: PositionCategories
): PositionCategory | null {
  if (categories.battery.includes(position)) return 'battery'
  if (categories.infield.includes(position)) return 'infield'
  if (categories.outfield.includes(position)) return 'outfield'
  if (categories.bench.includes(position)) return 'bench'
  return null
}

function buildPlayerInningMap(
  assignments: EquityAssignment[]
): Map<string, Map<number, string>> {
  const map = new Map<string, Map<number, string>>()
  for (const a of assignments) {
    if (!map.has(a.player_id)) map.set(a.player_id, new Map())
    map.get(a.player_id)!.set(a.inning, a.position)
  }
  return map
}

export function calculateGameEquityWarnings(ctx: EquityContext): EquityWarning[] {
  const warnings: EquityWarning[] = []
  const inningMap = buildPlayerInningMap(ctx.assignments)
  const fieldingPerPlayer: Record<string, number> = {}

  for (const playerId of ctx.attendingPlayerIds) {
    const innings = inningMap.get(playerId) ?? new Map()

    let benchStreak = 0
    let lastPosition: string | null = null
    let positionStreak = 0
    let fieldingInnings = 0
    const playedCategories = new Set<PositionCategory>()

    for (let i = 1; i <= ctx.inningsCount; i++) {
      const pos = innings.get(i) ?? null
      const cat = pos ? categoryForPosition(pos, ctx.positionCategories) : null

      if (cat && cat !== 'bench') {
        playedCategories.add(cat)
        fieldingInnings += 1
      }

      // Bench streak
      if (!pos || cat === 'bench') {
        benchStreak += 1
        const threshold = BENCH_STREAK_THRESHOLD[ctx.weights.playing_time]
        if (benchStreak === threshold && threshold !== Infinity) {
          warnings.push({
            playerId,
            type: 'bench_streak',
            severity: 'warning',
            inning: i,
            message: `benched ${benchStreak} innings in a row`,
          })
        }
      } else {
        benchStreak = 0
      }

      // Position repeat (same exact position)
      if (pos && pos === lastPosition) {
        positionStreak += 1
        const threshold = POSITION_REPEAT_THRESHOLD[ctx.weights.position_variety]
        if (positionStreak === threshold && threshold !== Infinity) {
          warnings.push({
            playerId,
            type: 'position_repeat',
            severity: 'info',
            inning: i,
            position: pos,
            message: `at ${pos} for ${positionStreak} innings straight`,
          })
        }
      } else if (pos) {
        positionStreak = 1
      } else {
        positionStreak = 0
        lastPosition = null
      }
      if (pos) lastPosition = pos
    }

    fieldingPerPlayer[playerId] = fieldingInnings

    // Category gap (only meaningful after halfway through the game)
    const halfway = Math.ceil(ctx.inningsCount / 2)
    const lastAssignedInning = Math.max(0, ...Array.from(innings.keys()))
    if (lastAssignedInning >= halfway) {
      const balanceWeight = ctx.weights.infield_outfield_balance
      if (balanceWeight !== 'none' && balanceWeight !== 'low') {
        for (const requiredCat of ['infield', 'outfield'] as PositionCategory[]) {
          if (!playedCategories.has(requiredCat) && fieldingInnings > 0) {
            warnings.push({
              playerId,
              type: 'category_gap',
              severity: 'info',
              category: requiredCat,
              message: `no ${requiredCat} innings yet`,
            })
          }
        }
      }
    }
  }

  // Playing time gap (compare each player's fielding innings to team avg)
  const fieldingValues = Object.values(fieldingPerPlayer)
  if (fieldingValues.length > 0) {
    const avg =
      fieldingValues.reduce((sum, n) => sum + n, 0) / fieldingValues.length
    const delta = PLAYING_TIME_GAP_DELTA[ctx.weights.playing_time]
    if (delta !== Infinity) {
      for (const [playerId, count] of Object.entries(fieldingPerPlayer)) {
        if (avg - count >= delta) {
          warnings.push({
            playerId,
            type: 'playing_time_gap',
            severity: 'warning',
            message: `${count} fielding innings (avg ${avg.toFixed(1)})`,
          })
        }
      }
    }
  }

  return warnings
}

export function groupWarningsByPlayer(
  warnings: EquityWarning[]
): Map<string, EquityWarning[]> {
  const grouped = new Map<string, EquityWarning[]>()
  for (const w of warnings) {
    if (!grouped.has(w.playerId)) grouped.set(w.playerId, [])
    grouped.get(w.playerId)!.push(w)
  }
  return grouped
}

export interface PlayerCategoryCounts {
  playerId: string
  battery: number
  infield: number
  outfield: number
  bench: number
}

export function calculatePlayerCategoryCounts(
  attendingPlayerIds: string[],
  assignments: EquityAssignment[],
  positionCategories: PositionCategories
): PlayerCategoryCounts[] {
  const map: Record<string, PlayerCategoryCounts> = {}
  for (const id of attendingPlayerIds) {
    map[id] = { playerId: id, battery: 0, infield: 0, outfield: 0, bench: 0 }
  }
  for (const a of assignments) {
    if (!map[a.player_id]) continue
    const cat = categoryForPosition(a.position, positionCategories)
    if (cat) map[a.player_id][cat] += 1
  }
  return attendingPlayerIds.map((id) => map[id])
}
