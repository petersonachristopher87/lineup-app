import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Database } from '@/types/supabase'
import type { EquityWarning, PositionCategories } from '@/lib/equityEngine'
import { formatDate } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MobileBattingTab } from './MobileBattingTab'
import { MobileDefenseTab } from './MobileDefenseTab'
import { PlayerPickerSheet } from './PlayerPickerSheet'

type Player = Database['public']['Tables']['players']['Row']
type Game = Database['public']['Tables']['games']['Row']
type PositionAssignment =
  Database['public']['Tables']['position_assignments']['Row']

interface Props {
  game: Game
  teamId: string
  attendingPlayers: Player[]
  notBattingPlayers: Player[]
  battingOrder: string[]
  positions: string[]
  positionCategories: PositionCategories
  positionAssignments: PositionAssignment[]
  equityWarnings: EquityWarning[]

  onSaveBattingOrder: (next: string[]) => void
  onAddToLineup: (playerId: string) => void
  /** Set a single (inning, player, position) row. Used twice for a swap. */
  onSetPosition: (inning: number, playerId: string, position: string) => void
  /** Re-run auto-fill from the given inning through the end. */
  onRefillFromInning: (startInning: number) => void
}

type Tab = 'batting' | 'defense'

export function MobileLineup({
  game,
  teamId,
  attendingPlayers,
  notBattingPlayers,
  battingOrder,
  positions,
  positionCategories,
  positionAssignments,
  equityWarnings,
  onSaveBattingOrder,
  onAddToLineup,
  onSetPosition,
  onRefillFromInning,
}: Props) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('batting')

  const inningsCount = game.innings_count ?? 6
  const inningsPlayed = game.innings_played ?? null
  const firstUnplayed = (inningsPlayed ?? 0) + 1
  const [viewedInning, setViewedInning] = useState<number>(
    Math.min(firstUnplayed, inningsCount)
  )

  const benchCodes = useMemo(
    () => new Set(positionCategories.bench),
    [positionCategories]
  )
  const playersById = useMemo(() => {
    const m = new Map<string, Player>()
    for (const p of attendingPlayers) m.set(p.id, p)
    for (const p of notBattingPlayers) m.set(p.id, p)
    return m
  }, [attendingPlayers, notBattingPlayers])

  // Map of inning → (player_id → position) for fast lookups.
  const positionsByInning = useMemo(() => {
    const m = new Map<number, Map<string, string>>()
    for (const a of positionAssignments) {
      if (!m.has(a.inning)) m.set(a.inning, new Map())
      m.get(a.inning)!.set(a.player_id, a.position)
    }
    return m
  }, [positionAssignments])

  const currentInningPositions =
    positionsByInning.get(viewedInning) ?? new Map<string, string>()

  // Warnings scoped to the viewed inning (plus inning-less, game-wide ones).
  const warningsForInning = useMemo(
    () =>
      equityWarnings.filter(
        (w) => w.inning === viewedInning || w.inning == null
      ),
    [equityWarnings, viewedInning]
  )

  const [pickerPos, setPickerPos] = useState<string | null>(null)
  const [refillConfirmOpen, setRefillConfirmOpen] = useState(false)

  const handleSwap = (pickedPlayerId: string) => {
    if (!pickerPos) return
    const targetPos = pickerPos
    const pickedCurrentPos =
      currentInningPositions.get(pickedPlayerId) ?? null
    // Find who currently occupies the target position (if anyone).
    let displacedPlayerId: string | null = null
    for (const [pid, pos] of currentInningPositions) {
      if (pos === targetPos) {
        displacedPlayerId = pid
        break
      }
    }

    onSetPosition(viewedInning, pickedPlayerId, targetPos)
    if (displacedPlayerId && displacedPlayerId !== pickedPlayerId) {
      // Move the displaced player to wherever the picked player was;
      // default to BENCH if the picked player had no prior assignment.
      const fallback = pickedCurrentPos ?? 'BENCH'
      onSetPosition(viewedInning, displacedPlayerId, fallback)
    }
    setPickerPos(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-3 py-2">
          <button
            type="button"
            onClick={() => navigate(`/team/${teamId}/games`)}
            className="text-blue-700 hover:text-blue-900 text-sm font-semibold"
          >
            ← Games
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              vs {game.opponent_name}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {formatDate(game.game_date)}
              {game.location ? ` · ${game.location}` : ''}
            </p>
          </div>
        </div>
        <div role="tablist" className="flex border-t border-gray-200">
          {(
            [
              ['batting', 'Batting'],
              ['defense', 'Defense'],
            ] as const
          ).map(([key, label]) => {
            const active = tab === key
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={
                  active
                    ? 'flex-1 py-3 text-sm font-bold text-blue-700 border-b-2 border-blue-600'
                    : 'flex-1 py-3 text-sm font-semibold text-gray-600 border-b-2 border-transparent'
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </header>

      <main>
        {tab === 'batting' && (
          <MobileBattingTab
            battingOrder={battingOrder}
            playersById={playersById}
            notBattingPlayers={notBattingPlayers}
            onSaveOrder={onSaveBattingOrder}
            onAddToLineup={onAddToLineup}
          />
        )}
        {tab === 'defense' && (
          <MobileDefenseTab
            inningsCount={inningsCount}
            inningsPlayed={inningsPlayed}
            viewedInning={viewedInning}
            onViewInning={setViewedInning}
            positions={positions}
            benchCodes={benchCodes}
            inningPositions={currentInningPositions}
            playersById={playersById}
            attendingPlayerIds={attendingPlayers.map((p) => p.id)}
            warnings={warningsForInning}
            onOpenPicker={(pos) => setPickerPos(pos)}
            onRefillFromHere={() => setRefillConfirmOpen(true)}
          />
        )}
      </main>

      <PlayerPickerSheet
        open={pickerPos != null}
        inning={viewedInning}
        position={pickerPos ?? ''}
        attendingPlayers={attendingPlayers}
        currentInningPositions={currentInningPositions}
        benchCodes={benchCodes}
        onSwap={handleSwap}
        onClose={() => setPickerPos(null)}
      />

      <ConfirmDialog
        open={refillConfirmOpen}
        title="Re-fill remaining innings?"
        message={`Innings ${viewedInning}–${inningsCount} will be overwritten with auto-filled positions. Already-played innings are kept.`}
        confirmLabel="Re-fill"
        onConfirm={() => {
          setRefillConfirmOpen(false)
          onRefillFromInning(viewedInning)
        }}
        onCancel={() => setRefillConfirmOpen(false)}
      />
    </div>
  )
}
