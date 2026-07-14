// src/hooks/boards.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Board } from '../types';

// Fetch all boards for current user
export const useBoards = () => {
  return useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const { data } = await api.get('/boards');
      return data.boards;
    },
  });
};

// Fetch a single board with its lists and cards
export const useBoard = (boardId: string) => {
  return useQuery<Board>({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const { data } = await api.get(`/boards/${boardId}`);
      return data.board;
    },
    enabled: !!boardId,
  });
};

// Create a new board
export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newBoard: { title: string; description?: string }) => {
      const { data } = await api.post('/boards', newBoard);
      return data.board;
    },
    onSuccess: (createdBoard) => {
      // Optimistically add to boards list
      queryClient.setQueryData(['boards'], (old: Board[] | undefined) => {
        return old ? [...old, createdBoard] : [createdBoard];
      });
    },
  });
};

// Update board details
export const useUpdateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, updates }: { boardId: string; updates: Partial<Board> }) => {
      const { data } = await api.put(`/boards/${boardId}`, updates);
      return data.board;
    },
    onSuccess: (updatedBoard) => {
      queryClient.invalidateQueries({ queryKey: ['board', updatedBoard.id] });
      queryClient.setQueryData(['boards'], (old: Board[] | undefined) => {
        if (!old) return [updatedBoard];
        return old.map((b) => (b.id === updatedBoard.id ? updatedBoard : b));
      });
    },
  });
};

// Delete a board
export const useDeleteBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (boardId: string) => {
      await api.delete(`/boards/${boardId}`);
      return boardId;
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({ queryKey: ['board', deletedId] });
      queryClient.setQueryData(['boards'], (old: Board[] | undefined) => {
        if (!old) return [];
        return old.filter((b) => b.id !== deletedId);
      });
    },
  });
};
