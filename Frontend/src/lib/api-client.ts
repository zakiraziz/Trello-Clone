import axios from 'axios'
import { toast } from 'sonner'
import { API_BASE_URL } from './api-url'

const API_URL = API_BASE_URL

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      toast.error('Server error', { description: 'Something went wrong on our end. Please try again later.' })
    } else if (!error.response) {
      // Network error (no response)
      toast.error('Network error', { description: 'Please check your internet connection.' })
    }
    return Promise.reject(error)
  }
)