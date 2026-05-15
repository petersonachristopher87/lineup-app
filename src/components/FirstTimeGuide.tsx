import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

interface Step {
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Lineup Manager',
    body:
      "This walkthrough takes about a minute. We'll cover the full flow: team → roster → games → attendance → lineup → print. You can reopen it anytime from the profile menu (top right) → Show guide.",
  },
  {
    title: '1. Create your team',
    body:
      "From the Dashboard, click Create Team. Pick a name, league level (A through Majors), sport (baseball or softball), and season year. Each level seeds team-wide defaults — innings per game, equity weights, pitch count limits, position groupings. You can override any of these later from Settings.",
  },
  {
    title: '2. Add players to the roster',
    body:
      "Open the team and click Roster. Add each player with their jersey number, birth year (used for pitch limits), preferred positions (soft hint), and any restricted positions (hard limit). Use Select all / None to fill the position checkboxes quickly. Click Edit on a row to update later.",
  },
  {
    title: '3. Schedule a game',
    body:
      "Open the team's Games tile and click Create Game. Set opponent, date, time, location, and innings. The game card has a gear icon to edit later, plus quick-jump buttons to Attendance and Lineup. Click Mark Complete after the game and enter how many innings actually played to feed season stats.",
  },
  {
    title: '4. Set attendance',
    body:
      "Open the game's Attendance tab. Each player starts as Not set — pick ✓ Attending, ? Maybe, or ✗ Absent. Use Mark all if everyone's confirmed up front. Players need to be Attending to show up in the lineup; you can drag a Maybe/Absent player straight into the lineup later to flip them.",
  },
  {
    title: '5. Plan the lineup',
    body:
      "Open Plan Lineup. The Batting Order is on the left — drag rows to reorder, or click ✨ Prefill to seed by jersey number. The Position Assignments grid covers every inning; click any cell to pick a player. Restricted positions are filtered out automatically. Equity and Safety panels show live warnings as you fill the grid.",
  },
  {
    title: '6. Print and share',
    body:
      "Hit the 🖨 print icon top-right of the Lineup page. You'll get two pages: a clean batting order with opponent and date, plus a field diagram with each defensive position card showing every inning's player. Bench and Rapid Pitch slots show up in the Dugout strip below the field.",
  },
  {
    title: "You're set",
    body:
      'That covers the whole flow. Profile menu (top right) → Show guide reopens this anytime. Happy coaching.',
  },
]

export function FirstTimeGuide({ open, onClose }: Props) {
  const [step, setStep] = useState(0)

  // Reset to the beginning every time the guide reopens so users always
  // start at step 1, not where they left off last time.
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4 border-b border-gray-200 text-center">
          {step === 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              First time?
            </p>
          )}
          <h2 className="text-lg font-bold text-gray-900 mt-0.5">
            {current.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{current.body}</p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-blue-600'
                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-3 py-1.5 text-sm font-semibold text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          <span className="text-xs text-gray-600">
            {step + 1} of {STEPS.length}
          </span>
          {isLast ? (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              Got it
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
