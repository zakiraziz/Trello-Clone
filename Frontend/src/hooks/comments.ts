// src/hooks/comments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Comment } from '../types';

// Fetch comments for a card
export const useComments = (cardId: string) => {
  return useQuery<Comment[]>({
    queryKey: ['comments', cardId],
    queryFn: async () => {
      const { data } = await api.get(`/cards/${cardId}/comments`);
      return data.comments;
    },
    enabled: !!cardId,
  });
};

// Add a comment to a card
export const useAddComment = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(`/cards/${cardId}/comments`, { content });
      return data.comment as Comment;
    },
    // Optimistic update: append comment locally
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['comments', cardId] });
      const previous = queryClient.getQueryData<Comment[]>(['comments', cardId]);
      const optimistic: Comment = {
        id: 'temp-' + Date.now(),
        card_id: cardId,
        user_id: 'self', // will be replaced by server
        content,
        created_at: new Date().toISOString(),
      } as Comment;
      queryClient.setQueryData(['comments', cardId], (old: Comment[] | undefined) => (old ? [...old, optimistic] : [optimistic]));
      return { previous };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['comments', cardId], context.previous);
      }
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData(['comments', cardId], (old: Comment[] | undefined) => {
        if (!old) return [newComment];
        // Replace temp comment
        return old.map((c) => (c.id?.startsWith('temp-') ? newComment : c));
      });
    },
  });
};

// Delete a comment
export const useDeleteComment = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/cards/${cardId}/comments/${commentId}`);
      return commentId;
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comments', cardId] });
      const previous = queryClient.getQueryData<Comment[]>(['comments', cardId]);
      queryClient.setQueryData(['comments', cardId], (old: Comment[] | undefined) => (old ? old.filter((c) => c.id !== commentId) : []));
      return { previous };
    },
    onError: (_err, _commentId, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['comments', cardId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
    },
  });
};
