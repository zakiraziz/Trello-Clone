import { api } from '@/lib/api-client'
import { Board } from '../types'

export const getBoards = async (): Promise<Board[]> => {
  const response = await api.get('/boards')
  return response.data
}
