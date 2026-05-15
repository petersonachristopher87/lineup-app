import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '@/lib/supabase/teamService'
import { useAuth } from '@/hooks/useAuth'

export type TeamRole = 'creator' | 'head_coach' | 'assistant_coach' | null

export function useUserTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getUserTeams(),
  })
}

export function useTeamById(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => (teamId ? teamService.getTeamById(teamId) : null),
    enabled: !!teamId,
  })
}

export function useTeamSettings(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teamSettings', teamId],
    queryFn: () => (teamId ? teamService.getTeamSettings(teamId) : null),
    enabled: !!teamId,
    // Settings can change between page navigations (Settings page → Lineup
    // page), so always refetch on mount instead of using cached data — the
    // request is cheap and prevents stale position columns.
    refetchOnMount: 'always',
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof teamService.createTeam>[0]) =>
      teamService.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      updates,
    }: {
      teamId: string
      updates: Parameters<typeof teamService.updateTeam>[1]
    }) => teamService.updateTeam(teamId, updates),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })
}

export function useUpdateTeamSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      updates,
    }: {
      teamId: string
      updates: any
    }) => teamService.updateTeamSettings(teamId, updates),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teamSettings', teamId] })
    },
  })
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => (teamId ? teamService.getTeamMembers(teamId) : []),
    enabled: !!teamId,
  })
}

export function useTeamCoaches(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teamCoaches', teamId],
    queryFn: () => (teamId ? teamService.getTeamCoaches(teamId) : []),
    enabled: !!teamId,
  })
}

/**
 * Returns the current user's role on a given team:
 *  - 'creator'         — original team creator (has all powers plus delete)
 *  - 'head_coach'      — team_members row with role 'head_coach'
 *  - 'assistant_coach' — team_members row with role 'assistant_coach'
 *  - null              — not loaded, or no relationship to this team
 *
 * Derived from existing queries (no extra fetch).
 */
export function useCurrentUserRole(teamId: string | undefined): TeamRole {
  const { user } = useAuth()
  const { data: team } = useTeamById(teamId)
  const { data: members = [] } = useTeamMembers(teamId)

  if (!user?.id || !teamId || !team) return null
  if (team.created_by === user.id) return 'creator'
  const member = members.find((m) => m.user_id === user.id)
  return member ? (member.role as TeamRole) : null
}

export function useCanManageTeam(teamId: string | undefined): boolean {
  const role = useCurrentUserRole(teamId)
  return role === 'creator' || role === 'head_coach'
}

export function useCanDeleteTeam(teamId: string | undefined): boolean {
  return useCurrentUserRole(teamId) === 'creator'
}

export function useInviteAssistant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      email,
    }: {
      teamId: string
      email: string
    }) => teamService.inviteAssistant(teamId, email),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] })
    },
  })
}
