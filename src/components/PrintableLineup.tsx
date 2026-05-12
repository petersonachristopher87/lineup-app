import type { PositionCategories } from '@/lib/equityEngine'
import { formatDate } from '@/lib/utils'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number: string | null
}

interface Assignment {
  inning: number
  player_id: string
  position: string
}

interface Props {
  opponent: string
  gameDate: string
  teamName?: string
  battingOrder: string[]
  teamPlayers: Player[]
  positions: string[]
  positionAssignments: Assignment[]
  inningsCount: number
  positionCategories: PositionCategories | null
}

// Approximate field coordinates as % of a 100×100 container.
// (left%, top%) — top is 0 at the deep outfield, 100 at the catcher.
// RP is intentionally absent — it lives in the dugout, not on the field.
const FIELD_COORDS: Record<string, { left: number; top: number }> = {
  P: { left: 50, top: 60 },
  C: { left: 50, top: 84 },
  '1B': { left: 75, top: 55 },
  '2B': { left: 60, top: 38 },
  SS: { left: 40, top: 38 },
  '3B': { left: 25, top: 55 },
  LF: { left: 14, top: 18 },
  LCF: { left: 32, top: 12 },
  CF: { left: 50, top: 10 },
  RCF: { left: 68, top: 12 },
  RF: { left: 86, top: 18 },
}

function initialsFor(player: Player | undefined) {
  if (!player) return '—'
  const first = player.first_name.charAt(0).toUpperCase()
  const last = player.last_name
  return `${first}. ${last}`
}

export function PrintableLineup({
  opponent,
  gameDate,
  battingOrder,
  teamPlayers,
  positions,
  positionAssignments,
  inningsCount,
  positionCategories,
}: Props) {
  const playerById = new Map(teamPlayers.map((p) => [p.id, p]))

  // Split positions: fielding positions go on the field diagram, RP + bench
  // positions go in a "dugout" strip below so off-field players still know
  // their slot per inning.
  const benchSet = new Set(positionCategories?.bench ?? [])
  const fieldingPositions = positions.filter(
    (p) => !benchSet.has(p) && p !== 'RP' && FIELD_COORDS[p]
  )
  const hasRP = positions.includes('RP')
  const dugoutPositions: string[] = [
    ...(hasRP ? ['RP'] : []),
    ...positions.filter((p) => benchSet.has(p)),
  ]

  return (
    <div className="print-only" style={{ color: '#111827' }}>
      {/* PAGE 1: Batting Order */}
      <div className="print-page-break" style={{ padding: '4px 8px' }}>
        <header style={{ marginBottom: 8, borderBottom: '1.5px solid #111', paddingBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            vs {opponent}
          </h1>
          <p style={{ fontSize: 11, margin: '2px 0 0', color: '#374151' }}>
            {formatDate(gameDate)}
          </p>
        </header>

        <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Batting Order</h2>
        <ol style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
          {battingOrder.map((id, idx) => {
            const player = playerById.get(id)
            return (
              <li
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  borderBottom: '0.5px solid #d1d5db',
                  padding: '3px 2px',
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                <span style={{ width: 24, fontWeight: 700, fontSize: 13 }}>
                  {idx + 1}.
                </span>
                {player?.jersey_number && (
                  <span style={{ width: 32, color: '#6b7280' }}>
                    #{player.jersey_number}
                  </span>
                )}
                <span style={{ fontWeight: 600 }}>
                  {player ? `${player.first_name} ${player.last_name}` : 'Unknown'}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* PAGE 2: Defensive Positions overlaid on field */}
      <div style={{ padding: '4px 8px' }}>
        <header style={{ marginBottom: 24, borderBottom: '1.5px solid #111', paddingBottom: 4 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            vs {opponent} — Defensive Positions
          </h1>
          <p style={{ fontSize: 11, margin: '2px 0 0', color: '#374151' }}>
            {formatDate(gameDate)} · {inningsCount} innings
          </p>
        </header>

        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            maxWidth: 720,
            maxHeight: '92vh',
            margin: '0 auto',
            background: '#86efac', // light green grass
            borderRadius: 6,
          }}
        >
          {/* Outfield arc (subtle) */}
          <div
            style={{
              position: 'absolute',
              top: '0%',
              left: '0%',
              width: '100%',
              height: '100%',
              backgroundImage:
                'radial-gradient(circle at 50% 100%, transparent 60%, #65a30d 60.5%, #65a30d 62%, transparent 62.5%)',
              opacity: 0.4,
            }}
          />
          {/* Infield diamond (tan) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '70%',
              width: '50%',
              aspectRatio: '1 / 1',
              transform: 'translate(-50%, -50%) rotate(45deg)',
              background: '#d6c08c',
              border: '2px solid #92400e',
            }}
          />
          {/* Home plate marker */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '94%',
              width: 12,
              height: 12,
              transform: 'translate(-50%, -50%) rotate(45deg)',
              background: 'white',
              border: '1.5px solid #111',
            }}
          />

          {/* Fielding position cards */}
          {fieldingPositions.map((pos) => {
            const coord = FIELD_COORDS[pos]
            if (!coord) return null
            return (
              <div
                key={pos}
                style={{
                  position: 'absolute',
                  left: `${coord.left}%`,
                  top: `${coord.top}%`,
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid #111',
                  borderRadius: 6,
                  padding: '4px 6px',
                  minWidth: 78,
                  fontSize: 9,
                  lineHeight: 1.2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#111',
                    borderBottom: '1px solid #d1d5db',
                    paddingBottom: 2,
                    marginBottom: 2,
                  }}
                >
                  {pos}
                </div>
                {Array.from({ length: inningsCount }).map((_, idx) => {
                  const inning = idx + 1
                  const a = positionAssignments.find(
                    (x) => x.inning === inning && x.position === pos
                  )
                  const player = a ? playerById.get(a.player_id) : undefined
                  return (
                    <div
                      key={inning}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 4,
                      }}
                    >
                      <span style={{ color: '#6b7280', fontWeight: 600, width: 12 }}>
                        {inning}
                      </span>
                      <span style={{ flex: 1, textAlign: 'right' }}>
                        {initialsFor(player)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Dugout — RP + bench positions below the catcher */}
        {dugoutPositions.length > 0 && (
          <div
            style={{
              marginTop: 32,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
              border: '1px solid #92400e',
              background: '#fef3c7',
              borderRadius: 4,
              padding: '4px 6px',
            }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#78350f',
                margin: '0 0 4px',
              }}
            >
              Dugout
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(
                  dugoutPositions.length,
                  4
                )}, minmax(0, 1fr))`,
                gap: 6,
              }}
            >
              {dugoutPositions.map((pos) => (
                <div
                  key={pos}
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid #111',
                    borderRadius: 4,
                    padding: '3px 5px',
                    fontSize: 9,
                    lineHeight: 1.2,
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 10,
                      borderBottom: '1px solid #d1d5db',
                      paddingBottom: 1,
                      marginBottom: 2,
                    }}
                  >
                    {pos}
                  </div>
                  {Array.from({ length: inningsCount }).map((_, idx) => {
                    const inning = idx + 1
                    const a = positionAssignments.find(
                      (x) => x.inning === inning && x.position === pos
                    )
                    const player = a ? playerById.get(a.player_id) : undefined
                    return (
                      <div
                        key={inning}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 4,
                        }}
                      >
                        <span style={{ color: '#6b7280', fontWeight: 600, width: 12 }}>
                          {inning}
                        </span>
                        <span style={{ flex: 1, textAlign: 'right' }}>
                          {initialsFor(player)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
