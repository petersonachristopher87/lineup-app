import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionAssignmentService } from '@/lib/supabase/positionAssignmentService'

export function useGamePositionAssignments(gameId: string | undefined) {
  return useQuery({
    queryKey: ['positionAssignments', gameId],
    queryFn: () => (gameId ? positionAssignmentService.getGamePositionAssignments(gameId) : []),
    enabled: !!gameId,
  })
}

export function useSetPositionAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      gameId,
      inning,
      player_id,
      position,
    }: {
      gameId: string
      inning: number
      player_id: string
      position: string
    }) => positionAssignmentService.setPositionAssignment(gameId, inning, player_id, position),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['positionAssignments', gameId] })
    },
  })
}

export function useDeletePositionAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) => positionAssignmentService.deletePositionAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positionAssignments'] })
    },
  })
}

export function useClearInningAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gameId, inning }: { gameId: string; inning: number }) =>
      positionAssignmentService.clearInningAssignments(gameId, inning),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['positionAssignments', gameId] })
    },
  })
}
