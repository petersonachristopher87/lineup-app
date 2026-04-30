import { FormEvent, useState } from 'react'
import { useCreateTeam } from '@/hooks/useTeams'
import { useNavigate } from 'react-router-dom'

export function CreateTeamPage() {
  const [formData, setFormData] = useState({
    name: '',
    level: 'aa' as const,
    sport: 'baseball' as const,
    season_year: new Date().getFullYear(),
  })

  const createTeam = useCreateTeam()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const team = await createTeam.mutateAsync(formData)
      navigate(`/team/${team.id}`)
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Your Team</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <option value="single_a">Single-A (Coach Pitch, ~6-7 yrs)</option>
              <option value="aa">AA (Kid Pitch, ~8-9 yrs)</option>
              <option value="aaa">AAA (~10-11 yrs)</option>
              <option value="coast">Coast (~11-12 yrs)</option>
              <option value="majors">Majors (~11-12 yrs)</option>
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
  )
}
