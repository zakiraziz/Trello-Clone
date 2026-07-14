import { api } from '@/lib/api-client'
import { RegisterData, AuthResponse } from '../types'

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data)
  return response.data
}
