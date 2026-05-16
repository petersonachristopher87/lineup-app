import { useEffect } from 'react'

export interface PickerPlayer {
  id: string
  first_name: string
  last_name: string
  jersey_number: string | null
  restricted_positions?: string[] | null
}

interface Props {
  open: boolean
  inning: number
  position: string
  /** Players currently in attendance (in batting order). */
  attendingPlayers: PickerPlayer[]
  /** Map of player_id → position for `inning`, including bench slots. */
  currentInningPositions: Map<string, string>
  /** Bench-slot codes (e.g. BENCH, BENCH2) so we can collapse them to "Bench". */
  benchCodes: Set<string>
  onSwap: (playerId: string) => void
  onClose: () => void
}

export function PlayerPickerSheet({
  open,
  inning,
  position,
  attendingPlayers,
  currentInningPositions,
  benchCodes,
  onSwap,
  onClose,
}: Props) {
  // Close on Escape for the rare case a phone-keyboard user hits Esc.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isPosBench = benchCodes.has(position)
  const headline = isPosBench
    ? `Pick a player for bench — Inning ${inning}`
    : `Pick a player for ${position} — Inning ${inning}`

  // Partition the attending list: eligible (not restricted from this position),
  // and restricted (greyed out). Bench targets have no restrictions.
  const eligible: PickerPlayer[] = []
  const restricted: PickerPlayer[] = []
  for (const p of attendingPlayers) {
    if (!isPosBench && p.restricted_positions?.includes(position)) {
      restricted.push(p)
    } else {
      eligible.push(p)
    }
  }

  const labelForCurrent = (playerId: string) => {
    const pos = currentInningPositions.get(playerId)
    if (!pos) return 'unassigned'
    if (benchCodes.has(pos)) return 'on bench'
    return `currently ${pos}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-xl shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{headline}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <ul className="overflow-y-auto divide-y divide-gray-100">
          {eligible.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSwap(p.id)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-blue-50 active:bg-blue-100"
              >
                <span className="text-gray-900 font-medium truncate">
                  {p.jersey_number && (
                    <span className="text-gray-500 mr-1">#{p.jersey_number}</span>
                  )}
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-xs text-gray-600 flex-shrink-0">
                  {labelForCurrent(p.id)}
                </span>
              </button>
            </li>
          ))}
          {restricted.length > 0 && (
            <li className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-500 bg-gray-50">
              Restricted from {position}
            </li>
          )}
          {restricted.map((p) => (
            <li
              key={p.id}
              className="px-4 py-3 flex items-center justify-between gap-3 text-gray-400"
            >
              <span className="font-medium truncate">
                {p.jersey_number && (
                  <span className="mr-1">#{p.jersey_number}</span>
                )}
                {p.first_name} {p.last_name}
              </span>
              <span className="text-xs flex-shrink-0">
                can't play {position}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
