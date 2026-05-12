import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamInvitationService } from '@/lib/supabase/teamInvitationService'

export function useTeamInvitations(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teamInvitations', teamId],
    queryFn: () => (teamId ? teamInvitationService.listForTeam(teamId) : []),
    enabled: !!teamId,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      email,
      role,
    }: {
      teamId: string
      email: string
      role: 'head_coach' | 'assistant_coach'
    }) => teamInvitationService.create(teamId, email, role),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teamInvitations', teamId] })
    },
  })
}

export function useRemoveInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) =>
      teamInvitationService.remove(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamInvitations'] })
    },
  })
}
