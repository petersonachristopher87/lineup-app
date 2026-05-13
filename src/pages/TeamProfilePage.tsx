import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeamById, useUpdateTeam } from '@/hooks/useTeams'

interface TeamProfilePageProps {
  teamId: string
}

export function TeamProfilePage({ teamId }: TeamProfilePageProps) {
  const navigate = useNavigate()
  const { data: team } = useTeamById(teamId)
  const updateTeam = useUpdateTeam()

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

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Team Settings</h1>
      <p className="text-sm text-gray-700 mb-4">{team.name}</p>

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
