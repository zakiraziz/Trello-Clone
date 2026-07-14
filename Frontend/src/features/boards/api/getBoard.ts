import { api } from '@/lib/api-client'
import { BoardWithLists } from '../types'

export const getBoard = async (id: string): Promise<BoardWithLists> => {
  const response = await api.get(`/boards/${id}`)
  return response.data
}
