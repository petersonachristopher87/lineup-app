import { useMemo, useState } from 'react'
import type { PositionCategories } from '@/lib/equityEngine'

type Category = 'battery' | 'infield' | 'outfield' | 'bench'

// Each known abbreviation has a natural baseball category. Coaches just
// toggle yes/no within that section to include/exclude a position.
const NATURAL_CATEGORY: Record<string, Category> = {
  P: 'battery',
  RP: 'battery',
  C: 'battery',
  '1B': 'infield',
  '2B': 'infield',
  '3B': 'infield',
  SS: 'infield',
  LF: 'outfield',
  LCF: 'outfield',
  CF: 'outfield',
  RCF: 'outfield',
  RF: 'outfield',
  BENCH: 'bench',
  BENCH2: 'bench',
  BENCH3: 'bench',
}

const SECTION_ORDER: Category[] = ['battery', 'infield', 'outfield', 'bench']

const SECTION_LABEL: Record<Category, string> = {
  battery: 'Battery',
  infield: 'Infield',
  outfield: 'Outfield',
  bench: 'Bench',
}

const POSITION_LABELS: Record<string, string> = {
  RP: 'Rapid Pitch',
  LCF: 'Left Center Field',
  RCF: 'Right Center Field',
}

interface Props {
  value: PositionCategories
  onChange: (next: PositionCategories) => void
  /**
   * Called after every position change (toggle / add / delete) so the parent
   * can persist immediately without waiting for a Save button.
   */
  onAutosave?: (next: PositionCategories) => void
}

export function PositionCategoryEditor({ value, onChange, onAutosave }: Props) {
  const [newPos, setNewPos] = useState('')
  const [newPosCategory, setNewPosCategory] = useState<Category>('bench')

  const apply = (next: PositionCategories) => {
    onChange(next)
    onAutosave?.(next)
  }

  // Build the master list of positions to render: every known abbreviation
  // plus any positions already saved on the team that aren't in our master list.
  const positionsBySection = useMemo(() => {
    const sections: Record<Category, string[]> = {
      battery: [],
      infield: [],
      outfield: [],
      bench: [],
    }

    const seen = new Set<string>()
    const place = (pos: string, category: Category) => {
      if (seen.has(pos)) return
      seen.add(pos)
      sections[category].push(pos)
    }

    // Start with every position the user already has on their team.
    // Use whatever category they've put it in.
    for (const cat of SECTION_ORDER) {
      for (const pos of value[cat]) {
        place(pos, cat)
      }
    }
    // Then add any standard abbreviations that aren't on the team yet.
    for (const [pos, cat] of Object.entries(NATURAL_CATEGORY)) {
      place(pos, cat)
    }
    return sections
  }, [value])

  const isEnabled = (pos: string, category: Category) =>
    value[category].includes(pos)

  const setEnabled = (pos: string, category: Category, enabled: boolean) => {
    // A position can only be in one category at a time. Strip it from
    // everywhere first, then optionally add it back to `category`.
    const next: PositionCategories = {
      battery: value.battery.filter((p) => p !== pos),
      infield: value.infield.filter((p) => p !== pos),
      outfield: value.outfield.filter((p) => p !== pos),
      bench: value.bench.filter((p) => p !== pos),
    }
    if (enabled) {
      next[category] = [...next[category], pos]
    }
    apply(next)
  }

  const deletePosition = (pos: string) => {
    if (
      !window.confirm(
        `Remove "${pos}" entirely? Historical lineups still reference it but the column disappears from this team's grid.`
      )
    ) {
      return
    }
    const next: PositionCategories = {
      battery: value.battery.filter((p) => p !== pos),
      infield: value.infield.filter((p) => p !== pos),
      outfield: value.outfield.filter((p) => p !== pos),
      bench: value.bench.filter((p) => p !== pos),
    }
    apply(next)
  }

  const addCustomPosition = () => {
    const trimmed = newPos.trim().toUpperCase()
    if (!trimmed) return
    const alreadyOnTeam = SECTION_ORDER.some((c) => value[c].includes(trimmed))
    if (alreadyOnTeam) {
      setNewPos('')
      return
    }
    setEnabled(trimmed, newPosCategory, true)
    setNewPos('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <p className="text-xs text-gray-700">
          Toggle each position on or off. Sections follow standard baseball
          groupings.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTION_ORDER.map((cat) => (
            <section
              key={cat}
              className="border border-gray-300 rounded p-3 bg-gray-50"
            >
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">
                {SECTION_LABEL[cat]}
              </h3>
              <ul className="space-y-1">
                {positionsBySection[cat].length === 0 ? (
                  <li className="text-xs text-gray-500">No positions</li>
                ) : (
                  positionsBySection[cat].map((pos) => {
                    const on = isEnabled(pos, cat)
                    return (
                      <li
                        key={pos}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="font-mono font-bold text-gray-900">
                          {pos}
                        </span>
                        <div className="flex items-center gap-1">
                          <select
                            value={on ? 'yes' : 'no'}
                            onChange={(e) =>
                              setEnabled(pos, cat, e.target.value === 'yes')
                            }
                            className={`px-1.5 py-0.5 text-xs font-semibold border rounded text-gray-900 bg-white ${
                              on
                                ? 'border-green-500'
                                : 'border-gray-300 text-gray-600'
                            }`}
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => deletePosition(pos)}
                            aria-label={`Delete position ${pos}`}
                            title="Remove this position"
                            className="w-5 h-5 inline-flex items-center justify-center rounded text-gray-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <span className="text-sm leading-none">×</span>
                          </button>
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
          <input
            type="text"
            placeholder="Add custom position (e.g. EH)"
            value={newPos}
            onChange={(e) => setNewPos(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomPosition()
              }
            }}
            className="flex-1 min-w-[150px] px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 bg-white"
          />
          <select
            value={newPosCategory}
            onChange={(e) => setNewPosCategory(e.target.value as Category)}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 bg-white"
          >
            {SECTION_ORDER.map((c) => (
              <option key={c} value={c}>
                {SECTION_LABEL[c]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addCustomPosition}
            className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            Add
          </button>
        </div>
      </div>

      <aside className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded p-3 self-start">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">
          Legend
        </h4>
        <dl className="space-y-1">
          {Object.entries(POSITION_LABELS).map(([pos, label]) => (
            <div key={pos} className="flex items-baseline gap-2 text-xs">
              <dt className="font-mono font-bold text-gray-900 w-10 flex-shrink-0">
                {pos}
              </dt>
              <dd className="text-gray-700">{label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-gray-600">
          The rest are standard baseball position abbreviations.
        </p>
      </aside>
    </div>
  )
}
