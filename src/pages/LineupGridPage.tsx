import { useState, useMemo } from 'react'
import { useGameById } from '@/hooks/useGames'
import { useGameAttendance } from '@/hooks/useAttendance'
import { useGameLineup, useCreateOrUpdateLineup } from '@/hooks/useLineup'
import { useGamePositionAssignments, useSetPositionAssignment } from '@/hooks/usePositionAssignments'
import { useTeamSettings } from '@/hooks/useTeams'
import { useTeamPlayers } from '@/hooks/usePlayers'

interface LineupGridPageProps {
  gameId: string
  teamId: string
}

export function LineupGridPage({ gameId, teamId }: LineupGridPageProps) {
  const { data: game } = useGameById(gameId)
  const { data: teamSettings } = useTeamSettings(teamId)
  const { data: teamPlayers = [] } = useTeamPlayers(teamId)
  const { data: attendance = [] } = useGameAttendance(gameId)
  const { data: lineup } = useGameLineup(gameId)
  const { data: positionAssignments = [] } = useGamePositionAssignments(gameId)
  const [battingOrder, setBattingOrder] = useState<string[]>([])
  const updateLineup = useCreateOrUpdateLineup()
  const setPosition = useSetPositionAssignment()

  const attendingPlayers = useMemo(() => {
    return teamPlayers.filter((p) => {
      const att = attendance.find((a) => a.player_id === p.id)
      return att?.status === 'attending'
    })
  }, [teamPlayers, attendance])

  const handleSaveLineup = () => {
    if (battingOrder.length > 0) {
      updateLineup.mutate({ gameId, batting_order: battingOrder })
    }
  }

  const handleSetPosition = (inning: number, playerId: string, position: string) => {
    setPosition.mutate({ gameId, inning, player_id: playerId, position })
  }

  if (!game || !teamSettings) {
    return <div className="text-center py-12">Loading...</div>
  }

  const positions = teamSettings.position_categories.battery
    .concat(teamSettings.position_categories.infield)
    .concat(teamSettings.position_categories.outfield)
    .concat(teamSettings.position_categories.bench)

  return (
    <div className="max-w-full overflow-x-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{game.opponent_name} - Lineup Builder</h1>
        <p className="text-gray-600 mt-2">
          {attendingPlayers.length} players attending • {game.innings_count} innings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel: Batting order */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Batting Order</h2>
          <div className="space-y-2">
            {attendingPlayers.length === 0 ? (
              <p className="text-gray-500 text-sm">No attending players</p>
            ) : (
              attendingPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="p-3 bg-blue-50 rounded border border-blue-200 cursor-move hover:bg-blue-100"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('playerId', player.id)
                  }}
                >
                  <p className="font-medium text-gray-900">
                    {idx + 1}. {player.first_name} {player.last_name}
                  </p>
                  <p className="text-xs text-gray-600">{player.preferred_positions?.join(', ')}</p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleSaveLineup}
            disabled={updateLineup.isPending}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {updateLineup.isPending ? 'Saving...' : 'Save Lineup'}
          </button>
        </div>

        {/* Right panel: Position grid */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow p-4 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Position Assignments</h2>

          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Inning</th>
                {positions.map((pos) => (
                  <th key={pos} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {pos}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: game.innings_count }).map((_, inning) => (
                <tr key={inning} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">
                    {inning + 1}
                  </td>
                  {positions.map((pos) => {
                    const assignment = positionAssignments.find(
                      (a) => a.inning === inning + 1 && a.position === pos
                    )
                    const player = teamPlayers.find((p) => p.id === assignment?.player_id)

                    return (
                      <td
                        key={`${inning}-${pos}`}
                        className="border border-gray-300 px-2 py-2 text-center text-sm"
                      >
                        <PositionCell
                          position={pos}
                          inning={inning + 1}
                          player={player}
                          attendingPlayers={attendingPlayers}
                          onSelect={(playerId) => handleSetPosition(inning + 1, playerId, pos)}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface PositionCellProps {
  position: string
  inning: number
  player: any
  attendingPlayers: any[]
  onSelect: (playerId: string) => void
}

function PositionCell({ position, player, attendingPlayers, onSelect }: PositionCellProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const positionColors: Record<string, string> = {
    P: 'bg-yellow-100',
    C: 'bg-yellow-100',
    '1B': 'bg-blue-100',
    '2B': 'bg-blue-100',
    '3B': 'bg-blue-100',
    SS: 'bg-blue-100',
    LF: 'bg-green-100',
    CF: 'bg-green-100',
    RF: 'bg-green-100',
    BENCH: 'bg-gray-100',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full px-2 py-1 rounded text-xs font-medium ${positionColors[position] || 'bg-gray-100'}`}
      >
        {player ? `${player.first_name.charAt(0)}. ${player.last_name}` : '-'}
      </button>

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg">
          <button
            onClick={() => {
              setShowDropdown(false)
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b"
          >
            None
          </button>
          {attendingPlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelect(p.id)
                setShowDropdown(false)
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              {p.first_name} {p.last_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
