import { useUserTeams } from '@/hooks/useTeams'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const { data: teams = [], isLoading } = useUserTeams()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Lineup Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Your Teams</h2>
          <button
            onClick={() => navigate('/create-team')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You don't have any teams yet.</p>
            <button
              onClick={() => navigate('/create-team')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Your First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)} - {team.level.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Season: {team.season_year}</p>
                <button
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/team/${team.id}/roster`)
                  }}
                >
                  Manage Roster
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
