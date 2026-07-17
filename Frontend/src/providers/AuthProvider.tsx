import { createContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'business'
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiBase}/auth/me`, {
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
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    try {
      await fetch(`${apiBase}/auth/logout`, {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
