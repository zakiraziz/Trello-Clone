import { createContext, useState, useEffect, ReactNode } from 'react'
import { API_BASE_URL } from '@/lib/api-url'

interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'business'
  avatar?: string
  notification_settings?: {
    email: Record<string, boolean>
    in_app: boolean
  }
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
  getAccessToken: () => string | null
}

export const AuthContext = createContext<AuthContextType | null>(null)

const API_BASE = API_BASE_URL

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getAccessToken = () => {
    return localStorage.getItem('token')
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUser({
            id: data.id,
            email: data.email,
            name: data.name,
            plan: data.plan ?? data.pro_tier ? 'pro' : 'free',
            avatar: data.avatar,
            notification_settings: data.notification_settings
          })
        } else {
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Failed to fetch user', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token)
    setUser(user)
  }

  const logout = async () => {
    const token = localStorage.getItem('token')
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
    } catch (e) {
      console.error('Logout request failed', e)
    }
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}