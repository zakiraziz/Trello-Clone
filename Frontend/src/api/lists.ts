// src/api/lists.ts
import api from './axios';


export interface List {
  id: string;
  board_id: string;
  title: string;
  position?: number;
  cards?: any[];
}

// Get all lists for a board
export const fetchLists = (boardId: string) => api.get<List[]>(`/lists?board_id=${boardId}`);

// Create a new list
export const createList = (payload: { board_id: string; title: string; position?: number }) =>
  api.post<{ list: List }>('/lists', payload);

// Update a list
export const updateList = (listId: string, payload: Partial<List>) =>
  api.put<{ list: List }>(`/lists/${listId}`, payload);

// Delete a list
export const deleteList = (listId: string) => api.delete<{ message: string }>(`/lists/${listId}`);

// Reorder lists within a board
export const reorderLists = (boardId: string, listOrder: string[]) =>
  api.put(`/lists/reorder/${boardId}`, { listOrder });
