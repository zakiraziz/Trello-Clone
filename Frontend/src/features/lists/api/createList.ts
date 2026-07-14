import { api } from '@/lib/api-client'
import { List } from '../types'

export const createList = async (data: { board_id: string; title: string }): Promise<List> => {
  const response = await api.post('/lists', data)
  return response.data
}
