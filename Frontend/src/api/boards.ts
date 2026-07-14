// src/api/boards.ts
import api from './axios';
import type { AuthUser } from './auth';

export interface Board {
  id: string;
  name: string;
  description?: string;
  background_color?: string;
  is_archived?: boolean;
  created_at?: string;
  owner_id?: string;
  members?: Array<{ user: AuthUser; role: string }>;
  lists?: any[]; // populated when fetching a board with its lists & cards
}

// Get all boards for current user
export const fetchBoards = () => api.get<Board[]>('/boards');

// Get a single board with its lists & cards
export const fetchBoard = (boardId: string) => api.get<Board>(`/boards/${boardId}`);

// Create a new board
export const createBoard = (payload: {
  name: string;
  description?: string;
  background_color?: string;
}) => api.post<{ board: Board }>('/boards', payload);

// Update board details
export const updateBoard = (boardId: string, payload: Partial<Board>) =>
  api.put<{ board: Board }>(`/boards/${boardId}`, payload);

// Delete a board
export const deleteBoard = (boardId: string) => api.delete<{ message: string }>(`/boards/${boardId}`);

// Share board with another user
export const shareBoard = (boardId: string, email: string, role: string = 'editor') =>
  api.post(`/boards/${boardId}/share`, { email, role });

// Get board members
export const fetchBoardMembers = (boardId: string) => api.get(`/boards/${boardId}/members`);
