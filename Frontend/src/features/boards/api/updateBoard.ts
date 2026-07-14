import { api } from '@/lib/api-client'
import { Board } from '../types'

export const updateBoard = async (id: string, data: { name?: string; description?: string }): Promise<Board> => {
  const response = await api.put(`/boards/${id}`, data)
  return response.data
}
