import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gameService } from '@/lib/supabase/gameService'

export function useTeamGames(teamId: string | undefined) {
  return useQuery({
    queryKey: ['games', teamId],
    queryFn: () => (teamId ? gameService.getTeamGames(teamId) : []),
    enabled: !!teamId,
  })
}

export function useGameById(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => (gameId ? gameService.getGameById(gameId) : null),
    enabled: !!gameId,
  })
}

export function useCreateGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      gameData,
    }: {
      teamId: string
      gameData: Parameters<typeof gameService.createGame>[1]
    }) => gameService.createGame(teamId, gameData),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['games', teamId] })
    },
  })
}

export function useUpdateGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      gameId,
      updates,
    }: {
      gameId: string
      updates: any
    }) => gameService.updateGame(gameId, updates),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useDeleteGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (gameId: string) => gameService.deleteGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}
