import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionAssignmentService } from '@/lib/supabase/positionAssignmentService'

export function useGamePositionAssignments(gameId: string | undefined) {
  return useQuery({
    queryKey: ['positionAssignments', gameId],
    queryFn: () => (gameId ? positionAssignmentService.getGamePositionAssignments(gameId) : []),
    enabled: !!gameId,
  })
}

export function useTeamCompletedAssignments(teamId: string | undefined) {
  return useQuery({
    queryKey: ['completedAssignments', teamId],
    queryFn: () =>
      teamId ? positionAssignmentService.getTeamCompletedAssignments(teamId) : [],
    enabled: !!teamId,
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

export function useBulkSetPositionAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      gameId,
      assignments,
    }: {
      gameId: string
      assignments: Array<{ inning: number; player_id: string; position: string }>
    }) => positionAssignmentService.bulkSetPositionAssignments(gameId, assignments),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['positionAssignments', gameId] })
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

export function useClearPlayerInningAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      gameId,
      inning,
      playerId,
    }: {
      gameId: string
      inning: number
      playerId: string
    }) => positionAssignmentService.clearPlayerInningAssignment(gameId, inning, playerId),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['positionAssignments', gameId] })
    },
  })
}

export function useClearGameAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (gameId: string) => positionAssignmentService.clearGameAssignments(gameId),
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['positionAssignments', gameId] })
    },
  })
}

export function useReorderInnings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gameId, oldOrder }: { gameId: string; oldOrder: number[] }) =>
      positionAssignmentService.reorderInnings(gameId, oldOrder),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['positionAssignments', gameId] })
    },
  })
}
