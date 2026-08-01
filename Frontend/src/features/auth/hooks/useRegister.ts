import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { register } from '../api/register'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/useToast'

export const useRegister = () => {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const { success, error } = useToast()

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        plan: data.user.plan || 'free',
        avatar: data.user.avatar,
      }
      setAuth(data.token, user)
      success('Account created!')
      navigate('/dashboard')
    },
    onError: (err: unknown) => {
      const errorData = err as { response?: { data?: { error?: string } } }
      error(errorData.response?.data?.error || 'Registration failed')
    },
  })
}
