export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'business'
  avatar?: string
  notification_settings?: {
    email: Record<string, boolean>
    in_app: boolean
  }
  created_at?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  user: User
}
