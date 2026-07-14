// src/api/auth.ts
import api from './axios';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  proTier: boolean;
  avatar?: string;
}

export interface LoginResponse {
  user: AuthUser;
  token?: string; // token will be set via HttpOnly cookie, kept for compatibility
}

export interface RegisterResponse {
  user: AuthUser;
  token?: string;
  message: string;
}

export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { email, password });

export const register = (email: string, password: string, name: string) =>
  api.post<RegisterResponse>('/auth/register', { email, password, name });

export const logout = () => api.post('/auth/logout');

export const fetchCurrentUser = () => api.get<{ user: AuthUser }>('/auth/me');
