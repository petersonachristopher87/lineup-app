import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeamById, useTeamSettings } from '@/hooks/useTeams'
import { useTeamPlayers } from '@/hooks/usePlayers'
import { useTeamCompletedAssignments } from '@/hooks/usePositionAssignments'
import {
  categoryForPosition,
  type PositionCategories,
  type PositionCategory,
} from '@/lib/equityEngine'

interface Props {
  teamId: string
}

interface PlayerAggregate {
  playerId: string
  name: string
  jerseyNumber: string | null
  battery: number
  infield: number
  outfield: number
  bench: number
  totalInnings: number
  fieldingInnings: number
  positionCounts: Record<string, number>
  gamesPlayed: number
}

type SortKey =
  | 'name'
  | 'totalInnings'
  | 'fieldingInnings'
  | 'battery'
  | 'infield'
  | 'outfield'
  | 'bench'
  | 'gamesPlayed'

export function TeamSeasonStatsPage({ teamId }: Props) {
  const navigate = useNavigate()
  const { data: team } = useTeamById(teamId)
  const { data: teamSettings } = useTeamSettings(teamId)
  const { data: players = [] } = useTeamPlayers(teamId)
  const { data: assignments = [], isLoading } = useTeamCompletedAssignments(teamId)

  const [sortKey, setSortKey] = useState<SortKey>('fieldingInnings')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const categories = (teamSettings?.position_categories as
    | PositionCategories
    | undefined) ?? null

  const aggregates = useMemo<PlayerAggregate[]>(() => {
    if (!categories) return []
    const byPlayer = new Map<string, PlayerAggregate>()
    const gamesPerPlayer = new Map<string, Set<string>>()
    for (const p of players) {
      byPlayer.set(p.id, {
        playerId: p.id,
        name: `${p.first_name} ${p.last_name}`,
        jerseyNumber: p.jersey_number,
        battery: 0,
        infield: 0,
        outfield: 0,
        bench: 0,
        totalInnings: 0,
        fieldingInnings: 0,
        positionCounts: {},
        gamesPlayed: 0,
      })
      gamesPerPlayer.set(p.id, new Set())
    }

    for (const a of assignments) {
      // Honor `innings_played` if set — anything past it is a lineup that
      // never actually got played and shouldn't count toward season totals.
      const cap = a.games?.innings_played
      if (cap != null && a.inning > cap) continue

      const agg = byPlayer.get(a.player_id)
      if (!agg) continue

      const cat: PositionCategory | null = categoryForPosition(
        a.position,
        categories
      )
      if (!cat) continue

      agg[cat] += 1
      agg.totalInnings += 1
      if (cat !== 'bench') agg.fieldingInnings += 1
      agg.positionCounts[a.position] = (agg.positionCounts[a.position] ?? 0) + 1
      gamesPerPlayer.get(a.player_id)!.add(a.game_id)
    }

    for (const [pid, set] of gamesPerPlayer) {
      const agg = byPlayer.get(pid)
      if (agg) agg.gamesPlayed = set.size
    }

    return Array.from(byPlayer.values())
  }, [assignments, players, categories])

  const sorted = useMemo(() => {
    const arr = [...aggregates]
    arr.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      const aNum = typeof aVal === 'number' ? aVal : 0
      const bNum = typeof bVal === 'number' ? bVal : 0
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum
    })
    return arr
  }, [aggregates, sortKey, sortDir])

  const totalCompletedGames = useMemo(() => {
    const set = new Set(assignments.map((a) => a.game_id))
    return set.size
  }, [assignments])

  const positionGroups = useMemo(() => {
    if (!categories) return []
    return [
      {
        key: 'battery' as const,
        label: 'Battery',
        positions: categories.battery,
        headerBg: 'bg-yellow-200 text-yellow-900',
        subtotalBg: 'bg-yellow-100 text-yellow-900',
      },
      {
        key: 'infield' as const,
        label: 'Infield',
        positions: categories.infield,
        headerBg: 'bg-blue-200 text-blue-900',
        subtotalBg: 'bg-blue-100 text-blue-900',
      },
      {
        key: 'outfield' as const,
        label: 'Outfield',
        positions: categories.outfield,
        headerBg: 'bg-green-200 text-green-900',
        subtotalBg: 'bg-green-100 text-green-900',
      },
      {
        key: 'bench' as const,
        label: 'Bench',
        positions: categories.bench,
        headerBg: 'bg-gray-300 text-gray-900',
        subtotalBg: 'bg-gray-200 text-gray-900',
      },
    ]
  }, [categories])

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const agg of aggregates) {
      for (const [pos, n] of Object.entries(agg.positionCounts)) {
        totals[pos] = (totals[pos] ?? 0) + n
      }
    }
    return totals
  }, [aggregates])

  const cycleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  if (!team) {
    return <div className="text-center py-12 text-gray-900">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
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

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {team.name} — Season Stats
      </h1>
      <p className="text-sm text-gray-700 mb-4">
        Aggregated from {totalCompletedGames}{' '}
        {totalCompletedGames === 1 ? 'completed game' : 'completed games'}.
        Innings beyond a game's <em>innings_played</em> are excluded so a 4-inning
        rain-shortened game contributes 4 innings, not 6.
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-700">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-700">
          No data yet. Mark a game complete to start tracking.
        </p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-700 text-white">
                <tr>
                  <Th onClick={() => cycleSort('name')} align="left">
                    Player{sortIndicator('name')}
                  </Th>
                  <Th onClick={() => cycleSort('gamesPlayed')}>
                    Games{sortIndicator('gamesPlayed')}
                  </Th>
                  <Th onClick={() => cycleSort('totalInnings')}>
                    Total{sortIndicator('totalInnings')}
                  </Th>
                  <Th onClick={() => cycleSort('fieldingInnings')}>
                    Fielding{sortIndicator('fieldingInnings')}
                  </Th>
                  <Th onClick={() => cycleSort('battery')} bg="yellow">
                    B{sortIndicator('battery')}
                  </Th>
                  <Th onClick={() => cycleSort('infield')} bg="blue">
                    I{sortIndicator('infield')}
                  </Th>
                  <Th onClick={() => cycleSort('outfield')} bg="green">
                    O{sortIndicator('outfield')}
                  </Th>
                  <Th onClick={() => cycleSort('bench')} bg="gray">
                    X{sortIndicator('bench')}
                  </Th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
                    Top positions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((agg) => {
                  const topPositions = Object.entries(agg.positionCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                  return (
                    <tr key={agg.playerId} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="px-2 py-1 text-gray-900">
                        {agg.jerseyNumber && (
                          <span className="text-gray-500 mr-1">#{agg.jerseyNumber}</span>
                        )}
                        <span className="font-medium">{agg.name}</span>
                      </td>
                      <td className="px-2 py-1 text-center text-gray-900">{agg.gamesPlayed}</td>
                      <td className="px-2 py-1 text-center text-gray-900">{agg.totalInnings}</td>
                      <td className="px-2 py-1 text-center font-semibold text-gray-900">
                        {agg.fieldingInnings}
                      </td>
                      <Td value={agg.battery} bg="yellow" />
                      <Td value={agg.infield} bg="infield" />
                      <Td value={agg.outfield} bg="green" />
                      <Td value={agg.bench} bg="gray" />
                      <td className="px-2 py-1 text-xs text-gray-700">
                        {topPositions.length > 0
                          ? topPositions
                              .map(([p, n]) => `${p} (${n})`)
                              .join(', ')
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
            Innings per position
          </h2>
          <p className="text-xs text-gray-700 mb-2">
            Each category's subtotal (Σ) matches the B / I / O / X column above.
          </p>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th
                    rowSpan={2}
                    className="px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap sticky left-0 bg-slate-700"
                  >
                    Player
                  </th>
                  {positionGroups.map((g) => (
                    <th
                      key={g.key}
                      colSpan={g.positions.length + 1}
                      className={`px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wide whitespace-nowrap border-l border-slate-500 ${g.headerBg}`}
                    >
                      {g.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {positionGroups.map((g) => (
                    <Fragment key={g.key}>
                      {g.positions.map((pos, idx) => (
                        <th
                          key={pos}
                          className={`px-2 py-1 text-center text-[11px] font-bold whitespace-nowrap ${g.headerBg} ${idx === 0 ? 'border-l border-slate-500' : ''}`}
                        >
                          {pos}
                        </th>
                      ))}
                      <th
                        className={`px-2 py-1 text-center text-[11px] font-bold whitespace-nowrap ${g.subtotalBg}`}
                      >
                        Σ
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((agg) => (
                  <tr
                    key={agg.playerId}
                    className="border-b border-gray-200 hover:bg-blue-50"
                  >
                    <td className="px-2 py-1 text-gray-900 sticky left-0 bg-white">
                      {agg.jerseyNumber && (
                        <span className="text-gray-500 mr-1">#{agg.jerseyNumber}</span>
                      )}
                      <span className="font-medium">{agg.name}</span>
                    </td>
                    {positionGroups.map((g) => (
                      <Fragment key={g.key}>
                        {g.positions.map((pos, idx) => {
                          const n = agg.positionCounts[pos] ?? 0
                          return (
                            <td
                              key={pos}
                              className={`px-2 py-1 text-center font-mono ${n === 0 ? 'text-gray-300' : 'text-gray-900'} ${idx === 0 ? 'border-l border-gray-300' : ''}`}
                            >
                              {n}
                            </td>
                          )
                        })}
                        <td
                          className={`px-2 py-1 text-center font-mono font-semibold ${g.subtotalBg}`}
                        >
                          {agg[g.key]}
                        </td>
                      </Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-semibold">
                  <td className="px-2 py-1 text-gray-900 sticky left-0 bg-slate-100 text-[11px] uppercase tracking-wide">
                    Team total
                  </td>
                  {positionGroups.map((g) => {
                    const subtotal = g.positions.reduce(
                      (sum, pos) => sum + (columnTotals[pos] ?? 0),
                      0
                    )
                    return (
                      <Fragment key={g.key}>
                        {g.positions.map((pos, idx) => (
                          <td
                            key={pos}
                            className={`px-2 py-1 text-center font-mono text-gray-900 ${idx === 0 ? 'border-l border-gray-300' : ''}`}
                          >
                            {columnTotals[pos] ?? 0}
                          </td>
                        ))}
                        <td
                          className={`px-2 py-1 text-center font-mono font-bold ${g.subtotalBg}`}
                        >
                          {subtotal}
                        </td>
                      </Fragment>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Th({
  onClick,
  align,
  bg,
  children,
}: {
  onClick: () => void
  align?: 'left'
  bg?: 'yellow' | 'blue' | 'green' | 'gray'
  children: React.ReactNode
}) {
  const bgClass =
    bg === 'yellow'
      ? 'bg-yellow-200 text-yellow-900'
      : bg === 'blue'
      ? 'bg-blue-200 text-blue-900'
      : bg === 'green'
      ? 'bg-green-200 text-green-900'
      : bg === 'gray'
      ? 'bg-gray-300 text-gray-900'
      : ''
  return (
    <th
      onClick={onClick}
      className={`px-2 py-1.5 text-${align ?? 'center'} text-[11px] font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none ${bgClass}`}
    >
      {children}
    </th>
  )
}

function Td({
  value,
  bg,
}: {
  value: number
  bg: 'yellow' | 'infield' | 'green' | 'gray'
}) {
  const colorClass =
    value === 0
      ? 'text-gray-400'
      : bg === 'yellow'
      ? 'text-yellow-900'
      : bg === 'infield'
      ? 'text-blue-900'
      : bg === 'green'
      ? 'text-green-900'
      : 'text-gray-700'
  return (
    <td className={`px-2 py-1 text-center font-mono ${colorClass}`}>{value}</td>
  )
}
