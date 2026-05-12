import { FormEvent, useState } from 'react'
import { useCreateTeam, useUserTeams } from '@/hooks/useTeams'
import { useNavigate } from 'react-router-dom'

type Level = 'a' | 'aa' | 'aaa' | 'coast' | 'majors'
type Sport = 'baseball' | 'softball'

export function CreateTeamPage() {
  const [formData, setFormData] = useState<{
    name: string
    level: Level
    sport: Sport
    season_year: number
    copyFromTeamId: string
  }>({
    name: '',
    level: 'aa',
    sport: 'baseball',
    season_year: new Date().getFullYear(),
    copyFromTeamId: '',
  })

  const createTeam = useCreateTeam()
  const { data: existingTeams = [] } = useUserTeams()
  const navigate = useNavigate()

  const handleCopyFromChange = (sourceId: string) => {
    setFormData((prev) => {
      const next = { ...prev, copyFromTeamId: sourceId }
      const source = existingTeams.find((t) => t.id === sourceId)
      if (source) {
        // Inherit league level + sport from source as a starting point.
        next.level = source.level as Level
        next.sport = source.sport as Sport
      }
      return next
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const team = await createTeam.mutateAsync({
        name: formData.name,
        level: formData.level,
        sport: formData.sport,
        season_year: formData.season_year,
        copyFromTeamId: formData.copyFromTeamId || undefined,
      })
      navigate(`/team/${team.id}`)
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm font-semibold mb-4"
        >
          🏠 Home
        </button>
        <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Your Team</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {existingTeams.length > 0 && (
            <div>
              <label htmlFor="copy-from" className="block text-sm font-medium text-gray-700">
                Copy from existing team{' '}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <select
                id="copy-from"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.copyFromTeamId}
                onChange={(e) => handleCopyFromChange(e.target.value)}
              >
                <option value="">Don't copy — use level defaults</option>
                {existingTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.level.toUpperCase()} · {t.season_year}
                  </option>
                ))}
              </select>
              {formData.copyFromTeamId && (
                <p className="mt-1 text-xs text-gray-600">
                  Copies the active roster only (players + jersey #, birth
                  year, preferred/restricted positions). Settings come from
                  the new level's defaults. Games are not copied.
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Team Name
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
              League Level
            </label>
            <select
              id="level"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
            >
              <option value="a">A (Coach Pitch, ~6-7 yrs)</option>
              <option value="aa">AA (Machine Pitch ~7-8)</option>
              <option value="aaa">AAA (Kid Pitch ~8-10)</option>
              <option value="coast">Coach (~10-11)</option>
              <option value="majors">Majors (~11-12)</option>
            </select>
          </div>

          <div>
            <label htmlFor="sport" className="block text-sm font-medium text-gray-700">
              Sport
            </label>
            <select
              id="sport"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value as any })}
            >
              <option value="baseball">Baseball</option>
              <option value="softball">Softball</option>
            </select>
          </div>

          <div>
            <label htmlFor="season_year" className="block text-sm font-medium text-gray-700">
              Season Year
            </label>
            <input
              type="number"
              id="season_year"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.season_year}
              onChange={(e) => setFormData({ ...formData, season_year: parseInt(e.target.value) })}
            />
          </div>

          {createTeam.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                {createTeam.error instanceof Error ? createTeam.error.message : 'Failed to create team'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={createTeam.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createTeam.isPending ? 'Creating...' : 'Create Team'}
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}
