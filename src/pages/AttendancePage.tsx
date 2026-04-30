import { useEffect } from 'react'
import { useGameAttendance, useSetAttendance, useInitializeGameAttendance } from '@/hooks/useAttendance'
import { useTeamPlayers } from '@/hooks/usePlayers'
import { useGameById } from '@/hooks/useGames'

interface AttendancePageProps {
  gameId: string
  teamId: string
}

export function AttendancePage({ gameId, teamId }: AttendancePageProps) {
  const { data: game } = useGameById(gameId)
  const { data: teamPlayers = [] } = useTeamPlayers(teamId)
  const { data: attendance = [], isLoading } = useGameAttendance(gameId)
  const setAttendance = useSetAttendance()
  const initializeAttendance = useInitializeGameAttendance()

  // Initialize attendance if not already done
  useEffect(() => {
    if (teamPlayers.length > 0 && attendance.length === 0) {
      initializeAttendance.mutate({
        gameId,
        playerIds: teamPlayers.map((p) => p.id),
      })
    }
  }, [gameId, teamPlayers, attendance.length, initializeAttendance])

  const handleStatusChange = (playerId: string, status: 'attending' | 'absent' | 'maybe') => {
    setAttendance.mutate({ gameId, playerId, status })
  }

  const attendingCount = attendance.filter((a) => a.status === 'attending').length
  const absentCount = attendance.filter((a) => a.status === 'absent').length

  if (isLoading) {
    return <div className="text-center py-12">Loading attendance...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {game?.opponent_name} - Attendance
        </h1>
        <p className="text-gray-600 mt-2">
          {attendingCount} Attending • {absentCount} Absent
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {teamPlayers.map((player) => {
            const playerAttendance = attendance.find((a) => a.player_id === player.id)
            const status = playerAttendance?.status || 'attending'

            return (
              <div key={player.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {player.first_name} {player.last_name}
                      {player.jersey_number && (
                        <span className="text-gray-600 ml-2">#{player.jersey_number}</span>
                      )}
                    </h3>
                    {player.preferred_positions && player.preferred_positions.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {player.preferred_positions.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(player.id, 'attending')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        status === 'attending'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ✓ Attending
                    </button>
                    <button
                      onClick={() => handleStatusChange(player.id, 'maybe')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        status === 'maybe'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ? Maybe
                    </button>
                    <button
                      onClick={() => handleStatusChange(player.id, 'absent')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        status === 'absent'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ✗ Absent
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          Ready to plan the lineup? Click the button below.
        </p>
      </div>
    </div>
  )
}
