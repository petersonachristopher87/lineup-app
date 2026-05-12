import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useTeamById,
  useTeamMembers,
  useUpdateTeam,
} from '@/hooks/useTeams'
import { useAuth } from '@/hooks/useAuth'
import {
  useTeamInvitations,
  useCreateInvitation,
  useRemoveInvitation,
} from '@/hooks/useTeamInvitations'

interface TeamProfilePageProps {
  teamId: string
}

export function TeamProfilePage({ teamId }: TeamProfilePageProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: team } = useTeamById(teamId)
  const { data: members = [] } = useTeamMembers(teamId)
  const { data: invitations = [] } = useTeamInvitations(teamId)
  const updateTeam = useUpdateTeam()
  const createInvite = useCreateInvitation()
  const removeInvite = useRemoveInvitation()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'head_coach' | 'assistant_coach'>(
    'assistant_coach'
  )

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

  const pendingInvitations = invitations.filter((i) => !i.accepted_at)

  const [name, setName] = useState('')
  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear())
  const [logoUrl, setLogoUrl] = useState<string>('')

  useEffect(() => {
    if (team) {
      setName(team.name)
      setSeasonYear(team.season_year)
      setLogoUrl((team as any).logo_url ?? '')
    }
  }, [team])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') setLogoUrl(result)
    }
    reader.readAsDataURL(file)
  }

  if (!team) {
    return <div className="text-center py-12 text-gray-900">Loading...</div>
  }

  const handleSave = () => {
    if (!name.trim()) {
      window.alert('Team name cannot be empty')
      return
    }
    updateTeam.mutate(
      {
        teamId,
        updates: {
          name: name.trim(),
          season_year: seasonYear,
          logo_url: logoUrl.trim() || null,
        },
      },
      {
        onSuccess: () => navigate(`/team/${teamId}`),
        onError: (err) => {
          window.alert(
            `Save failed: ${err instanceof Error ? err.message : String(err)}`
          )
        },
      }
    )
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

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Team Profile</h1>

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team details</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Team name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">Season year</span>
            <input
              type="number"
              value={seasonYear}
              onChange={(e) => setSeasonYear(parseInt(e.target.value) || seasonYear)}
              className="mt-1 block w-32 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            />
          </label>

          <div>
            <span className="block text-sm font-semibold text-gray-900 mb-1">Team logo</span>
            <div className="flex items-start gap-3">
              <div
                className="w-16 h-16 flex-shrink-0 rounded border border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-500 overflow-hidden"
                aria-label="Team logo preview"
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${team.name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>No logo</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Paste image URL (https://…)"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    id="logo-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs text-gray-700"
                  />
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs font-semibold text-red-700 hover:text-red-900"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  Pick an image file or paste a URL. Uploaded files are stored
                  inline (data URL) — keep them small (&lt;100 KB).
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Sport ({team.sport}) and level ({team.level.toUpperCase()}) cannot be changed
            after creation. Create a new team if you need to switch.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Coaches</h2>
        <p className="text-xs text-gray-600 mb-4">
          Invite assistant coaches by email. They'll be auto-added the next
          time they sign in to the app with that address.
        </p>

        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">
          Active coaches
        </h3>
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md mb-4">
          {members.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-700">No coaches recorded yet.</li>
          ) : (
            members.map((m) => (
              <li
                key={m.id}
                className="px-4 py-2 text-sm flex items-center justify-between"
              >
                <span className="text-gray-900">
                  {m.user_id === user?.id ? 'You' : `Coach (${m.user_id.slice(0, 8)}…)`}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                  {m.role.replace('_', ' ')}
                </span>
              </li>
            ))
          )}
        </ul>

        {pendingInvitations.length > 0 && (
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
                      {inv.role.replace('_', ' ')} ·{' '}
                      sent {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Revoke invite for ${inv.email}?`))
                        removeInvite.mutate(inv.id)
                    }}
                    className="text-xs font-semibold text-red-700 hover:text-red-900"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

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
      </section>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => navigate(`/team/${teamId}`)}
          className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={updateTeam.isPending}
          className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {updateTeam.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
