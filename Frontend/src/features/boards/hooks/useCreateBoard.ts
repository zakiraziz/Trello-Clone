import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

interface CreateBoardData {
  name: string
  description?: string
}

interface CreateBoardResponse {
  message: string
  board: {
    id: string
    name: string
    description?: string
    owner_id: string
    background_color?: string
    is_archived: boolean
    created_at: string
    updated_at: string
  }
}

export const useCreateBoard = () => {
  const queryClient = useQueryClient()

  return useMutation<CreateBoardResponse, Error, CreateBoardData>({
    mutationFn: async (data) => {
      const response = await api.post('/boards', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create board')
    },
  })
}