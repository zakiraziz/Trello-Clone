import { api } from '@/lib/api-client'
import { Board } from '../types'

export const createBoard = async (data: { name: string; description?: string }): Promise<Board> => {
  const response = await api.post('/boards', data)
  return response.data
}
