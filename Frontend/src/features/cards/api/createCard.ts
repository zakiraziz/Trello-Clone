import { api } from '@/lib/api-client'
import { Card } from '../types'

export const createCard = async (data: { list_id: string; title: string }): Promise<Card> => {
  const response = await api.post('/cards', data)
  return response.data
}
