import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export const useStarBoard = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ boardId, isStarred }: { boardId: string; isStarred: boolean }) => {
      const { data } = await api.patch(`/boards/${boardId}/star`, { isStarred })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}