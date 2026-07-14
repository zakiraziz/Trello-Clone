import { api } from '@/lib/api-client'

export const deleteBoard = async (id: string): Promise<void> => {
  await api.delete(`/boards/${id}`)
}
