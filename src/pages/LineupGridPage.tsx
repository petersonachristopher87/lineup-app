import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameById } from '@/hooks/useGames'
import { useGameAttendance, useSetAttendance } from '@/hooks/useAttendance'
import { useCreateOrUpdateLineup, useGameLineup } from '@/hooks/useLineup'
import {
  useGamePositionAssignments,
  useSetPositionAssignment,
  useBulkSetPositionAssignments,
  useClearInningAssignments,
  useClearPlayerInningAssignment,
  useClearGameAssignments,
  useReorderInnings,
} from '@/hooks/usePositionAssignments'
import { useTeamSettings } from '@/hooks/useTeams'
import { useTeamPlayers } from '@/hooks/usePlayers'
import { useEquityWarnings } from '@/hooks/useEquityWarnings'
import { EquitySidebar } from '@/components/equity/EquitySidebar'
import type { EquityWeights, PositionCategories } from '@/lib/equityEngine'
import { calculatePlayerCategoryCounts } from '@/lib/equityEngine'
import { useTeamPitchLog } from '@/hooks/usePitchLog'
import { useSafetyBlocks } from '@/hooks/useSafetyBlocks'
import { SafetyPanel } from '@/components/safety/SafetyPanel'
import type { SafetyRules } from '@/lib/safetyRulesEngine'
import { autoFillBattingOrder, autoFillPositions } from '@/lib/autoFillEngine'
import { PrintableLineup } from '@/components/PrintableLineup'
import { formatDate } from '@/lib/utils'

interface LineupGridPageProps {
  gameId: string
  teamId: string
}

