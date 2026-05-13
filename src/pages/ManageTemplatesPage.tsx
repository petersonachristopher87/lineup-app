import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEVEL_TEMPLATES, type LevelTemplate } from '@/lib/levelTemplates'
import {
  LEVEL_KEYS,
  clearTemplateOverride,
  getTemplate,
  hasTemplateOverride,
  setTemplateOverride,
} from '@/lib/templateOverrides'
import { PositionCategoryEditor } from '@/components/PositionCategoryEditor'

type Weight = 'none' | 'low' | 'medium' | 'high'
const WEIGHTS: Weight[] = ['none', 'low', 'medium', 'high']

export function ManageTemplatesPage() {
  const navigate = useNavigate()
  const [activeLevel, setActiveLevel] = useState<string>(LEVEL_KEYS[0])
  const [draft, setDraft] = useState<LevelTemplate | null>(null)
  const [isOverridden, setIsOverridden] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setDraft(getTemplate(activeLevel))
    setIsOverridden(hasTemplateOverride(activeLevel))
    setSavedFlash(false)
  }, [activeLevel])

  if (!draft) {
    return <div className="text-center py-12 text-gray-900">Loading...</div>
  }

  const save = () => {
    setTemplateOverride(activeLevel, draft)
    setIsOverridden(true)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const resetThisLevel = () => {
    if (!window.confirm(`Discard your ${activeLevel.toUpperCase()} overrides and revert to factory defaults?`))
      return
    clearTemplateOverride(activeLevel)
    const fresh = JSON.parse(JSON.stringify(LEVEL_TEMPLATES[activeLevel])) as LevelTemplate
    setDraft(fresh)
    setIsOverridden(false)
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm font-semibold mb-4"
      >
        🏠 Home
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Level Templates</h1>
      <p className="text-sm text-gray-700 mb-6">
        Defaults applied when you create a new team at this level. Stored in your
        browser only — moving to per-account storage when team-sharing is wired.
      </p>

      {/* Level tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LEVEL_KEYS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setActiveLevel(lvl)}
            className={`px-3 py-1.5 rounded text-sm font-semibold border ${
              lvl === activeLevel
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {lvl.toUpperCase()}
            {hasTemplateOverride(lvl) && (
              <span className="ml-1 text-[10px]" title="Has overrides">●</span>
            )}
          </button>
        ))}
      </div>

      {/* Active template editor */}
      <div className="space-y-6">
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {draft.name}
            </h2>
            {isOverridden && (
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                Overridden
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-semibold text-gray-900">Innings per game</span>
              <input
                type="number"
                min={1}
                max={12}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                value={draft.inningsPerGame}
                onChange={(e) =>
                  setDraft({ ...draft, inningsPerGame: parseInt(e.target.value) || 1 })
                }
              />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-gray-900">Fielders</span>
              <input
                type="number"
                min={6}
                max={11}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                value={draft.fielders}
                onChange={(e) =>
                  setDraft({ ...draft, fielders: parseInt(e.target.value) || 9 })
                }
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={draft.continuousBattingOrder}
                onChange={(e) =>
                  setDraft({ ...draft, continuousBattingOrder: e.target.checked })
                }
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-900">Continuous batting order</span>
            </label>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Equity weights</h2>
          <p className="text-xs text-gray-600 mb-4">
            "None" disables that warning category entirely.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                ['playing_time', 'Playing time'],
                ['position_variety', 'Position variety'],
                ['batting_order_rotation', 'Batting order rotation'],
                ['infield_outfield_balance', 'Infield / outfield balance'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="block text-sm font-semibold text-gray-900 mb-1">{label}</span>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  value={draft.equityWeights[key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      equityWeights: {
                        ...draft.equityWeights,
                        [key]: e.target.value as Weight,
                      },
                    })
                  }
                >
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Positions</h2>
          <PositionCategoryEditor
            value={draft.positionCategories}
            onChange={(next) =>
              setDraft({ ...draft, positionCategories: next })
            }
            onAutosave={(next) => {
              const nextDraft = { ...draft, positionCategories: next }
              setTemplateOverride(activeLevel, nextDraft)
              setIsOverridden(true)
              setSavedFlash(true)
              setTimeout(() => setSavedFlash(false), 2000)
            }}
          />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Pitch count limits (per game, by age)</h2>
          <div className="space-y-2">
            {draft.safetyRules.pitch_count_limits.map((limit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-900">
                <span>Ages</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={limit.ageMin}
                  onChange={(e) => {
                    const next = [...draft.safetyRules.pitch_count_limits]
                    next[idx] = { ...limit, ageMin: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, pitch_count_limits: next },
                    })
                  }}
                />
                <span>-</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={limit.ageMax}
                  onChange={(e) => {
                    const next = [...draft.safetyRules.pitch_count_limits]
                    next[idx] = { ...limit, ageMax: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, pitch_count_limits: next },
                    })
                  }}
                />
                <span className="ml-2">max</span>
                <input
                  type="number"
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={limit.max_pitches}
                  onChange={(e) => {
                    const next = [...draft.safetyRules.pitch_count_limits]
                    next[idx] = { ...limit, max_pitches: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, pitch_count_limits: next },
                    })
                  }}
                />
                <span>pitches</span>
                <button
                  className="ml-auto text-red-700 hover:text-red-900 font-semibold"
                  onClick={() => {
                    const next = draft.safetyRules.pitch_count_limits.filter(
                      (_, i) => i !== idx
                    )
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, pitch_count_limits: next },
                    })
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="text-sm text-blue-700 hover:text-blue-900 font-semibold"
              onClick={() =>
                setDraft({
                  ...draft,
                  safetyRules: {
                    ...draft.safetyRules,
                    pitch_count_limits: [
                      ...draft.safetyRules.pitch_count_limits,
                      { ageMin: 0, ageMax: 0, max_pitches: 0 },
                    ],
                  },
                })
              }
            >
              + Add age range
            </button>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Rest day ladder</h2>
          <div className="space-y-2">
            {draft.safetyRules.rest_day_ladder.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={rule.min_pitches}
                  onChange={(e) => {
                    const next = [...draft.safetyRules.rest_day_ladder]
                    next[idx] = { ...rule, min_pitches: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, rest_day_ladder: next },
                    })
                  }}
                />
                <span>-</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={rule.max_pitches}
                  onChange={(e) => {
                    const next = [...draft.safetyRules.rest_day_ladder]
                    next[idx] = { ...rule, max_pitches: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, rest_day_ladder: next },
                    })
                  }}
                />
                <span>pitches →</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={rule.rest_days}
                  onChange={(e) => {
                    const next = [...draft.safetyRules.rest_day_ladder]
                    next[idx] = { ...rule, rest_days: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, rest_day_ladder: next },
                    })
                  }}
                />
                <span>days rest</span>
                <button
                  className="ml-auto text-red-700 hover:text-red-900 font-semibold"
                  onClick={() => {
                    const next = draft.safetyRules.rest_day_ladder.filter(
                      (_, i) => i !== idx
                    )
                    setDraft({
                      ...draft,
                      safetyRules: { ...draft.safetyRules, rest_day_ladder: next },
                    })
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="text-sm text-blue-700 hover:text-blue-900 font-semibold"
              onClick={() =>
                setDraft({
                  ...draft,
                  safetyRules: {
                    ...draft.safetyRules,
                    rest_day_ladder: [
                      ...draft.safetyRules.rest_day_ladder,
                      { min_pitches: 0, max_pitches: 0, rest_days: 0 },
                    ],
                  },
                })
              }
            >
              + Add tier
            </button>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 justify-between items-center">
          <button
            onClick={resetThisLevel}
            disabled={!isOverridden}
            className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset {activeLevel.toUpperCase()} to factory defaults
          </button>
          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="text-sm text-green-700 font-semibold">Saved ✓</span>
            )}
            <button
              onClick={save}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Save {activeLevel.toUpperCase()} overrides
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
