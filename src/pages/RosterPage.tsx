import { FormEvent, useState } from 'react'
import { useTeamPlayers, useCreatePlayer } from '@/hooks/usePlayers'
import { useTeamById } from '@/hooks/useTeams'

interface RosterPageProps {
  teamId: string
}

export function RosterPage({ teamId }: RosterPageProps) {
  const { data: team } = useTeamById(teamId)
  const { data: players = [], isLoading } = useTeamPlayers(teamId)
  const createPlayer = useCreatePlayer()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    jersey_number: '',
    preferred_positions: [] as string[],
  })

  const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createPlayer.mutateAsync({
        teamId,
        playerData: {
          ...formData,
          preferred_positions: formData.preferred_positions.length > 0 ? formData.preferred_positions : undefined,
        },
      })
      setFormData({
        first_name: '',
        last_name: '',
        jersey_number: '',
        preferred_positions: [],
      })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create player:', error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading roster...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{team?.name} - Roster</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Add Player'}
        </button>
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Jersey Number</label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.jersey_number}
                onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Positions</label>
              <div className="grid grid-cols-3 gap-2">
                {positions.map((pos) => (
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
                            preferred_positions: formData.preferred_positions.filter((p) => p !== pos),
                          })
                        }
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{pos}</span>
                  </label>
                ))}
              </div>
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
            {players.map((player) => (
              <li key={player.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      #{player.jersey_number} - {player.first_name} {player.last_name}
                    </h3>
                    {player.preferred_positions && player.preferred_positions.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Positions: {player.preferred_positions.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
