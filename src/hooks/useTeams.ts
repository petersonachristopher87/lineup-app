import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '@/lib/supabase/teamService'
import type { Database } from '@/types/supabase'

type Team = Database['public']['Tables']['teams']['Row']

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
    queryFn: () => (teamId ? teamService.getTeamMembers(teamId) : null),
    enabled: !!teamId,
  })
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
