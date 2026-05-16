import { useState } from 'react'
import type { Database } from '@/types/supabase'
import type { EquityWarning } from '@/lib/equityEngine'

type Player = Database['public']['Tables']['players']['Row']

interface Props {
  inningsCount: number
  inningsPlayed: number | null
  viewedInning: number
  onViewInning: (n: number) => void

  /** Ordered position codes (field positions then bench positions). */
  positions: string[]
  benchCodes: Set<string>

  /** player_id → position for the currently viewed inning. */
  inningPositions: Map<string, string>
  playersById: Map<string, Player>
  /** Ordered list of attending player ids (for bench order). */
  attendingPlayerIds: string[]

  /** Warnings relevant to the viewed inning. */
  warnings: EquityWarning[]

  onOpenPicker: (position: string) => void
  onRefillFromHere: () => void
}

export function MobileDefenseTab({
  inningsCount,
  inningsPlayed,
  viewedInning,
  onViewInning,
  positions,
  benchCodes,
  inningPositions,
  playersById,
  attendingPlayerIds,
  warnings,
  onOpenPicker,
  onRefillFromHere,
}: Props) {
  const [warningsExpanded, setWarningsExpanded] = useState(false)

  const fieldPositions = positions.filter((p) => !benchCodes.has(p))
  // Build pos → player_id for field positions in this inning.
  const fieldOccupantByPos = new Map<string, string>()
  for (const [playerId, pos] of inningPositions) {
    if (!benchCodes.has(pos)) fieldOccupantByPos.set(pos, playerId)
  }
  // Bench occupants ordered by attendingPlayerIds.
  const benchOccupants = attendingPlayerIds.filter((id) => {
    const pos = inningPositions.get(id)
    return pos && benchCodes.has(pos)
  })

  // Don't allow refilling already-played innings.
  const refillBlocked =
    inningsPlayed != null && viewedInning <= inningsPlayed

  return (
    <div className="pb-4">
      {/* Inning chip strip */}
      <div className="px-3 pt-3 pb-2 sticky top-[88px] bg-gray-50 z-10">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-600 mr-2 flex-shrink-0">
            Inning
          </span>
          {Array.from({ length: inningsCount }, (_, i) => i + 1).map((n) => {
            const active = n === viewedInning
            const played = inningsPlayed != null && n <= inningsPlayed
            return (
              <button
                key={n}
                type="button"
                onClick={() => onViewInning(n)}
                className={
                  active
                    ? 'w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex-shrink-0'
                    : played
                    ? 'w-9 h-9 rounded-full bg-gray-300 text-gray-700 font-bold text-sm flex-shrink-0'
                    : 'w-9 h-9 rounded-full bg-white border border-gray-300 text-gray-900 font-bold text-sm flex-shrink-0'
                }
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>

      {/* Warnings pill */}
      {warnings.length > 0 && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setWarningsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm"
          >
            <span className="font-semibold">
              ⚠ {warnings.length}{' '}
              {warnings.length === 1 ? 'warning' : 'warnings'} this inning
            </span>
            <span className="text-xs">{warningsExpanded ? 'Hide' : 'Show'}</span>
          </button>
          {warningsExpanded && (
            <ul className="mt-2 space-y-1 px-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-900">
                  • {w.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Field positions */}
      <ul className="mx-3 bg-white rounded-lg shadow divide-y divide-gray-100">
        {fieldPositions.map((pos) => {
          const occupantId = fieldOccupantByPos.get(pos) ?? null
          const occupant = occupantId ? playersById.get(occupantId) : null
          return (
            <li key={pos}>
              <button
                type="button"
                onClick={() => onOpenPicker(pos)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 active:bg-blue-100 min-h-[48px]"
              >
                <span className="w-12 text-xs font-bold uppercase tracking-wide text-gray-700 flex-shrink-0">
                  {pos}
                </span>
                <span className="flex-1 min-w-0">
                  {occupant ? (
                    <>
                      {occupant.jersey_number && (
                        <span className="text-gray-500 mr-1">
                          #{occupant.jersey_number}
                        </span>
                      )}
                      <span className="font-medium text-gray-900">
                        {occupant.first_name} {occupant.last_name}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">empty</span>
                  )}
                </span>
                <span className="text-gray-400 flex-shrink-0">›</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Bench */}
      <div className="mx-3 mt-3">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-600">
          Bench
        </h3>
        {benchOccupants.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No one on bench.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {benchOccupants.map((id) => {
              const p = playersById.get(id)
              if (!p) return null
              return (
                <span
                  key={id}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-200 text-gray-900 text-sm"
                >
                  {p.jersey_number && (
                    <span className="text-gray-600 mr-1">
                      #{p.jersey_number}
                    </span>
                  )}
                  {p.first_name} {p.last_name}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Re-fill action */}
      <div className="mx-3 mt-5">
        <button
          type="button"
          onClick={onRefillFromHere}
          disabled={refillBlocked}
          className="w-full py-3 rounded-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
        >
          ↻ Re-fill innings {viewedInning}–{inningsCount}
        </button>
        {refillBlocked && (
          <p className="mt-1 text-xs text-gray-500 text-center">
            Inning {viewedInning} is already played. Pick a later inning to
            re-fill.
          </p>
        )}
      </div>
    </div>
  )
}
