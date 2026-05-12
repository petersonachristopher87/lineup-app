import { useQuery } from '@tanstack/react-query'
import { pitchLogService } from '@/lib/supabase/pitchLogService'

export function useTeamPitchLog(teamId: string | undefined) {
  return useQuery({
    queryKey: ['pitchLog', teamId],
    queryFn: () => (teamId ? pitchLogService.getTeamPitchLog(teamId) : []),
    enabled: !!teamId,
  })
}
