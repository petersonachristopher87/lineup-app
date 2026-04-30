import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playerService } from '@/lib/supabase/playerService'
import type { Database } from '@/types/supabase'

type Player = Database['public']['Tables']['players']['Row']

export function useTeamPlayers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: () => (teamId ? playerService.getTeamPlayers(teamId) : []),
    enabled: !!teamId,
  })
}

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      playerData,
    }: {
      teamId: string
      playerData: Parameters<typeof playerService.createPlayer>[1]
    }) => playerService.createPlayer(teamId, playerData),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] })
    },
  })
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      playerId,
      updates,
    }: {
      playerId: string
      updates: Partial<Player>
    }) => playerService.updatePlayer(playerId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    },
  })
}

export function useDeletePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (playerId: string) => playerService.deletePlayer(playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    },
  })
}

export function useBulkCreatePlayers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      players,
    }: {
      teamId: string
      players: Array<{
        first_name: string
        last_name: string
        jersey_number?: string
        preferred_positions?: string[]
      }>
    }) => playerService.bulkCreatePlayers(teamId, players),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] })
    },
  })
}
