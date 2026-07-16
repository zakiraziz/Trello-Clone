import { api } from '@/lib/api-client'
import { Board } from '../types'

interface GetBoardsParams {
  limit?: number
  offset?: number
}

export const getBoards = async (params?: GetBoardsParams): Promise<Board[]> => {
  const response = await api.get('/boards', { params })
  return response.data
}
