// src/hooks/cards.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Card } from '../types';

// Fetch all cards for a given list
export const useCards = (listId: string) => {
  return useQuery<Card[]>({
    queryKey: ['cards', listId],
    queryFn: async () => {
      const { data } = await api.get(`/lists/${listId}/cards`);
      return data.cards;
    },
    enabled: !!listId,
  });
};

// Create a new card in a list
export const useCreateCard = (listId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCard: { title: string; description?: string; position?: number; due_date?: string; assigned_to?: string }) => {
      const { data } = await api.post('/cards', { list_id: listId, ...newCard });
      return data.card as Card;
    },
    // Optimistic update: add card to cache immediately
    onMutate: async (newCard) => {
      await queryClient.cancelQueries({ queryKey: ['cards', listId] });
      const previous = queryClient.getQueryData<Card[]>(['cards', listId]);
      const optimisticCard: Card = {
        id: 'temp-id-' + Date.now(),
        list_id: listId,
        title: newCard.title,
        description: newCard.description,
        position: newCard.position,
        due_date: newCard.due_date,
        assigned_to: newCard.assigned_to,
        is_completed: false,
      } as Card;
      queryClient.setQueryData(['cards', listId], (old: Card[] | undefined) => {
        return old ? [...old, optimisticCard] : [optimisticCard];
      });
      return { previous };
    },
    onError: (_err, _newCard, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['cards', listId], context.previous);
      }
    },
    onSuccess: (createdCard) => {
      // Replace temp card with server response
      queryClient.setQueryData(['cards', listId], (old: Card[] | undefined) => {
        if (!old) return [createdCard];
        return old.map((c) => (c.id?.startsWith('temp-id-') ? createdCard : c));
      });
      // Invalidate board cache if needed
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
};

// Update an existing card
export const useUpdateCard = (listId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, updates }: { cardId: string; updates: Partial<Card> }) => {
      const { data } = await api.put(`/cards/${cardId}`, updates);
      return data.card as Card;
    },
    onSuccess: (updatedCard) => {
      queryClient.setQueryData(['cards', listId], (old: Card[] | undefined) => {
        if (!old) return [updatedCard];
        return old.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
};

// Delete a card
export const useDeleteCard = (listId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/cards/${cardId}`);
      return cardId;
    },
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: ['cards', listId] });
      const previous = queryClient.getQueryData<Card[]>(['cards', listId]);
      queryClient.setQueryData(['cards', listId], (old: Card[] | undefined) => {
        if (!old) return [];
        return old.filter((c) => c.id !== cardId);
      });
      return { previous };
    },
    onError: (_err, _cardId, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['cards', listId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
};

// Move card to another list (drag‑and‑drop)
export const useMoveCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, toListId, position }: { cardId: string; toListId: string; position?: number }) => {
      const { data } = await api.put(`/cards/${cardId}/move`, { list_id: toListId, position });
      return data.card as Card;
    },
    // Optimistic update will handle removal from old list and addition to new list
    onMutate: async ({ cardId, toListId, position }) => {
      // Snapshot both source and destination caches
      await queryClient.cancelQueries({ queryKey: ['cards'] });
      const previousCaches: Record<string, Card[] | undefined> = {};
      const allListQueries = queryClient.getQueryCache().findAll({ queryKey: ['cards'] });
      allListQueries.forEach((q) => {
        const key = q.queryKey as string[];
        if (key.length === 2) {
          const listId = key[1] as string;
          previousCaches[listId] = q.state.data as Card[];
        }
      });
      // Remove from any list that contains it
      Object.entries(previousCaches).forEach(([listId, cards]) => {
        if (cards) {
          queryClient.setQueryData(['cards', listId], cards.filter((c) => c.id !== cardId));
        }
      });
      // Add to destination list optimistically
      queryClient.setQueryData(['cards', toListId], (old: Card[] | undefined) => {
        const movedCard: Card = {
          id: cardId,
          list_id: toListId,
          title: 'Moving...',
          position,
        } as Card;
        return old ? [...old, movedCard] : [movedCard];
      });
      return { previousCaches };
    },
    onError: (_err, _variables, context: any) => {
      // Rollback all caches
      if (context?.previousCaches) {
        Object.entries(context.previousCaches).forEach(([listId, cards]) => {
          queryClient.setQueryData(['cards', listId], cards);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
};
