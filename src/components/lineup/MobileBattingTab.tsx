import type { Database } from '@/types/supabase'

type Player = Database['public']['Tables']['players']['Row']

interface Props {
  /** Player ids in current batting order. */
  battingOrder: string[]
  playersById: Map<string, Player>
  /** Players not currently batting (absent / maybe / not_set). */
  notBattingPlayers: Player[]
  /** Called when the coach reorders. Parent saves via updateLineup. */
  onSaveOrder: (next: string[]) => void
  /**
   * Called when the coach taps "+ Add" on a non-attending player. Parent
   * is expected to (a) mark them attending and (b) append them to the
   * batting order.
   */
  onAddToLineup: (playerId: string) => void
}

function playerLabel(p: Player): { jersey: string | null; name: string } {
  return {
    jersey: p.jersey_number,
    name: `${p.first_name} ${p.last_name}`,
  }
}

export function MobileBattingTab({
  battingOrder,
  playersById,
  notBattingPlayers,
  onSaveOrder,
  onAddToLineup,
}: Props) {
  const move = (idx: number, direction: -1 | 1) => {
    const target = idx + direction
    if (target < 0 || target >= battingOrder.length) return
    const next = [...battingOrder]
    const tmp = next[idx]
    next[idx] = next[target]
    next[target] = tmp
    onSaveOrder(next)
  }

  return (
    <div className="px-3 py-3">
      <ol className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {battingOrder.length === 0 ? (
          <li className="px-4 py-4 text-sm text-gray-700 text-center">
            No batters yet. Add players from below or mark attendance first.
          </li>
        ) : (
          battingOrder.map((playerId, idx) => {
            const p = playersById.get(playerId)
            if (!p) return null
            const { jersey, name } = playerLabel(p)
            const isFirst = idx === 0
            const isLast = idx === battingOrder.length - 1
            return (
              <li
                key={playerId}
                className="flex items-center gap-2 px-3 py-2"
              >
                <span className="w-6 text-right text-sm font-bold text-gray-700 tabular-nums">
                  {idx + 1}.
                </span>
                <span className="flex-1 min-w-0">
                  {jersey && (
                    <span className="text-gray-500 mr-1">#{jersey}</span>
                  )}
                  <span className="font-medium text-gray-900">{name}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Move ${name} up`}
                  disabled={isFirst}
                  onClick={() => move(idx, -1)}
                  className="w-11 h-11 flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  <span className="text-lg">▲</span>
                </button>
                <button
                  type="button"
                  aria-label={`Move ${name} down`}
                  disabled={isLast}
                  onClick={() => move(idx, 1)}
                  className="w-11 h-11 flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  <span className="text-lg">▼</span>
                </button>
              </li>
            )
          })
        )}
      </ol>

      {notBattingPlayers.length > 0 && (
        <div className="mt-4">
          <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-wide text-gray-600">
            Not batting
          </h3>
          <ul className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {notBattingPlayers.map((p) => {
              const { jersey, name } = playerLabel(p)
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <span className="flex-1 min-w-0">
                    {jersey && (
                      <span className="text-gray-500 mr-1">#{jersey}</span>
                    )}
                    <span className="font-medium text-gray-900">{name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddToLineup(p.id)}
                    className="px-3 h-9 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                  >
                    + Add
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
