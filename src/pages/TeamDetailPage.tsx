import { useNavigate } from 'react-router-dom'
import { useTeamById } from '@/hooks/useTeams'

interface TeamDetailPageProps {
  teamId: string
}

export function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const navigate = useNavigate()
  const { data: team, isLoading } = useTeamById(teamId)

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!team) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <p className="text-gray-600 mb-4">Team not found.</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    )
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
      </div>

      <main>
        <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-4">
          {(team as any).logo_url && (
            <img
              src={(team as any).logo_url}
              alt={`${team.name} logo`}
              className="w-14 h-14 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {team.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)} •{' '}
              {team.level.toUpperCase()} • Season {team.season_year}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/team/${teamId}/roster`)}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Roster</h2>
            <p className="text-sm text-gray-600 mt-1">Players, positions</p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/games`)}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Games</h2>
            <p className="text-sm text-gray-600 mt-1">Schedule, attendance, lineups</p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/stats`)}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Season Stats</h2>
            <p className="text-sm text-gray-600 mt-1">
              Aggregate from completed games
            </p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/profile`)}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Team Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Name, year, logo</p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/coaches`)}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Coaches</h2>
            <p className="text-sm text-gray-600 mt-1">Invite, manage members</p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/settings`)}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Game Rules</h2>
            <p className="text-sm text-gray-600 mt-1">Rules, equity, positions</p>
          </button>
        </div>
      </main>
    </div>
  )
}
