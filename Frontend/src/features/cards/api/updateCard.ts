import { api } from '@/lib/api-client'

export const updateCard = async (id: string, data: { title?: string; description?: string; due_date?: string; is_completed?: boolean }) => {
  const response = await api.put(`/cards/${id}`, data)
  return response.data
}
