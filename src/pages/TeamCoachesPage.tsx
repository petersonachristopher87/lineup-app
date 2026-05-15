import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeamById, useTeamCoaches, useCanManageTeam } from '@/hooks/useTeams'
import { useAuth } from '@/hooks/useAuth'
import {
  useTeamInvitations,
  useCreateInvitation,
  useRemoveInvitation,
} from '@/hooks/useTeamInvitations'

interface Props {
  teamId: string
}

export function TeamCoachesPage({ teamId }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManageTeam = useCanManageTeam(teamId)
  const { data: team } = useTeamById(teamId)
  const { data: coaches = [] } = useTeamCoaches(teamId)
  const { data: invitations = [] } = useTeamInvitations(teamId)
  const createInvite = useCreateInvitation()
  const removeInvite = useRemoveInvitation()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'head_coach' | 'assistant_coach'>(
    'assistant_coach'
  )

  const pendingInvitations = invitations.filter((i) => !i.accepted_at)

  const handleInvite = () => {
    const email = inviteEmail.trim()
    if (!email || !/.+@.+\..+/.test(email)) {
      window.alert('Enter a valid email address.')
      return
    }
    createInvite.mutate(
      { teamId, email, role: inviteRole },
      {
        onSuccess: () => setInviteEmail(''),
        onError: (err) => {
          window.alert(
            `Invite failed: ${err instanceof Error ? err.message : String(err)}`
          )
        },
      }
    )
  }

  if (!team) {
    return <div className="text-center py-12 text-gray-900">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Coaches</h1>
      <p className="text-sm text-gray-700 mb-4">{team.name}</p>

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        {canManageTeam && (
          <p className="text-xs text-gray-600 mb-4">
            Invite assistant coaches by email. They'll be auto-added the next time
            they sign in to the app with that address.
          </p>
        )}

        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">
          Coaches
        </h3>
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md mb-4">
          {coaches.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-700">No coaches recorded yet.</li>
          ) : (
            coaches.map((c) => (
              <li
                key={c.user_id}
                className="px-4 py-2 text-sm flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">
                    {c.email}
                    {c.user_id === user?.id && (
                      <span className="text-xs text-gray-500 ml-2">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600">
                    {c.role.replace('_', ' ')} · joined{' '}
                    {new Date(c.joined_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                  {c.role.replace('_', ' ')}
                </span>
              </li>
            ))
          )}
        </ul>

        {canManageTeam && pendingInvitations.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">
              Pending invites
            </h3>
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md mb-4">
              {pendingInvitations.map((inv) => (
                <li
                  key={inv.id}
                  className="px-4 py-2 text-sm flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{inv.email}</p>
                    <p className="text-xs text-gray-600">
                      {inv.role.replace('_', ' ')} · sent{' '}
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {canManageTeam && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Revoke invite for ${inv.email}?`))
                          removeInvite.mutate(inv.id)
                      }}
                      className="text-xs font-semibold text-red-700 hover:text-red-900"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {canManageTeam && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">
              Invite a coach
            </h3>
            <div className="flex flex-wrap items-end gap-2">
              <input
                type="email"
                placeholder="coach@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'head_coach' | 'assistant_coach')
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
              >
                <option value="assistant_coach">Assistant coach</option>
                <option value="head_coach">Head coach</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={createInvite.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {createInvite.isPending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              The invitee gets access automatically when they sign in to the app
              with the email above — share the app URL with them separately.
            </p>
          </>
        )}
      </section>
    </div>
  )
}
