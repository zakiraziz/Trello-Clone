import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface MoveCardData {
  cardId: string
  listId: string
  position: number
}

export interface MoveListData {
  listId: string
  position: number
}

export const useMoveCard = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MoveCardData) => {
      const response = await api.put(`/cards/${data.cardId}/move`, {
        list_id: data.listId,
        position: data.position,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to move card')
    },
  })
}

export const useMoveList = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MoveListData) => {
      const response = await api.put(`/lists/${data.listId}/move`, {
        position: data.position,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to move list')
    },
  })
}