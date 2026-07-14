// src/hooks/reorderLists.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { List } from '../types';

/**
 * Mutation to reorder lists for a board.
 * Accepts the boardId and an ordered array of list IDs.
 */
export const useReorderLists = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listOrder: string[]) => {
      const { data } = await api.put(`/lists/reorder/${boardId}`, { listOrder });
      return data;
    },
    // Optimistic update of the list order in the cache.
    onMutate: async (newOrder: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['lists', boardId] });
      const previous = queryClient.getQueryData<List[]>(['lists', boardId]);
      // Reorder based on newOrder array
      queryClient.setQueryData(['lists', boardId], (old: List[] | undefined) => {
        if (!old) return [];
        const map = new Map(old.map((l) => [l.id, l]));
        return newOrder.map((id) => map.get(id)!).filter(Boolean);
      });
      return { previous };
    },
    onError: (_err, _newOrder, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['lists', boardId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
};
