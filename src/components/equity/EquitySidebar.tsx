import type { EquityWarning, PlayerCategoryCounts } from '@/lib/equityEngine'

interface EquitySidebarProps {
  warnings: EquityWarning[]
  playerNames: Record<string, string>
  categoryCounts: PlayerCategoryCounts[]
  show: boolean
  onToggle: () => void
}

const TYPE_ICON: Record<EquityWarning['type'], string> = {
  bench_streak: '🪑',
  position_repeat: '🔁',
  category_gap: '⚖️',
  playing_time_gap: '⏱️',
}

const TYPE_LABEL: Record<EquityWarning['type'], string> = {
  bench_streak: 'Bench streak',
  position_repeat: 'Same position',
  category_gap: 'Missing category',
  playing_time_gap: 'Below team avg',
}

export function EquitySidebar({
  warnings,
  playerNames,
  categoryCounts,
  show,
  onToggle,
}: EquitySidebarProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
          Equity
          {warnings.length > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold text-gray-500 normal-case tracking-normal">
              ({warnings.length})
            </span>
          )}
        </h2>
        <button
          onClick={onToggle}
          aria-label={show ? 'Hide equity panel' : 'Show equity panel'}
          title={show ? 'Hide equity panel' : 'Show equity panel'}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          {show ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      </div>

      {show && (
        <div className="px-3 pb-3 space-y-3">
          {categoryCounts.length > 0 && (
            <div>
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 gap-y-0.5 items-baseline text-[11px]">
                <span className="font-semibold uppercase tracking-wide text-gray-600 text-[10px]">
                  Player
                </span>
                <span
                  className="font-semibold text-yellow-900 bg-yellow-200 text-center px-1 rounded text-[10px]"
                  title="Battery"
                >
                  B
                </span>
                <span
                  className="font-semibold text-blue-900 bg-blue-200 text-center px-1 rounded text-[10px]"
                  title="Infield"
                >
                  I
                </span>
                <span
                  className="font-semibold text-green-900 bg-green-200 text-center px-1 rounded text-[10px]"
                  title="Outfield"
                >
                  O
                </span>
                <span
                  className="font-semibold text-gray-900 bg-gray-200 text-center px-1 rounded text-[10px]"
                  title="Bench"
                >
                  X
                </span>
                {categoryCounts.map((c) => {
                  const playerWarnings = warnings.filter(
                    (w) => w.playerId === c.playerId
                  )
                  return (
                    <CategoryRow
                      key={c.playerId}
                      name={playerNames[c.playerId] ?? 'Player'}
                      counts={c}
                      warnings={playerWarnings}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Key / legend */}
          <div className="border-t border-gray-200 pt-2 space-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-0.5">
                Positions
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-700">
                <div>
                  <span className="font-mono text-yellow-900 bg-yellow-200 px-1 rounded mr-1">B</span>
                  Battery
                </div>
                <div>
                  <span className="font-mono text-blue-900 bg-blue-200 px-1 rounded mr-1">I</span>
                  Infield
                </div>
                <div>
                  <span className="font-mono text-green-900 bg-green-200 px-1 rounded mr-1">O</span>
                  Outfield
                </div>
                <div>
                  <span className="font-mono text-gray-900 bg-gray-200 px-1 rounded mr-1">X</span>
                  Bench
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-0.5">
                Warnings
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-700">
                {(Object.keys(TYPE_LABEL) as Array<EquityWarning['type']>).map(
                  (type) => (
                    <div
                      key={type}
                      className="min-w-0 flex items-baseline gap-1 whitespace-nowrap overflow-hidden"
                    >
                      <span className="flex-shrink-0">{TYPE_ICON[type]}</span>
                      <span className="truncate">{TYPE_LABEL[type]}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryRow({
  name,
  counts,
  warnings,
}: {
  name: string
  counts: PlayerCategoryCounts
  warnings: EquityWarning[]
}) {
  const cell = (n: number, base: string) =>
    `text-center font-mono ${n > 0 ? base : 'text-gray-400'}`
  return (
    <>
      <span className="text-gray-900 font-medium flex items-baseline gap-1 min-w-0 text-left">
        <span className="truncate text-left">{name}</span>
        {warnings.map((w, idx) => (
          <span
            key={`${w.type}-${idx}`}
            title={w.message}
            className={`flex-shrink-0 px-1 rounded text-[10px] leading-tight ${
              w.severity === 'warning'
                ? 'bg-yellow-200 text-yellow-900'
                : 'bg-blue-100 text-blue-900'
            }`}
          >
            {TYPE_ICON[w.type]}
          </span>
        ))}
      </span>
      <span className={cell(counts.battery, 'text-yellow-900')}>
        {counts.battery}
      </span>
      <span className={cell(counts.infield, 'text-blue-900')}>
        {counts.infield}
      </span>
      <span className={cell(counts.outfield, 'text-green-900')}>
        {counts.outfield}
      </span>
      <span className={cell(counts.bench, 'text-gray-700')}>{counts.bench}</span>
    </>
  )
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.6}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  )
}

function EyeSlashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.6}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  )
}