export function LineupGridPage({ gameId, teamId }: LineupGridPageProps) {
  const navigate = useNavigate()
  const { data: game } = useGameById(gameId)
  const { data: teamSettings } = useTeamSettings(teamId)
  const { data: teamPlayers = [] } = useTeamPlayers(teamId)
  const { data: attendance = [] } = useGameAttendance(gameId)
  const { data: positionAssignments = [] } = useGamePositionAssignments(gameId)
  const { data: lineup } = useGameLineup(gameId)
  const updateLineup = useCreateOrUpdateLineup()
  const setPosition = useSetPositionAssignment()
  const bulkSetPositions = useBulkSetPositionAssignments()
  const clearInning = useClearInningAssignments()
  const clearPlayerInning = useClearPlayerInningAssignment()
  const clearGame = useClearGameAssignments()
  const reorderInnings = useReorderInnings()
  const setAttendance = useSetAttendance()

  const attendingPlayers = useMemo(() => {
    return teamPlayers.filter((p) => {
      const att = attendance.find((a) => a.player_id === p.id)
      return att?.status === 'attending'
    })
  }, [teamPlayers, attendance])

  const nonAttendingByStatus = useMemo(() => {
    const buckets: Record<'maybe' | 'absent' | 'not_set', typeof teamPlayers> = {
      maybe: [],
      absent: [],
      not_set: [],
    }
    for (const p of teamPlayers) {
      const att = attendance.find((a) => a.player_id === p.id)
      const status = att?.status
      if (status === 'maybe') buckets.maybe.push(p)
      else if (status === 'absent') buckets.absent.push(p)
      else if (!status) buckets.not_set.push(p)
    }
    return buckets
  }, [teamPlayers, attendance])

  // Derive batting order: saved order first (filtered to currently attending),
  // then any newly-attending players appended at the end.
  const initialOrder = useMemo(() => {
    const attendingIds = attendingPlayers.map((p) => p.id)
    const attendingSet = new Set(attendingIds)
    const saved = (lineup?.batting_order ?? []).filter((id: string) =>
      attendingSet.has(id)
    )
    const savedSet = new Set(saved)
    const remaining = attendingIds.filter((id) => !savedSet.has(id))
    return [...saved, ...remaining]
  }, [lineup, attendingPlayers])

  const [battingOrder, setBattingOrder] = useState<string[]>([])
  const [orderDirty, setOrderDirty] = useState(false)

  // Sync batting order with derived order when underlying data changes,
  // but don't clobber unsaved edits.
  useEffect(() => {
    if (!orderDirty) {
      setBattingOrder(initialOrder)
    }
  }, [initialOrder, orderDirty])

  // Always keep the batting order in sync with who's actually attending —
  // even when there are unsaved drag edits. Removing a player from
  // attendance should always drop them out of the lineup; newly-attending
  // players append at the end so the dirty drag order is preserved.
  useEffect(() => {
    const attendingIds = attendingPlayers.map((p) => p.id)
    const attendingSet = new Set(attendingIds)
    setBattingOrder((prev) => {
      const filtered = prev.filter((id) => attendingSet.has(id))
      const existing = new Set(filtered)
      const newcomers = attendingIds.filter((id) => !existing.has(id))
      const next = [...filtered, ...newcomers]
      if (
        next.length === prev.length &&
        next.every((id, i) => id === prev[i])
      ) {
        return prev
      }
      return next
    })
  }, [attendingPlayers])

  // Once the saved lineup matches our local order, drop the dirty flag.
  // This avoids a save → cache-invalidate → re-derive race where the local
  // order briefly snaps back to the pre-save value before the refetch lands.
  useEffect(() => {
    if (
      orderDirty &&
      lineup?.batting_order &&
      lineup.batting_order.length === battingOrder.length &&
      lineup.batting_order.every((id: string, i: number) => id === battingOrder[i])
    ) {
      setOrderDirty(false)
    }
  }, [lineup, battingOrder, orderDirty])

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [draggedInning, setDraggedInning] = useState<number | null>(null)
  const [inningDropIndex, setInningDropIndex] = useState<number | null>(null)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndex(index)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId') || draggedId
    if (!playerId || dropIndex == null) {
      setDraggedId(null)
      setDropIndex(null)
      return
    }
    const fromIdx = battingOrder.indexOf(playerId)
    let next: string[]
    if (fromIdx >= 0) {
      // Reordering an existing batting-order entry
      next = [...battingOrder]
      next.splice(fromIdx, 1)
      const adjustedIdx = dropIndex > fromIdx ? dropIndex - 1 : dropIndex
      next.splice(adjustedIdx, 0, playerId)
    } else {
      // Pulled in from the non-attending list. Promote to attending so the
      // player flows through the rest of the lineup logic.
      next = [...battingOrder]
      next.splice(dropIndex, 0, playerId)
      setAttendance.mutate({ gameId, playerId, status: 'attending' })
    }
    setBattingOrder(next)
    setOrderDirty(true)
    setDraggedId(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDropIndex(null)
  }

  const handleSaveLineup = () => {
    if (battingOrder.length > 0) {
      // Don't flip orderDirty here — let the effect above flip it once the
      // lineup data refetches and matches. Prevents the post-save flicker.
      updateLineup.mutate({ gameId, batting_order: battingOrder })
    }
  }

  const handlePrefill = () => {
    if (attendingPlayers.length === 0) {
      window.alert('Mark some players as attending first.')
      return
    }
    if (positionAssignments.length > 0 || (lineup?.batting_order?.length ?? 0) > 0) {
      const ok = window.confirm(
        'Prefill will overwrite the current batting order and position assignments. Continue?'
      )
      if (!ok) return
    }

    const order = autoFillBattingOrder(attendingPlayers)
    setBattingOrder(order)
    setOrderDirty(true)

    if (game && categories) {
      const newAssignments = autoFillPositions({
        attendingPlayers: attendingPlayers.map((p) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          jersey_number: p.jersey_number,
          preferred_positions: p.preferred_positions,
          restricted_positions: (p as any).restricted_positions ?? null,
        })),
        inningsCount: game.innings_count,
        positions,
        positionCategories: categories,
        blockedPitcherIds,
      })
      bulkSetPositions.mutate(
        { gameId, assignments: newAssignments },
        {
          onError: (err) => {
            window.alert(
              `Prefill failed: ${err instanceof Error ? err.message : String(err)}`
            )
          },
        }
      )
    }
  }

  const handleSetPosition = (inning: number, playerId: string, position: string) => {
    setPosition.mutate({ gameId, inning, player_id: playerId, position })
  }

  const handleClearInning = (inning: number) => {
    if (!window.confirm(`Clear all assignments for inning ${inning}?`)) return
    clearInning.mutate(
      { gameId, inning },
      {
        onError: (err) => {
          window.alert(
            `Clear failed: ${err instanceof Error ? err.message : String(err)}`
          )
        },
      }
    )
  }

  const handleClearGame = () => {
    if (!window.confirm('Clear ALL position assignments for this game? Cannot be undone.'))
      return
    clearGame.mutate(gameId, {
      onError: (err) => {
        window.alert(
          `Clear failed: ${err instanceof Error ? err.message : String(err)}`
        )
      },
    })
  }

  const handleInningDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedInning == null || inningDropIndex == null) {
      setDraggedInning(null)
      setInningDropIndex(null)
      return
    }
    if (!game) return
    const inningCount = game.innings_count
    const order = Array.from({ length: inningCount }, (_, i) => i + 1)
    const fromIdx = order.indexOf(draggedInning)
    if (fromIdx === -1) {
      setDraggedInning(null)
      setInningDropIndex(null)
      return
    }
    const adjusted = inningDropIndex > fromIdx ? inningDropIndex - 1 : inningDropIndex
    if (adjusted === fromIdx) {
      setDraggedInning(null)
      setInningDropIndex(null)
      return
    }
    order.splice(fromIdx, 1)
    order.splice(adjusted, 0, draggedInning)
    reorderInnings.mutate(
      { gameId, oldOrder: order },
      {
        onError: (err) => {
          window.alert(
            `Reorder failed: ${err instanceof Error ? err.message : String(err)}`
          )
        },
      }
    )
    setDraggedInning(null)
    setInningDropIndex(null)
  }

  // All remaining hooks must run unconditionally — keep them above the
  // loading guard so React sees the same hook order every render.
  const categories = (teamSettings?.position_categories as PositionCategories | undefined) ?? null

  // Persist user's preferred column order per team in localStorage. Falls back
  // to the default battery → infield → outfield → RP → bench order whenever
  // the saved list doesn't cover the team's current set of positions.
  const colOrderKey = `lineup-app:col-order:${teamId}`
  const [colOrderOverride, setColOrderOverride] = useState<string[] | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(colOrderKey)
      return raw ? (JSON.parse(raw) as string[]) : null
    } catch {
      return null
    }
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (colOrderOverride) {
      window.localStorage.setItem(colOrderKey, JSON.stringify(colOrderOverride))
    } else {
      window.localStorage.removeItem(colOrderKey)
    }
  }, [colOrderOverride, colOrderKey])

  const [draggedCol, setDraggedCol] = useState<string | null>(null)
  const [colDropIndex, setColDropIndex] = useState<number | null>(null)


  const playerNames: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of teamPlayers) map[p.id] = `${p.first_name} ${p.last_name}`
    return map
  }, [teamPlayers])

  // Order attending players by their batting-order position so the equity
  // table and safety eligible-pitcher list mirror the batting card.
  const orderedAttendingPlayers = useMemo(() => {
    const orderMap = new Map(battingOrder.map((id, idx) => [id, idx]))
    return [...attendingPlayers].sort((a, b) => {
      const aIdx = orderMap.get(a.id) ?? Infinity
      const bIdx = orderMap.get(b.id) ?? Infinity
      return aIdx - bIdx
    })
  }, [attendingPlayers, battingOrder])

  const equityWarnings = useEquityWarnings({
    attendingPlayers: orderedAttendingPlayers,
    inningsCount: game?.innings_count ?? 0,
    weights: (teamSettings?.equity_weights as EquityWeights | undefined) ?? null,
    positionCategories: categories,
    positionAssignments,
  })

  const categoryCounts = useMemo(() => {
    if (!categories) return []
    return calculatePlayerCategoryCounts(
      orderedAttendingPlayers.map((p) => p.id),
      positionAssignments,
      categories
    )
  }, [orderedAttendingPlayers, positionAssignments, categories])

  const { data: pitchLog = [] } = useTeamPitchLog(teamId)
  const attendingPitcherCandidates = useMemo(
    () =>
      orderedAttendingPlayers.map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        birth_year: (p as any).birth_year ?? null,
      })),
    [orderedAttendingPlayers]
  )
  const { blocks: safetyBlocks, eligibility: pitcherEligibility } = useSafetyBlocks({
    pitchLog,
    pitchLogWithGameId: pitchLog,
    rules: (teamSettings?.safety_rules as SafetyRules | undefined) ?? null,
    gameDate: game?.game_date ?? null,
    playerNames,
    excludeGameId: gameId,
    attendingPitcherCandidates,
  })
  const blockedPitcherIds = useMemo(
    () => new Set(safetyBlocks.map((b) => b.playerId)),
    [safetyBlocks]
  )

  const [showSafety, setShowSafety] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem('lineup-app:showSafety') !== '0'
  })
  const [showEquity, setShowEquity] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem('lineup-app:showEquity') !== '0'
  })
  const [showBatting, setShowBatting] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem('lineup-app:showBatting') !== '0'
  })
  useEffect(() => {
    window.localStorage.setItem('lineup-app:showSafety', showSafety ? '1' : '0')
  }, [showSafety])
  useEffect(() => {
    window.localStorage.setItem('lineup-app:showEquity', showEquity ? '1' : '0')
  }, [showEquity])
  useEffect(() => {
    window.localStorage.setItem('lineup-app:showBatting', showBatting ? '1' : '0')
  }, [showBatting])

  if (!game || !teamSettings || !categories) {
    return <div className="text-center py-12 text-gray-900">Loading...</div>
  }

  // Default visual order: battery (minus RP) → infield → outfield → RP → bench
  const batteryWithoutRP = categories.battery.filter((p) => p !== 'RP')
  const hasRP = categories.battery.includes('RP')
  const defaultPositions: string[] = [
    ...batteryWithoutRP,
    ...categories.infield,
    ...categories.outfield,
    ...(hasRP ? ['RP'] : []),
    ...categories.bench,
  ]

  // Apply user's saved column order if it still matches the current set.
  // New positions added to the team get appended at the end.
  let positions: string[] = defaultPositions
  if (colOrderOverride) {
    const defaultSet = new Set(defaultPositions)
    const ordered = colOrderOverride.filter((p) => defaultSet.has(p))
    const orderedSet = new Set(ordered)
    const missing = defaultPositions.filter((p) => !orderedSet.has(p))
    positions = [...ordered, ...missing]
  }

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedCol || colDropIndex == null) {
      setDraggedCol(null)
      setColDropIndex(null)
      return
    }
    const fromIdx = positions.indexOf(draggedCol)
    if (fromIdx === -1) {
      setDraggedCol(null)
      setColDropIndex(null)
      return
    }
    const adjusted = colDropIndex > fromIdx ? colDropIndex - 1 : colDropIndex
    if (adjusted === fromIdx) {
      setDraggedCol(null)
      setColDropIndex(null)
      return
    }
    const next = [...positions]
    next.splice(fromIdx, 1)
    next.splice(adjusted, 0, draggedCol)
    setColOrderOverride(next)
    setDraggedCol(null)
    setColDropIndex(null)
  }

  const resetColumnOrder = () => {
    setColOrderOverride(null)
  }

  return (
    <div className="max-w-full py-3 px-3">
      <div className="print-hidden flex items-baseline justify-between mb-3 gap-3 flex-wrap">
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
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            vs {game.opponent_name}
            <span className="ml-2 text-sm font-normal text-gray-700">
              · {formatDate(game.game_date)}
              {game.location && <> · {game.location}</>}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-700">
            {attendingPlayers.length} attending · {game.innings_count} innings
          </p>
          <button
            onClick={() => window.print()}
            aria-label="Print lineup"
            title="Print lineup (1 page batting order, 1 page field diagram)"
            className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.6}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Printable content — hidden onscreen, visible only when printing */}
      <PrintableLineup
        opponent={game.opponent_name}
        gameDate={game.game_date}
        battingOrder={battingOrder}
        teamPlayers={teamPlayers}
        positions={positions}
        positionAssignments={positionAssignments}
        inningsCount={game.innings_count}
        positionCategories={categories}
      />

      <div className="print-hidden flex flex-col gap-3">
        {/* Top row: Batting + Equity + Safety side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">

        {/* Batting order + non-attending */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Batting Order</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveLineup}
                disabled={updateLineup.isPending || !orderDirty}
                className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLineup.isPending
                  ? 'Saving...'
                  : orderDirty
                  ? 'Save'
                  : 'Saved ✓'}
              </button>
              <button
                onClick={handlePrefill}
                disabled={bulkSetPositions.isPending || attendingPlayers.length === 0}
                className="bg-white hover:bg-gray-100 text-gray-900 text-[11px] font-semibold py-1 px-2 rounded border border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Auto-fill batting order (by jersey #) and positions (equity-aware)"
              >
                {bulkSetPositions.isPending ? 'Prefilling…' : '✨ Prefill'}
              </button>
              <button
                onClick={() => setShowBatting((v) => !v)}
                aria-label={showBatting ? 'Hide batting order' : 'Show batting order'}
                title={showBatting ? 'Hide batting order' : 'Show batting order'}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                {showBatting ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {showBatting && (<>
          {battingOrder.length > 0 && (
            <div className="flex items-baseline gap-1.5 px-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              <span className="w-5 text-left flex-shrink-0">#</span>
              <span className="flex-1 text-left">Player</span>
              <span>Prefers</span>
              <span className="w-3.5 flex-shrink-0" />
            </div>
          )}
          <div onDrop={handleDrop} onDragLeave={() => setDropIndex(null)}>
          {battingOrder.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setDropIndex(0)
              }}
              className={`p-4 text-center text-xs border-2 border-dashed rounded transition-colors ${
                dropIndex === 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-500'
              }`}
            >
              No attending players. Drag a name from "Not in lineup" below to add them.
            </div>
          ) : (
            <>
              {battingOrder.map((id, idx) => {
                const player = teamPlayers.find((p) => p.id === id)
                if (!player) return null
                return (
                  <div key={id}>
                    <div
                      className={`h-0.5 -my-px transition-colors ${
                        dropIndex === idx ? 'bg-blue-600' : 'bg-transparent'
                      }`}
                    />
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('playerId', id)
                        setDraggedId(id)
                      }}
                      onDragOver={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const isAbove = e.clientY < rect.top + rect.height / 2
                        handleDragOver(e, isAbove ? idx : idx + 1)
                      }}
                      onDragEnd={handleDragEnd}
                      className={`my-px px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200 cursor-move hover:bg-blue-100 flex items-baseline gap-1.5 text-[11px] ${
                        draggedId === id ? 'opacity-40' : ''
                      }`}
                    >
                      <span className="text-gray-500 font-mono w-5 text-left flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="font-medium text-gray-900 truncate flex-1 text-left">
                        {player.first_name} {player.last_name}
                      </span>
                      {player.preferred_positions && player.preferred_positions.length > 0 && (
                        <span className="text-[10px] text-gray-600">
                          {player.preferred_positions.join(', ')}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAttendance.mutate({
                            gameId,
                            playerId: id,
                            status: 'absent',
                          })
                        }}
                        aria-label={`Remove ${player.first_name} ${player.last_name} from lineup`}
                        title="Mark absent (remove from this game's lineup)"
                        className="w-3.5 h-3.5 inline-flex items-center justify-center rounded text-gray-500 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                      >
                        <span className="text-xs leading-none">×</span>
                      </button>
                    </div>
                  </div>
                )
              })}
              <div
                onDragOver={(e) => handleDragOver(e, battingOrder.length)}
                className={`h-1 transition-colors ${
                  dropIndex === battingOrder.length ? 'bg-blue-600' : 'bg-transparent'
                }`}
              />
            </>
          )}
          </div>

          {(nonAttendingByStatus.maybe.length > 0 ||
            nonAttendingByStatus.absent.length > 0 ||
            nonAttendingByStatus.not_set.length > 0) && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-gray-700 mb-1">
                Not in lineup
              </h3>
              <div className="space-y-1">
                <NonAttendingGroup
                  label="Maybe"
                  players={nonAttendingByStatus.maybe}
                  chipClass="bg-yellow-100 border-yellow-300 text-yellow-900"
                />
                <NonAttendingGroup
                  label="Absent"
                  players={nonAttendingByStatus.absent}
                  chipClass="bg-red-100 border-red-300 text-red-900"
                />
                <NonAttendingGroup
                  label="Not set"
                  players={nonAttendingByStatus.not_set}
                  chipClass="bg-gray-100 border-gray-300 text-gray-700"
                />
              </div>
            </div>
          )}
          </>)}
        </div>

          <EquitySidebar
            warnings={equityWarnings}
            playerNames={playerNames}
            categoryCounts={categoryCounts}
            show={showEquity}
            onToggle={() => setShowEquity((v) => !v)}
          />
          <SafetyPanel
            blocks={safetyBlocks}
            eligibility={pitcherEligibility}
            show={showSafety}
            onToggle={() => setShowSafety((v) => !v)}
          />
        </div>

        {/* Position grid: full width */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Position Assignments</h2>
            <div className="flex items-center gap-2">
              {colOrderOverride && (
                <button
                  onClick={resetColumnOrder}
                  className="text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded border border-gray-300"
                  title="Reset column order to default"
                >
                  Reset columns
                </button>
              )}
              {positionAssignments.length > 0 && (
                <button
                  onClick={handleClearGame}
                  disabled={clearGame.isPending}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded border border-red-300 disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
          <table
            className="min-w-full border-collapse border border-gray-400"
            onDrop={handleInningDrop}
            onDragLeave={() => setInningDropIndex(null)}
          >
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="border border-slate-600 px-1.5 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">Innings</th>
                {positions.map((pos, idx) => {
                  const isAboveDrop = colDropIndex === idx
                  const isBelowDrop = colDropIndex === idx + 1
                  return (
                    <th
                      key={pos}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggedCol(pos)
                      }}
                      onDragEnd={() => {
                        setDraggedCol(null)
                        setColDropIndex(null)
                      }}
                      onDragOver={(e) => {
                        if (!draggedCol) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        const isLeft = e.clientX < rect.left + rect.width / 2
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setColDropIndex(isLeft ? idx : idx + 1)
                      }}
                      onDrop={handleColumnDrop}
                      className={`border border-slate-600 px-1.5 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide cursor-move select-none ${
                        draggedCol === pos ? 'opacity-40' : ''
                      } ${isAboveDrop ? 'border-l-2 border-l-blue-400' : ''} ${
                        isBelowDrop ? 'border-r-2 border-r-blue-400' : ''
                      }`}
                      title="Drag to reorder this column"
                    >
                      {pos}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: game.innings_count }).map((_, inning) => {
                const inningNum = inning + 1
                const assignedPlayerIds = new Set(
                  positionAssignments
                    .filter((a) => a.inning === inningNum)
                    .map((a) => a.player_id)
                )
                const inningHasAssignments = positionAssignments.some(
                  (a) => a.inning === inningNum
                )
                const isAboveDrop = inningDropIndex === inning
                const isBelowDrop = inningDropIndex === inning + 1
                return (
                  <tr
                    key={inningNum}
                    className={`hover:bg-blue-50 ${
                      draggedInning === inningNum ? 'opacity-40' : ''
                    } ${isAboveDrop ? 'border-t-2 border-t-blue-600' : ''} ${
                      isBelowDrop ? 'border-b-2 border-b-blue-600' : ''
                    }`}
                    onDragOver={(e) => {
                      if (draggedInning == null) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const isAbove = e.clientY < rect.top + rect.height / 2
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setInningDropIndex(isAbove ? inning : inning + 1)
                    }}
                  >
                    <td
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggedInning(inningNum)
                      }}
                      onDragEnd={() => {
                        setDraggedInning(null)
                        setInningDropIndex(null)
                      }}
                      className="border border-gray-400 px-1.5 py-0.5 font-bold text-gray-900 bg-slate-200 text-[11px] select-none whitespace-nowrap cursor-move"
                      title="Drag to reorder this inning"
                    >
                      <span className="inline-flex items-center gap-1 leading-none">
                        <span className="text-gray-500 text-xs tracking-tighter">⋮⋮</span>
                        <span>{inningNum}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClearInning(inningNum)
                          }}
                          disabled={!inningHasAssignments || clearInning.isPending}
                          aria-label={`Clear inning ${inningNum}`}
                          title={`Clear inning ${inningNum}`}
                          className={`ml-1 w-4 h-4 inline-flex items-center justify-center rounded text-gray-500 hover:text-red-700 hover:bg-red-100 ${
                            inningHasAssignments ? '' : 'invisible'
                          }`}
                        >
                          <span className="text-sm leading-none">×</span>
                        </button>
                      </span>
                    </td>
                    {positions.map((pos) => {
                      const assignment = positionAssignments.find(
                        (a) => a.inning === inningNum && a.position === pos
                      )
                      const player = teamPlayers.find((p) => p.id === assignment?.player_id)

                      return (
                        <td
                          key={`${inning}-${pos}`}
                          className="border border-gray-300 px-0.5 py-0.5 text-center"
                        >
                          <PositionCell
                            position={pos}
                            inning={inningNum}
                            player={player}
                            attendingPlayers={attendingPlayers}
                            assignedPlayerIds={assignedPlayerIds}
                            blockedPitcherIds={blockedPitcherIds}
                            onSelect={(playerId) => handleSetPosition(inningNum, playerId, pos)}
                            onClear={() => {
                              if (player) {
                                clearPlayerInning.mutate(
                                  {
                                    gameId,
                                    inning: inningNum,
                                    playerId: player.id,
                                  },
                                  {
                                    onError: (err) => {
                                      window.alert(
                                        `Clear failed: ${err instanceof Error ? err.message : String(err)}`
                                      )
                                    },
                                  }
                                )
                              }
                            }}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>

    </div>
  )
}

interface NonAttendingGroupProps {
  label: string
  players: Array<{ id: string; first_name: string; last_name: string }>
  chipClass: string
}

function NonAttendingGroup({ label, players, chipClass }: NonAttendingGroupProps) {
  if (players.length === 0) return null
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-0.5">
        {label} ({players.length})
      </p>
      <div className="flex flex-wrap gap-0.5">
        {players.map((p) => (
          <span
            key={p.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('playerId', p.id)
            }}
            title="Drag into batting order to mark attending"
            className={`text-[10px] font-medium px-1 py-px border rounded cursor-move hover:opacity-80 ${chipClass}`}
          >
            {p.first_name} {p.last_name}
          </span>
        ))}
      </div>
    </div>
  )
}

interface PositionCellProps {
  position: string
  inning: number
  player: any
  attendingPlayers: any[]
  assignedPlayerIds: Set<string>
  blockedPitcherIds: Set<string>
  onSelect: (playerId: string) => void
  onClear: () => void
}

function PositionCell({ position, player, attendingPlayers, assignedPlayerIds, blockedPitcherIds, onSelect, onClear }: PositionCellProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number
    left: number
    openUpward: boolean
  } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 2)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2)
  }

  useEffect(() => {
    if (showDropdown) {
      // Defer until after layout so scrollHeight is correct
      const id = setTimeout(updateScroll, 0)
      return () => clearTimeout(id)
    }
  }, [showDropdown])

  const startAutoScroll = (dir: -1 | 1) => {
    if (rafRef.current != null) return
    const step = () => {
      const el = scrollRef.current
      if (!el) return
      el.scrollTop += dir * 6
      updateScroll()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }
  const stopAutoScroll = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }
  useEffect(() => () => stopAutoScroll(), [])

  // Click outside, Escape key, or PAGE scroll dismisses the dropdown.
  // Scrolls that originate inside the dropdown are ignored so the user can
  // scroll the player list (and the auto-scroll arrows can fire) without
  // closing the menu.
  useEffect(() => {
    if (!showDropdown) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return
      }
      setShowDropdown(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false)
    }
    const onScroll = (e: Event) => {
      const target = e.target as Node | null
      if (target && dropdownRef.current?.contains(target)) return
      setShowDropdown(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [showDropdown])
  const availablePlayers = attendingPlayers.filter((p) => {
    if (p.id === player?.id) return true
    if (position === 'P' && blockedPitcherIds.has(p.id)) return false
    if ((p as any).restricted_positions?.includes(position)) return false
    return !assignedPlayerIds.has(p.id)
  })

  const positionColors: Record<string, string> = {
    P: 'bg-yellow-300 text-yellow-950',
    RP: 'bg-yellow-300 text-yellow-950',
    C: 'bg-yellow-300 text-yellow-950',
    '1B': 'bg-blue-300 text-blue-950',
    '2B': 'bg-blue-300 text-blue-950',
    '3B': 'bg-blue-300 text-blue-950',
    SS: 'bg-blue-300 text-blue-950',
    LF: 'bg-green-300 text-green-950',
    LCF: 'bg-green-300 text-green-950',
    CF: 'bg-green-300 text-green-950',
    RCF: 'bg-green-300 text-green-950',
    RF: 'bg-green-300 text-green-950',
    BENCH: 'bg-gray-300 text-gray-900',
    BENCH2: 'bg-gray-300 text-gray-900',
    BENCH3: 'bg-gray-300 text-gray-900',
  }

  const toggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const openUpward = spaceBelow < 280 && spaceAbove > spaceBelow
      setDropdownPos({
        top: openUpward ? rect.top : rect.bottom,
        left: rect.left,
        openUpward,
      })
    }
    setShowDropdown((s) => !s)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`w-full px-1 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${positionColors[position] || 'bg-gray-200 text-gray-900'}`}
      >
        {player ? `${player.first_name.charAt(0)}. ${player.last_name}` : '-'}
      </button>

      {showDropdown && dropdownPos && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            left: dropdownPos.left,
            top: dropdownPos.openUpward ? 'auto' : dropdownPos.top + 4,
            bottom: dropdownPos.openUpward
              ? window.innerHeight - dropdownPos.top + 4
              : 'auto',
            zIndex: 50,
          }}
          className="w-40 bg-white border border-gray-300 rounded shadow-lg relative"
        >
          <button
            onClick={() => {
              if (player) onClear()
              setShowDropdown(false)
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b bg-white"
          >
            None
          </button>
          <div
            ref={scrollRef}
            onScroll={updateScroll}
            className="max-h-64 overflow-y-auto overscroll-contain"
          >
            {availablePlayers.map((p) => (
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
          {canScrollUp && (
            <div
              onMouseEnter={() => startAutoScroll(-1)}
              onMouseLeave={stopAutoScroll}
              aria-label="Scroll up"
              style={{ top: '2.5rem' }}
              className="absolute left-0 right-0 h-6 flex items-center justify-center text-gray-600 hover:text-blue-700 bg-gradient-to-b from-white via-white to-transparent pointer-events-auto cursor-n-resize text-xs select-none z-10"
            >
              ▲
            </div>
          )}
          {canScrollDown && (
            <div
              onMouseEnter={() => startAutoScroll(1)}
              onMouseLeave={stopAutoScroll}
              aria-label="Scroll down"
              className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center text-gray-600 hover:text-blue-700 bg-gradient-to-t from-white via-white to-transparent pointer-events-auto cursor-s-resize text-xs select-none z-10"
            >
              ▼
            </div>
          )}
        </div>
      )}
    </div>
  )
}
