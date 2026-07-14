import { api } from '@/lib/api-client'

export const moveCard = async (data: { cardId: string; listId: string; position?: number }) => {
  const response = await api.put(`/cards/${data.cardId}/move`, {
    list_id: data.listId,
    position: data.position || 0,
  })
  return response.data
}
