import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateGame } from '@/hooks/useGames'
import { positionAssignmentService } from '@/lib/supabase/positionAssignmentService'
import { pitchLogService } from '@/lib/supabase/pitchLogService'
import { playerService } from '@/lib/supabase/playerService'

interface Props {
  open: boolean
  game: {
    id: string
    opponent_name: string
    innings_count: number
    game_date: string
  }
  teamId: string
  onClose: () => void
}

interface PitcherCandidate {
  id: string
  name: string
}

export function MarkCompleteDialog({ open, game, teamId, onClose }: Props) {
  const queryClient = useQueryClient()
  const updateGame = useUpdateGame()

  const [innings, setInnings] = useState<number>(game.innings_count ?? 6)
  const [assignments, setAssignments] = useState<
    Array<{ inning: number; position: string; player_id: string }>
  >([])
  const [players, setPlayers] = useState<
    Array<{ id: string; first_name: string; last_name: string }>
  >([])
  const [pitchCounts, setPitchCounts] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reset state every time the dialog opens; also load assignments + roster.
  useEffect(() => {
    if (!open) return
    setInnings(game.innings_count ?? 6)
    setPitchCounts({})
    setLoading(true)
    ;(async () => {
      try {
        const [a, p] = await Promise.all([
          positionAssignmentService.getGamePositionAssignments(game.id),
          playerService.getTeamPlayers(teamId),
        ])
        setAssignments(a as any)
        setPlayers(p as any)
      } catch (err) {
        console.error('Failed to load pitcher data', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [open, game.id, game.innings_count, teamId])

  // Pitchers in the played innings — recomputes as the user adjusts innings.
  const pitchers = useMemo<PitcherCandidate[]>(() => {
    const ids = Array.from(
      new Set(
        assignments
          .filter((a) => a.position === 'P' && a.inning <= innings)
          .map((a) => a.player_id)
      )
    )
    return ids
      .map((id) => {
        const player = players.find((p) => p.id === id)
        return player
          ? { id, name: `${player.first_name} ${player.last_name}` }
          : null
      })
      .filter((x): x is PitcherCandidate => x !== null)
  }, [assignments, players, innings])

  if (!open) return null

  const handleSave = async () => {
    if (!Number.isFinite(innings) || innings < 0) {
      window.alert('Innings must be a non-negative number.')
      return
    }
    setIsSaving(true)
    try {
      await updateGame.mutateAsync({
        gameId: game.id,
        updates: { status: 'complete', innings_played: innings },
      })

      // Build pitch_log entries from any filled-in counts.
      const pitchedAt = new Date(game.game_date).toISOString().slice(0, 10)
      const entries: Array<{
        game_id: string
        player_id: string
        pitch_count: number
        pitched_at: string
      }> = []
      for (const pitcher of pitchers) {
        const raw = pitchCounts[pitcher.id]
        if (raw == null || raw === '') continue
        const count = parseInt(raw, 10)
        if (!Number.isFinite(count) || count < 0) continue
        entries.push({
          game_id: game.id,
          player_id: pitcher.id,
          pitch_count: count,
          pitched_at: pitchedAt,
        })
      }
      if (entries.length > 0) {
        await pitchLogService.insertPitchLog(entries)
        queryClient.invalidateQueries({ queryKey: ['pitchLog', teamId] })
      }
      onClose()
    } catch (err) {
      window.alert(
        `Failed to mark complete: ${err instanceof Error ? err.message : String(err)}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Mark complete: {game.opponent_name}
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Capture innings played and per-pitcher pitch counts for season stats
            and rest-day rules.
          </p>
        </div>

        <div className="px-4 py-3 space-y-3">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">
              Innings played
            </span>
            <input
              type="number"
              min={0}
              max={12}
              value={innings}
              onChange={(e) => setInnings(parseInt(e.target.value) || 0)}
              className="mt-1 w-24 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            />
            <span className="ml-2 text-xs text-gray-600">
              (scheduled for {game.innings_count})
            </span>
          </label>

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Pitch counts
            </p>
            {loading ? (
              <p className="text-xs text-gray-600">Loading pitchers…</p>
            ) : pitchers.length === 0 ? (
              <p className="text-xs text-gray-600">
                No pitchers assigned in innings 1–{innings}.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {pitchers.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-gray-900 font-medium truncate">
                      {p.name}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      placeholder="pitches"
                      value={pitchCounts[p.id] ?? ''}
                      onChange={(e) =>
                        setPitchCounts((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white text-right"
                    />
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              Leave a field blank to skip logging a pitcher (e.g., if it was a
              machine-pitch outing).
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm font-semibold text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Mark complete'}
          </button>
        </div>
      </div>
    </div>
  )
}
