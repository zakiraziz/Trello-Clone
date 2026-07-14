import { api } from '@/lib/api-client'
import { LoginData, AuthResponse } from '../types'

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data)
  return response.data
}
