import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lineupService } from '@/lib/supabase/lineupService'

export function useGameLineup(gameId: string | undefined) {
  return useQuery({
    queryKey: ['lineup', gameId],
    queryFn: () => (gameId ? lineupService.getGameLineup(gameId) : null),
    enabled: !!gameId,
  })
}

export function useCreateOrUpdateLineup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gameId, batting_order }: { gameId: string; batting_order: string[] }) =>
      lineupService.createOrUpdateLineup(gameId, batting_order),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['lineup', gameId] })
    },
  })
}
