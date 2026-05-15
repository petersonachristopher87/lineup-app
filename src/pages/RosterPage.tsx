import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useTeamPlayers,
  useCreatePlayer,
  useUpdatePlayer,
  useDeletePlayer,
} from '@/hooks/usePlayers'
import { useTeamById, useCanManageTeam } from '@/hooks/useTeams'
import type { Database } from '@/types/supabase'

type Player = Database['public']['Tables']['players']['Row']

interface RosterPageProps {
  teamId: string
}

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']

export function RosterPage({ teamId }: RosterPageProps) {
  const navigate = useNavigate()
  const { data: team } = useTeamById(teamId)
  const { data: players = [], isLoading } = useTeamPlayers(teamId)
  const createPlayer = useCreatePlayer()
  const updatePlayer = useUpdatePlayer()
  const deletePlayer = useDeletePlayer()
  const canManageTeam = useCanManageTeam(teamId)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    jersey_number: '',
    birth_year: '',
    preferred_positions: [] as string[],
    restricted_positions: [] as string[],
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const parsedYear = parseInt(formData.birth_year)
      await createPlayer.mutateAsync({
        teamId,
        playerData: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          jersey_number: formData.jersey_number || undefined,
          birth_year: Number.isFinite(parsedYear) ? parsedYear : null,
          preferred_positions:
            formData.preferred_positions.length > 0 ? formData.preferred_positions : undefined,
          restricted_positions:
            formData.restricted_positions.length > 0 ? formData.restricted_positions : undefined,
        },
      })
      setFormData({
        first_name: '',
        last_name: '',
        jersey_number: '',
        birth_year: '',
        preferred_positions: [],
        restricted_positions: [],
      })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create player:', error)
    }
  }

  const handleDelete = (player: Player) => {
    const confirmed = window.confirm(
      `Remove ${player.first_name} ${player.last_name} from the roster?`
    )
    if (!confirmed) return
    deletePlayer.mutate(player.id, {
      onError: (err) => {
        console.error('Delete player failed:', err)
        window.alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`)
      },
    })
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading roster...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
        <h1 className="text-3xl font-bold text-gray-900">{team?.name} - Roster</h1>
        {canManageTeam && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {showForm ? 'Cancel' : 'Add Player'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Player</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jersey Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  value={formData.jersey_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jersey_number: e.target.value.replace(/\D/g, ''),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birth Year</label>
                <input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear()}
                  placeholder="e.g. 2016"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  value={formData.birth_year}
                  onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Position Preferences
                </label>
                <div className="flex gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, preferred_positions: [...POSITIONS] })
                    }
                    className="text-blue-700 hover:text-blue-900"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, preferred_positions: [] })
                    }
                    className="text-blue-700 hover:text-blue-900"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map((pos) => (
                  <label key={pos} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferred_positions.includes(pos)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            preferred_positions: [...formData.preferred_positions, pos],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            preferred_positions: formData.preferred_positions.filter(
                              (p) => p !== pos
                            ),
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{pos}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Soft preference — used as a bonus when auto-filling positions.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Restricted Positions
                </label>
                <div className="flex gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, restricted_positions: [...POSITIONS] })
                    }
                    className="text-red-700 hover:text-red-900"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, restricted_positions: [] })
                    }
                    className="text-red-700 hover:text-red-900"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map((pos) => (
                  <label key={pos} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.restricted_positions.includes(pos)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            restricted_positions: [...formData.restricted_positions, pos],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            restricted_positions: formData.restricted_positions.filter(
                              (p) => p !== pos
                            ),
                          })
                        }
                      }}
                      className="h-4 w-4 text-red-600 accent-red-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{pos}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Hard limit — player can't be assigned to these positions.
              </p>
            </div>

            <button
              type="submit"
              disabled={createPlayer.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {createPlayer.isPending ? 'Adding...' : 'Add Player'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-md">
        {players.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">No players on roster yet</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {players.map((player) =>
              editingId === player.id ? (
                <PlayerEditRow
                  key={player.id}
                  player={player}
                  onSave={async (updates) => {
                    await updatePlayer.mutateAsync({ playerId: player.id, updates })
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                  isSaving={updatePlayer.isPending}
                />
              ) : (
                <li
                  key={player.id}
                  className="px-4 py-2 flex items-baseline justify-between text-sm gap-3"
                >
                  <span className="text-gray-900 flex-shrink-0">
                    {player.jersey_number && (
                      <span className="text-gray-500 mr-2">#{player.jersey_number}</span>
                    )}
                    <span className="font-medium">
                      {player.first_name} {player.last_name}
                    </span>
                    {player.birth_year && (
                      <span className="text-xs text-gray-500 ml-2">
                        age {new Date().getFullYear() - player.birth_year}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3 ml-auto">
                    {player.preferred_positions && player.preferred_positions.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {player.preferred_positions.join(', ')}
                      </span>
                    )}
                    {player.restricted_positions && player.restricted_positions.length > 0 && (
                      <span className="text-xs text-red-700" title="Restricted positions">
                        no {player.restricted_positions.join(', ')}
                      </span>
                    )}
                    {canManageTeam && (
                      <>
                        <button
                          onClick={() => setEditingId(player.id)}
                          className="text-blue-700 hover:text-blue-900 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          aria-label={`Remove ${player.first_name} ${player.last_name}`}
                          disabled={deletePlayer.isPending}
                          onClick={() => handleDelete(player)}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <span className="text-base leading-none">×</span>
                        </button>
                      </>
                    )}
                  </span>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

interface PlayerEditRowProps {
  player: Player
  onSave: (updates: Partial<Player>) => Promise<void> | void
  onCancel: () => void
  isSaving: boolean
}

function PlayerEditRow({ player, onSave, onCancel, isSaving }: PlayerEditRowProps) {
  const initial = {
    first_name: player.first_name,
    last_name: player.last_name,
    jersey_number: player.jersey_number ?? '',
    birth_year: player.birth_year ? String(player.birth_year) : '',
    preferred_positions: player.preferred_positions ?? [],
    restricted_positions: player.restricted_positions ?? [],
  }
  const [draft, setDraft] = useState(initial)
  const [savedSnapshot, setSavedSnapshot] = useState(initial)

  const sortedJoin = (arr: string[]) => [...arr].sort().join(',')
  const dirty =
    draft.first_name !== savedSnapshot.first_name ||
    draft.last_name !== savedSnapshot.last_name ||
    draft.jersey_number !== savedSnapshot.jersey_number ||
    draft.birth_year !== savedSnapshot.birth_year ||
    sortedJoin(draft.preferred_positions) !==
      sortedJoin(savedSnapshot.preferred_positions) ||
    sortedJoin(draft.restricted_positions) !==
      sortedJoin(savedSnapshot.restricted_positions)

  const handleSave = async () => {
    const parsedYear = parseInt(draft.birth_year)
    await onSave({
      first_name: draft.first_name,
      last_name: draft.last_name,
      jersey_number: draft.jersey_number || null,
      birth_year: Number.isFinite(parsedYear) ? parsedYear : null,
      preferred_positions:
        draft.preferred_positions.length > 0 ? draft.preferred_positions : null,
      restricted_positions:
        draft.restricted_positions.length > 0 ? draft.restricted_positions : null,
    })
    setSavedSnapshot(draft)
  }

  return (
    <li className="px-4 py-3 bg-blue-50 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[60px_1fr_1fr_90px] gap-2 mb-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          placeholder="#"
          value={draft.jersey_number}
          onChange={(e) =>
            setDraft({ ...draft, jersey_number: e.target.value.replace(/\D/g, '') })
          }
          className="px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
        />
        <input
          type="text"
          placeholder="First name"
          value={draft.first_name}
          onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
        />
        <input
          type="text"
          placeholder="Last name"
          value={draft.last_name}
          onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
        />
        <input
          type="number"
          placeholder="Birth yr"
          min={1990}
          max={new Date().getFullYear()}
          value={draft.birth_year}
          onChange={(e) => setDraft({ ...draft, birth_year: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
        />
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-700">
          Position Preferences
        </span>
        <div className="flex gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() =>
              setDraft({ ...draft, preferred_positions: [...POSITIONS] })
            }
            className="text-blue-700 hover:text-blue-900"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, preferred_positions: [] })}
            className="text-blue-700 hover:text-blue-900"
          >
            None
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {POSITIONS.map((pos) => (
          <label key={pos} className="flex items-center text-xs text-gray-700">
            <input
              type="checkbox"
              checked={draft.preferred_positions.includes(pos)}
              onChange={(e) => {
                if (e.target.checked) {
                  setDraft({
                    ...draft,
                    preferred_positions: [...draft.preferred_positions, pos],
                  })
                } else {
                  setDraft({
                    ...draft,
                    preferred_positions: draft.preferred_positions.filter((p) => p !== pos),
                  })
                }
              }}
              className="h-3 w-3 text-blue-600 mr-1"
            />
            {pos}
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-red-700">
          Restricted (cannot play)
        </span>
        <div className="flex gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() =>
              setDraft({ ...draft, restricted_positions: [...POSITIONS] })
            }
            className="text-red-700 hover:text-red-900"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, restricted_positions: [] })}
            className="text-red-700 hover:text-red-900"
          >
            None
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {POSITIONS.map((pos) => (
          <label key={pos} className="flex items-center text-xs text-gray-700">
            <input
              type="checkbox"
              checked={draft.restricted_positions.includes(pos)}
              onChange={(e) => {
                if (e.target.checked) {
                  setDraft({
                    ...draft,
                    restricted_positions: [...draft.restricted_positions, pos],
                  })
                } else {
                  setDraft({
                    ...draft,
                    restricted_positions: draft.restricted_positions.filter((p) => p !== pos),
                  })
                }
              }}
              className="h-3 w-3 mr-1 accent-red-600"
            />
            {pos}
          </label>
        ))}
      </div>

      <div className="flex gap-2 justify-end items-center">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-3 py-1 text-xs font-medium text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          {dirty ? 'Cancel' : 'Close'}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !dirty}
          className={`px-3 py-1 text-xs font-bold rounded ${
            !dirty
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'text-white bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-100`}
        >
          {isSaving ? 'Saving...' : dirty ? 'Save' : 'Saved ✓'}
        </button>
      </div>
    </li>
  )
}
