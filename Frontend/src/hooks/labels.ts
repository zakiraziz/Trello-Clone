// src/hooks/labels.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Label } from '../types';

// Fetch all labels for a board
export const useLabels = (boardId: string) => {
  return useQuery<Label[]>({
    queryKey: ['labels', boardId],
    queryFn: async () => {
      const { data } = await api.get(`/boards/${boardId}/labels`);
      return data.labels;
    },
    enabled: !!boardId,
  });
};

// Create a label
export const useCreateLabel = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLabel: { name: string; color: string }) => {
      const { data } = await api.post('/labels', { board_id: boardId, ...newLabel });
      return data.label as Label;
    },
    onSuccess: (createdLabel) => {
      queryClient.setQueryData(['labels', boardId], (old: Label[] | undefined) => {
        return old ? [...old, createdLabel] : [createdLabel];
      });
    },
  });
};

// Update a label
export const useUpdateLabel = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ labelId, updates }: { labelId: string; updates: Partial<Label> }) => {
      const { data } = await api.put(`/labels/${labelId}`, updates);
      return data.label as Label;
    },
    onSuccess: (updatedLabel) => {
      queryClient.setQueryData(['labels', boardId], (old: Label[] | undefined) => {
        if (!old) return [updatedLabel];
        return old.map((l) => (l.id === updatedLabel.id ? updatedLabel : l));
      });
    },
  });
};

// Delete a label
export const useDeleteLabel = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string) => {
      await api.delete(`/labels/${labelId}`);
      return labelId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['labels', boardId], (old: Label[] | undefined) => {
        if (!old) return [];
        return old.filter((l) => l.id !== deletedId);
      });
    },
  });
};
