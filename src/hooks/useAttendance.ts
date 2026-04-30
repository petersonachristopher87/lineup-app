import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceService } from '@/lib/supabase/attendanceService'

export function useGameAttendance(gameId: string | undefined) {
  return useQuery({
    queryKey: ['gameAttendance', gameId],
    queryFn: () => (gameId ? attendanceService.getGameAttendance(gameId) : []),
    enabled: !!gameId,
  })
}

export function useSetAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      gameId,
      playerId,
      status,
    }: {
      gameId: string
      playerId: string
      status: 'attending' | 'absent' | 'maybe'
    }) => attendanceService.setAttendance(gameId, playerId, status),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['gameAttendance', gameId] })
    },
  })
}

export function useInitializeGameAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gameId, playerIds }: { gameId: string; playerIds: string[] }) =>
      attendanceService.initializeGameAttendance(gameId, playerIds),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['gameAttendance', gameId] })
    },
  })
}
