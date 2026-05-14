import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUserTeams, useDeleteTeam } from '@/hooks/useTeams'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FirstTimeGuide } from '@/components/FirstTimeGuide'
import { ProfileMenu } from '@/components/ProfileMenu'
import { teamInvitationService } from '@/lib/supabase/teamInvitationService'

const GUIDE_DISMISSED_KEY = 'lineup-app:guide-dismissed'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: teams = [], isLoading } = useUserTeams()
  const deleteTeam = useDeleteTeam()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Auto-claim any pending coach invitations addressed to this user's email.
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const pending = await teamInvitationService.listPendingForMe()
        if (cancelled || pending.length === 0) return
        for (const inv of pending) {
          await teamInvitationService.claim(inv.id)
        }
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      } catch (err) {
        console.error('Failed to claim coach invitations:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, queryClient])

  const [showGuide, setShowGuide] = useState(false)
  // Auto-open the guide once for first-time users (no teams + never dismissed).
  useEffect(() => {
    if (isLoading) return
    if (typeof window === 'undefined') return
    const dismissed = window.localStorage.getItem(GUIDE_DISMISSED_KEY) === '1'
    if (!dismissed && teams.length === 0) {
      setShowGuide(true)
    }
  }, [isLoading, teams.length])

  const closeGuide = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GUIDE_DISMISSED_KEY, '1')
    }
    setShowGuide(false)
  }

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    const confirmed = window.confirm(
      `Delete "${teamName}"? This will also delete all players, games, lineups, and attendance for this team. This cannot be undone.`
    )
    if (confirmed) {
      deleteTeam.mutate(teamId, {
        onError: (err) => {
          console.error('Delete failed:', err)
          window.alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`)
        },
      })
    }
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
              <button
                onClick={() => setShowGuide(true)}
                title="First-time walkthrough"
                className="text-blue-700 hover:text-blue-900 text-sm font-semibold"
              >
                Guide ?
              </button>
              <ProfileMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Your Teams</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/templates')}
              className="bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2 px-4 rounded border border-gray-400"
            >
              Manage Templates
            </button>
            <button
              onClick={() => navigate('/create-team')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Team
            </button>
          </div>
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
                className="relative bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow text-center"
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <button
                  aria-label={`Delete ${team.name}`}
                  disabled={deleteTeam.isPending}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTeam(team.id, team.name)
                  }}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
                {(team as any).logo_url && (
                  <img
                    src={(team as any).logo_url}
                    alt={`${team.name} logo`}
                    className="w-12 h-12 rounded object-cover mx-auto mb-2"
                  />
                )}
                <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)} - {team.level.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Season: {team.season_year}</p>
                <button
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/team/${team.id}`)
                  }}
                >
                  Manage Team
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <FirstTimeGuide open={showGuide} onClose={closeGuide} />
    </div>
  )
}
