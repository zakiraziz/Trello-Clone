// src/hooks/lists.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { List } from '../types';

// Fetch all lists for a board
export const useLists = (boardId: string) => {
  return useQuery<List[]>({
    queryKey: ['lists', boardId],
    queryFn: async () => {
      const { data } = await api.get(`/boards/${boardId}/lists`);
      return data.lists;
    },
    enabled: !!boardId,
  });
};

// Create a new list
export const useCreateList = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newList: { title: string; position?: number }) => {
      const { data } = await api.post('/lists', { board_id: boardId, ...newList });
      return data.list;
    },
    onSuccess: (createdList) => {
      // Update list cache for this board
      queryClient.setQueryData(['lists', boardId], (old: List[] | undefined) => {
        return old ? [...old, createdList] : [createdList];
      });
    },
  });
};

// Update a list (title or position)
export const useUpdateList = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, updates }: { listId: string; updates: Partial<List> }) => {
      const { data } = await api.put(`/lists/${listId}`, updates);
      return data.list;
    },
    onSuccess: () => {
      // Invalidate and update the lists cache
      queryClient.invalidateQueries({ queryKey: ['lists', boardId] });
    },
  });
};

// Delete a list
export const useDeleteList = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      await api.delete(`/lists/${listId}`);
      return listId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['lists', boardId], (old: List[] | undefined) => {
        if (!old) return [];
        return old.filter((l) => l.id !== deletedId);
      });
    },
  });
};
