import { FormEvent, useEffect, useState } from 'react'
import { useGameById, useUpdateGame } from '@/hooks/useGames'
import { useNavigate } from 'react-router-dom'

interface EditGamePageProps {
  teamId: string
  gameId: string
}

export function EditGamePage({ teamId, gameId }: EditGamePageProps) {
  const navigate = useNavigate()
  const { data: game } = useGameById(gameId)
  const updateGame = useUpdateGame()

  const [formData, setFormData] = useState({
    opponent_name: '',
    game_date: '',
    game_time: '',
    location: '',
    innings_count: 6,
  })

  useEffect(() => {
    if (!game) return
    const date = new Date(game.game_date)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    setFormData({
      opponent_name: game.opponent_name,
      game_date: `${yyyy}-${mm}-${dd}`,
      game_time: `${hh}:${min}`,
      location: game.location ?? '',
      innings_count: game.innings_count ?? 6,
    })
  }, [game])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const gameDateTime = `${formData.game_date}T${formData.game_time}:00`
      await updateGame.mutateAsync({
        gameId,
        updates: {
          opponent_name: formData.opponent_name,
          game_date: gameDateTime,
          location: formData.location || null,
          innings_count: formData.innings_count,
        },
      })
      navigate(`/team/${teamId}/games`)
    } catch (error) {
      console.error('Failed to update game:', error)
    }
  }

  if (!game) {
    return <div className="text-center py-12 text-gray-900">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm font-semibold"
        >
          🏠 Home
        </button>
        <button
          onClick={() => navigate(`/team/${teamId}/games`)}
          className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm font-semibold"
        >
          ← Games
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Game</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="opponent" className="block text-sm font-medium text-gray-700">
              Opponent Name
            </label>
            <input
              id="opponent"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.opponent_name}
              onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                id="date"
                type="date"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.game_date}
                onChange={(e) => setFormData({ ...formData, game_date: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <input
                id="time"
                type="time"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.game_time}
                onChange={(e) => setFormData({ ...formData, game_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              id="location"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="innings" className="block text-sm font-medium text-gray-700">
              Number of Innings
            </label>
            <input
              id="innings"
              type="number"
              min="1"
              max="12"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.innings_count}
              onChange={(e) =>
                setFormData({ ...formData, innings_count: parseInt(e.target.value) || 1 })
              }
            />
          </div>

          {updateGame.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                {updateGame.error instanceof Error
                  ? updateGame.error.message
                  : 'Failed to update game'}
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={updateGame.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateGame.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2 px-4 rounded border border-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
