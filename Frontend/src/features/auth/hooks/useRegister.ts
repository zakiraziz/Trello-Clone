import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { register } from '../api/register'
import { useAuth } from './useAuth'
import { useToast } from '../../../../hooks/useToast'

export const useRegister = () => {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const { success, error } = useToast()

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      success('Account created! 🎉')
      navigate('/dashboard')
    },
    onError: (err: any) => {
      error(err.response?.data?.error || 'Registration failed')
    },
  })
}
