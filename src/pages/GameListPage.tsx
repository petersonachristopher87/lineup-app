import { useNavigate } from 'react-router-dom'
import { useTeamGames } from '@/hooks/useGames'
import { useTeamSettings } from '@/hooks/useTeams'
import { formatDate } from '@/lib/utils'

interface GameListPageProps {
  teamId: string
}

export function GameListPage({ teamId }: GameListPageProps) {
  const navigate = useNavigate()
  const { data: games = [], isLoading } = useTeamGames(teamId)
  const { data: settings } = useTeamSettings(teamId)

  if (isLoading) {
    return <div className="text-center py-12">Loading games...</div>
  }

  const upcomingGames = games.filter((g) => new Date(g.game_date) > new Date())
  const pastGames = games.filter((g) => new Date(g.game_date) <= new Date())

  return (
    <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Games</h1>
        <button
          onClick={() => navigate(`/team/${teamId}/games/new`)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Game
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">No games yet.</p>
          <button
            onClick={() => navigate(`/team/${teamId}/games/new`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Schedule Your First Game
          </button>
        </div>
      ) : (
        <>
          {upcomingGames.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Games</h2>
              <div className="space-y-3">
                {upcomingGames.map((game) => (
                  <GameCard key={game.id} game={game} teamId={teamId} />
                ))}
              </div>
            </div>
          )}

          {pastGames.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Games</h2>
              <div className="space-y-3">
                {pastGames.map((game) => (
                  <GameCard key={game.id} game={game} teamId={teamId} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface GameCardProps {
  game: any
  teamId: string
}

function GameCard({ game, teamId }: GameCardProps) {
  const navigate = useNavigate()
  const statusColors = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    complete: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/team/${teamId}/games/${game.id}`)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{game.opponent_name}</h3>
          <p className="text-sm text-gray-600 mt-1">{formatDate(game.game_date)}</p>
          {game.location && <p className="text-sm text-gray-500">{game.location}</p>}
          <p className="text-sm text-gray-600 mt-2">{game.innings_count} innings</p>
        </div>
        <div className="text-right">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[game.status as keyof typeof statusColors]
            }`}
          >
            {game.status.charAt(0).toUpperCase() + game.status.slice(1).replace('_', ' ')}
          </span>
          <div className="mt-4 space-y-2">
            <button
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/team/${teamId}/games/${game.id}/attendance`)
              }}
            >
              Set Attendance
            </button>
            <button
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/team/${teamId}/games/${game.id}/lineup`)
              }}
            >
              Plan Lineup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
