import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/login'
import { useAuth } from './useAuth'
import { useToast } from '../../../../hooks/useToast'

export const useLogin = () => {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const { success, error } = useToast()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      success('Welcome back! 🎉')
      navigate('/dashboard')
    },
    onError: (err: any) => {
      error(err.response?.data?.error || 'Login failed')
    },
  })
}
