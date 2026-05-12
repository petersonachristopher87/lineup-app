import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTeamGames, useUpdateGame } from '@/hooks/useGames'
import { positionAssignmentService } from '@/lib/supabase/positionAssignmentService'
import { pitchLogService } from '@/lib/supabase/pitchLogService'
import { playerService } from '@/lib/supabase/playerService'
import { formatDate } from '@/lib/utils'

interface GameListPageProps {
  teamId: string
}

export function GameListPage({ teamId }: GameListPageProps) {
  const navigate = useNavigate()
  const { data: games = [], isLoading } = useTeamGames(teamId)

  if (isLoading) {
    return <div className="text-center py-12">Loading games...</div>
  }

  // Status is the source of truth. A `planned` game stays upcoming even if its
  // date is in the past — the coach has to explicitly mark it complete or
  // cancelled to move it. Avoids "I forgot to mark it complete" → game wrongly
  // hidden under Past.
  const isFinished = (g: typeof games[number]) =>
    g.status === 'complete' || g.status === 'cancelled'
  const upcomingGames = games
    .filter((g) => !isFinished(g))
    .sort(
      (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
    )
  const pastGames = games
    .filter(isFinished)
    .sort(
      (a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
    )

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
              <h2 className="text-lg font-bold uppercase tracking-wide text-gray-700 mb-3">
                Upcoming
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {upcomingGames.map((game) => (
                  <GameCard key={game.id} game={game} teamId={teamId} />
                ))}
              </div>
            </div>
          )}

          {pastGames.length > 0 && (
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide text-gray-700 mb-3">
                Past & Completed
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
  const queryClient = useQueryClient()
  const updateGame = useUpdateGame()
  const isOpen = game.status !== 'complete' && game.status !== 'cancelled'

  const statusColors = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    complete: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const handleMarkComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const planned = game.innings_count ?? 6
    const input = window.prompt(
      `How many innings did "${game.opponent_name}" actually play?\n(Game was scheduled for ${planned}.)`,
      String(planned)
    )
    if (input === null) return
    const innings = parseInt(input, 10)
    if (!Number.isFinite(innings) || innings < 0) {
      window.alert('Innings must be a non-negative number.')
      return
    }

    try {
      await updateGame.mutateAsync({
        gameId: game.id,
        updates: { status: 'complete', innings_played: innings },
      })
    } catch (err) {
      window.alert(
        `Failed to mark complete: ${err instanceof Error ? err.message : String(err)}`
      )
      return
    }

    // After marking complete, offer to capture pitch counts so rest-day
    // safety rules can fire correctly on the next game's lineup.
    try {
      const assignments =
        await positionAssignmentService.getGamePositionAssignments(game.id)
      const pitcherIds = Array.from(
        new Set(
          assignments
            .filter((a) => a.position === 'P' && a.inning <= innings)
            .map((a) => a.player_id)
        )
      )
      if (pitcherIds.length === 0) return

      const capture = window.confirm(
        `Capture pitch counts for ${pitcherIds.length} pitcher${
          pitcherIds.length === 1 ? '' : 's'
        }?\nThis informs rest-day rules for the next game.`
      )
      if (!capture) return

      const players = await playerService.getTeamPlayers(teamId)
      const playerMap = new Map(players.map((p) => [p.id, p]))

      const pitchedAt = new Date(game.game_date).toISOString().slice(0, 10)
      const entries: Array<{
        game_id: string
        player_id: string
        pitch_count: number
        pitched_at: string
      }> = []
      for (const pid of pitcherIds) {
        const player = playerMap.get(pid)
        const name = player ? `${player.first_name} ${player.last_name}` : 'Pitcher'
        const pitchInput = window.prompt(
          `How many pitches did ${name} throw in ${game.opponent_name}?`,
          ''
        )
        if (pitchInput === null) continue
        const count = parseInt(pitchInput, 10)
        if (!Number.isFinite(count) || count < 0) {
          window.alert(`Skipped ${name} — pitch count must be a non-negative number.`)
          continue
        }
        entries.push({
          game_id: game.id,
          player_id: pid,
          pitch_count: count,
          pitched_at: pitchedAt,
        })
      }

      if (entries.length > 0) {
        await pitchLogService.insertPitchLog(entries)
        queryClient.invalidateQueries({ queryKey: ['pitchLog', teamId] })
      }
    } catch (err) {
      window.alert(
        `Pitch capture failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return (
    <div
      className="bg-white rounded-lg shadow p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
      onClick={() => navigate(`/team/${teamId}/games/${game.id}/attendance`)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <button
          aria-label={`Edit ${game.opponent_name}`}
          title="Edit game"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/team/${teamId}/games/${game.id}/edit`)
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.6}
            stroke="currentColor"
            className="w-4 h-4"
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
        <h3 className="text-sm font-bold text-gray-900 truncate flex-1">
          {game.opponent_name}
        </h3>
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${
            statusColors[game.status as keyof typeof statusColors]
          }`}
        >
          {game.status.replace('_', ' ')}
        </span>
      </div>

      <p className="text-xs text-gray-700">{formatDate(game.game_date)}</p>
      {game.location && (
        <p className="text-xs text-gray-500 truncate">{game.location}</p>
      )}
      <p className="text-xs text-gray-500 mb-2">
        {game.innings_count} innings planned
        {game.innings_played != null && (
          <> · {game.innings_played} played</>
        )}
      </p>

      <div className="mt-auto space-y-1.5">
        <div className="flex gap-1.5">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded text-xs"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/team/${teamId}/games/${game.id}/attendance`)
            }}
          >
            Attendance
          </button>
          <button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-2 rounded text-xs"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/team/${teamId}/games/${game.id}/lineup`)
            }}
          >
            Lineup
          </button>
        </div>
        {isOpen && (
          <button
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-1 px-2 rounded text-xs border border-gray-400 disabled:opacity-50"
            disabled={updateGame.isPending}
            onClick={handleMarkComplete}
          >
            {updateGame.isPending ? 'Saving…' : '✓ Mark complete'}
          </button>
        )}
      </div>
    </div>
  )
}
