import { useNavigate } from 'react-router-dom'
import {
  useGameAttendance,
  useSetAttendance,
  useBulkSetAttendance,
} from '@/hooks/useAttendance'
import { useTeamPlayers } from '@/hooks/usePlayers'
import { useGameById } from '@/hooks/useGames'

interface AttendancePageProps {
  gameId: string
  teamId: string
}

export function AttendancePage({ gameId, teamId }: AttendancePageProps) {
  const navigate = useNavigate()
  const { data: game } = useGameById(gameId)
  const { data: teamPlayers = [] } = useTeamPlayers(teamId)
  const { data: attendance = [], isLoading } = useGameAttendance(gameId)
  const setAttendance = useSetAttendance()
  const bulkSetAttendance = useBulkSetAttendance()

  const handleStatusChange = (playerId: string, status: 'attending' | 'absent' | 'maybe') => {
    setAttendance.mutate({ gameId, playerId, status })
  }

  const handleBulkSet = (status: 'attending' | 'absent' | 'maybe') => {
    if (teamPlayers.length === 0) return
    bulkSetAttendance.mutate({
      gameId,
      playerIds: teamPlayers.map((p) => p.id),
      status,
    })
  }

  const attendingCount = attendance.filter((a) => a.status === 'attending').length
  const absentCount = attendance.filter((a) => a.status === 'absent').length
  const maybeCount = attendance.filter((a) => a.status === 'maybe').length
  const notSetCount = teamPlayers.length - attendingCount - absentCount - maybeCount

  if (isLoading) {
    return <div className="text-center py-12">Loading attendance...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-3">
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
        <h1 className="text-base font-bold text-gray-900 flex-1 truncate">
          {game?.opponent_name} — Attendance
        </h1>
        <p className="text-[11px] text-gray-700 whitespace-nowrap">
          {attendingCount} Attend · {maybeCount} Maybe · {absentCount} Absent
          {notSetCount > 0 && <> · {notSetCount} —</>}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-700 mr-0.5">
          Mark all:
        </span>
        <button
          onClick={() => handleBulkSet('attending')}
          disabled={bulkSetAttendance.isPending}
          className="px-2 py-0.5 text-[11px] font-semibold rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          ✓ Attending
        </button>
        <button
          onClick={() => handleBulkSet('maybe')}
          disabled={bulkSetAttendance.isPending}
          className="px-2 py-0.5 text-[11px] font-semibold rounded bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
        >
          ? Maybe
        </button>
        <button
          onClick={() => handleBulkSet('absent')}
          disabled={bulkSetAttendance.isPending}
          className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
        >
          ✗ Absent
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {teamPlayers.map((player) => {
            const playerAttendance = attendance.find((a) => a.player_id === player.id)
            const status = playerAttendance?.status

            return (
              <div
                key={player.id}
                className="px-3 py-1 flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="text-gray-900 flex-1 min-w-0 truncate">
                  {player.jersey_number && (
                    <span className="text-gray-500 mr-1.5">#{player.jersey_number}</span>
                  )}
                  <span className="font-medium">
                    {player.first_name} {player.last_name}
                  </span>
                  {player.preferred_positions && player.preferred_positions.length > 0 && (
                    <span className="text-[10px] text-gray-500 ml-1.5">
                      {player.preferred_positions.join(', ')}
                    </span>
                  )}
                </span>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStatusChange(player.id, 'attending')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      status === 'attending'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleStatusChange(player.id, 'maybe')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      status === 'maybe'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    ?
                  </button>
                  <button
                    onClick={() => handleStatusChange(player.id, 'absent')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      status === 'absent'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-3 text-center">
        <button
          onClick={() => navigate(`/team/${teamId}/games/${gameId}/lineup`)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-4 rounded"
        >
          Plan Lineup →
        </button>
      </div>
    </div>
  )
}
