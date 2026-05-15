import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useTeamById,
  useTeamSettings,
  useUpdateTeamSettings,
  useCurrentUserRole,
} from '@/hooks/useTeams'
import { getTemplate } from '@/lib/templateOverrides'
import { PositionCategoryEditor } from '@/components/PositionCategoryEditor'

interface TeamSettingsPageProps {
  teamId: string
}

type Weight = 'none' | 'low' | 'medium' | 'high'
const WEIGHTS: Weight[] = ['none', 'low', 'medium', 'high']

interface PitchCountLimitDraft {
  ageMin: number
  ageMax: number
  max_pitches: number
}

interface RestDayRuleDraft {
  min_pitches: number
  max_pitches: number
  rest_days: number
}

export function TeamSettingsPage({ teamId }: TeamSettingsPageProps) {
  const navigate = useNavigate()
  const role = useCurrentUserRole(teamId)
  const { data: team } = useTeamById(teamId)
  const { data: settings } = useTeamSettings(teamId)
  const updateSettings = useUpdateTeamSettings()

  useEffect(() => {
    if (role === 'assistant_coach') {
      navigate(`/team/${teamId}`, { replace: true })
    }
  }, [role, teamId, navigate])

  const [draft, setDraft] = useState<{
    equity_enabled: boolean
    equity_weights: {
      playing_time: Weight
      position_variety: Weight
      batting_order_rotation: Weight
      infield_outfield_balance: Weight
    }
    innings_per_game_default: number
    continuous_batting_order: boolean
    position_categories: {
      battery: string[]
      infield: string[]
      outfield: string[]
      bench: string[]
    }
    safety_rules: {
      pitch_count_limits: PitchCountLimitDraft[]
      rest_day_ladder: RestDayRuleDraft[]
    }
  } | null>(null)

  // Hydrate draft from settings once they load
  useEffect(() => {
    if (!settings || draft) return
    setDraft({
      equity_enabled: settings.equity_enabled ?? true,
      equity_weights: {
        playing_time: (settings.equity_weights as any)?.playing_time ?? 'high',
        position_variety: (settings.equity_weights as any)?.position_variety ?? 'high',
        batting_order_rotation:
          (settings.equity_weights as any)?.batting_order_rotation ?? 'high',
        infield_outfield_balance:
          (settings.equity_weights as any)?.infield_outfield_balance ?? 'high',
      },
      innings_per_game_default: settings.innings_per_game_default ?? 6,
      continuous_batting_order: settings.continuous_batting_order ?? false,
      position_categories: {
        battery: (settings.position_categories as any)?.battery ?? ['P', 'C'],
        infield: (settings.position_categories as any)?.infield ?? ['1B', '2B', '3B', 'SS'],
        outfield: (settings.position_categories as any)?.outfield ?? ['LF', 'CF', 'RF'],
        bench: (settings.position_categories as any)?.bench ?? ['BENCH'],
      },
      safety_rules: {
        pitch_count_limits: (settings.safety_rules as any)?.pitch_count_limits ?? [],
        rest_day_ladder: (settings.safety_rules as any)?.rest_day_ladder ?? [],
      },
    })
  }, [settings, draft])

  if (role === 'assistant_coach') {
    return null
  }

  if (!team || !draft) {
    return <div className="text-center py-12">Loading settings...</div>
  }

  const resetToLevelDefaults = () => {
    const template = getTemplate(team.level)
    if (!template) return
    if (!window.confirm(`Reset all settings to ${team.level.toUpperCase()} defaults?`)) return
    setDraft({
      equity_enabled: true,
      equity_weights: { ...template.equityWeights },
      innings_per_game_default: template.inningsPerGame,
      continuous_batting_order: template.continuousBattingOrder,
      position_categories: { ...template.positionCategories },
      safety_rules: {
        pitch_count_limits: [...template.safetyRules.pitch_count_limits],
        rest_day_ladder: [...template.safetyRules.rest_day_ladder],
      },
    })
  }

  const handleSave = () => {
    updateSettings.mutate(
      {
        teamId,
        updates: {
          equity_enabled: draft.equity_enabled,
          equity_weights: draft.equity_weights,
          innings_per_game_default: draft.innings_per_game_default,
          continuous_batting_order: draft.continuous_batting_order,
          position_categories: draft.position_categories,
          safety_rules: draft.safety_rules,
        },
      },
      {
        onSuccess: () => navigate(`/team/${teamId}`),
        onError: (err) => {
          window.alert(
            `Save failed: ${err instanceof Error ? err.message : String(err)}`
          )
        },
      }
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm font-semibold"
        >
          🏠 Home
        </button>
        <button
          onClick={() => navigate(`/team/${teamId}`)}
          className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm font-semibold"
        >
          ← Team
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{team.name} - Settings</h1>
        <button
          onClick={resetToLevelDefaults}
          className="text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 px-3 py-1.5 rounded"
        >
          Reset to {team.level.toUpperCase()} defaults
        </button>
      </div>

      <div className="space-y-6">
        {/* Game settings */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Game</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">
                Default innings per game
              </span>
              <input
                type="number"
                min={1}
                max={12}
                className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                value={draft.innings_per_game_default}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    innings_per_game_default: parseInt(e.target.value) || 1,
                  })
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.continuous_batting_order}
                onChange={(e) =>
                  setDraft({ ...draft, continuous_batting_order: e.target.checked })
                }
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                Continuous batting order (everyone bats)
              </span>
            </label>
          </div>
        </section>

        {/* Equity */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Equity weights</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.equity_enabled}
                onChange={(e) =>
                  setDraft({ ...draft, equity_enabled: e.target.checked })
                }
                className="h-4 w-4 text-blue-600"
              />
              <span>Show warnings</span>
            </label>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            "High" = strict (warns earlier). "Low" = effectively off.
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
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </span>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  value={draft.equity_weights[key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      equity_weights: {
                        ...draft.equity_weights,
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

        {/* Positions */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Positions</h2>
          <PositionCategoryEditor
            value={draft.position_categories}
            onChange={(next) =>
              setDraft({ ...draft, position_categories: next })
            }
            onAutosave={(next) =>
              updateSettings.mutate({
                teamId,
                updates: { position_categories: next },
              })
            }
          />
        </section>

        {/* Safety: pitch count limits */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Pitch count limits (per game)
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Max pitches per game by player age. Coaches must currently track player
            ages outside the app — daily-limit enforcement isn't wired yet.
          </p>
          <div className="space-y-2">
            {draft.safety_rules.pitch_count_limits.map((limit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span>Ages</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={limit.ageMin}
                  onChange={(e) => {
                    const next = [...draft.safety_rules.pitch_count_limits]
                    next[idx] = { ...limit, ageMin: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, pitch_count_limits: next },
                    })
                  }}
                />
                <span>-</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={limit.ageMax}
                  onChange={(e) => {
                    const next = [...draft.safety_rules.pitch_count_limits]
                    next[idx] = { ...limit, ageMax: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, pitch_count_limits: next },
                    })
                  }}
                />
                <span className="ml-2">max</span>
                <input
                  type="number"
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={limit.max_pitches}
                  onChange={(e) => {
                    const next = [...draft.safety_rules.pitch_count_limits]
                    next[idx] = { ...limit, max_pitches: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, pitch_count_limits: next },
                    })
                  }}
                />
                <span>pitches</span>
                <button
                  className="ml-auto text-red-600 hover:text-red-800"
                  onClick={() => {
                    const next = draft.safety_rules.pitch_count_limits.filter(
                      (_, i) => i !== idx
                    )
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, pitch_count_limits: next },
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
                  safety_rules: {
                    ...draft.safety_rules,
                    pitch_count_limits: [
                      ...draft.safety_rules.pitch_count_limits,
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

        {/* Safety: rest day ladder */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Rest day ladder</h2>
          <p className="text-xs text-gray-600 mb-4">
            After throwing N pitches, a pitcher must rest M days before pitching
            again.
          </p>
          <div className="space-y-2">
            {draft.safety_rules.rest_day_ladder.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={rule.min_pitches}
                  onChange={(e) => {
                    const next = [...draft.safety_rules.rest_day_ladder]
                    next[idx] = { ...rule, min_pitches: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, rest_day_ladder: next },
                    })
                  }}
                />
                <span>-</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={rule.max_pitches}
                  onChange={(e) => {
                    const next = [...draft.safety_rules.rest_day_ladder]
                    next[idx] = { ...rule, max_pitches: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, rest_day_ladder: next },
                    })
                  }}
                />
                <span>pitches →</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                  value={rule.rest_days}
                  onChange={(e) => {
                    const next = [...draft.safety_rules.rest_day_ladder]
                    next[idx] = { ...rule, rest_days: parseInt(e.target.value) || 0 }
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, rest_day_ladder: next },
                    })
                  }}
                />
                <span>days rest</span>
                <button
                  className="ml-auto text-red-600 hover:text-red-800"
                  onClick={() => {
                    const next = draft.safety_rules.rest_day_ladder.filter(
                      (_, i) => i !== idx
                    )
                    setDraft({
                      ...draft,
                      safety_rules: { ...draft.safety_rules, rest_day_ladder: next },
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
                  safety_rules: {
                    ...draft.safety_rules,
                    rest_day_ladder: [
                      ...draft.safety_rules.rest_day_ladder,
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

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => navigate(`/team/${teamId}`)}
            className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
