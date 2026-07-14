export interface User {
  id: string
  email: string
  name: string
  proTier: boolean
  avatar?: string
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
  user: User
}
