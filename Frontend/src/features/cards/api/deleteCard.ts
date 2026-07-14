import { api } from '@/lib/api-client'

export const deleteCard = async (id: string) => {
  await api.delete(`/cards/${id}`)
}
