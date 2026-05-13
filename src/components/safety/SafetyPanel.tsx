import type { SafetyBlock, PitcherEligibility } from '@/lib/safetyRulesEngine'

interface SafetyPanelProps {
  blocks: SafetyBlock[]
  eligibility?: PitcherEligibility[]
  show: boolean
  onToggle: () => void
}

export function SafetyPanel({
  blocks,
  eligibility = [],
  show,
  onToggle,
}: SafetyPanelProps) {
  const eligibleToPitch = eligibility.filter((e) => e.status === 'available')
  const hasContent = blocks.length > 0 || eligibleToPitch.length > 0

  return (
    <div className="bg-white rounded-lg shadow border-l-4 border-red-500">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
          Safety
          {blocks.length > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold text-red-700 normal-case tracking-normal">
              ({blocks.length} blocked)
            </span>
          )}
        </h2>
        <button
          onClick={onToggle}
          aria-label={show ? 'Hide safety panel' : 'Show safety panel'}
          title={show ? 'Hide safety panel' : 'Show safety panel'}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          {show ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      </div>

      {show && (
        <div className="px-3 pb-3 space-y-2">
          {!hasContent ? (
            <p className="text-[11px] text-gray-600">No pitcher concerns.</p>
          ) : (
            <>
              {blocks.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700 mb-1">
                    Blocked — rest required
                  </p>
                  <ul className="space-y-1">
                    {blocks.map((b) => (
                      <li
                        key={`${b.playerId}-${b.reason}`}
                        className="text-[11px] leading-snug text-left bg-red-50 border border-red-200 rounded px-1.5 py-1"
                        title={b.message}
                      >
                        <span className="mr-1">🚫</span>
                        <span className="font-semibold text-gray-900">
                          {b.playerName}
                        </span>
                        {b.pitchCount != null && b.daysAgo != null && (
                          <span className="text-red-900">
                            {' '}
                            — pitched {b.pitchCount} pitches {b.daysAgo}d ago
                          </span>
                        )}
                        {b.daysRemaining != null && b.daysRemaining > 0 && (
                          <span className="text-red-700">
                            , needs {b.daysRemaining} more rest day
                            {b.daysRemaining === 1 ? '' : 's'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {eligibleToPitch.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-1">
                    Eligible pitchers
                  </p>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-0.5 items-baseline text-[11px]">
                    {eligibleToPitch.map((e) => (
                      <div key={e.playerId} className="contents">
                        <span className="text-gray-900 font-medium truncate text-left">
                          {e.playerName}
                        </span>
                        <span className="text-gray-700 font-mono text-[10px] whitespace-nowrap">
                          {e.age != null ? `${e.age}y` : '—'}
                        </span>
                        <span className="text-gray-700 font-mono text-[10px] whitespace-nowrap">
                          {e.dailyMaxPitches != null
                            ? `${e.dailyMaxPitches}p`
                            : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
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
