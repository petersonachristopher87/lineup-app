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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm font-semibold"
          >
            🏠 Home
          </button>
          <h1 className="text-xl font-bold text-gray-900 inline-flex items-center gap-2">
            {(team as any).logo_url && (
              <img
                src={(team as any).logo_url}
                alt={`${team.name} logo`}
                className="w-7 h-7 rounded object-cover"
              />
            )}
            {team.name}
          </h1>
          <button
            onClick={() => navigate(`/team/${teamId}/profile`)}
            aria-label="Team profile"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-700 hover:text-blue-700 hover:bg-blue-50"
            title="Team profile (name, coaches)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-sm text-gray-600">
            {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)} •{' '}
            {team.level.toUpperCase()} • Season {team.season_year}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/team/${teamId}/roster`)}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Roster</h2>
            <p className="text-sm text-gray-600 mt-1">Players, positions</p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/games`)}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Games</h2>
            <p className="text-sm text-gray-600 mt-1">Schedule, attendance, lineups</p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/settings`)}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Rules, equity, positions</p>
          </button>

          <button
            onClick={() => navigate(`/team/${teamId}/stats`)}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-bold text-gray-900">Season Stats</h2>
            <p className="text-sm text-gray-600 mt-1">
              Aggregate from completed games
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}
