// src/hooks/members.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Member } from '../types';

// Fetch members of a board
export const useBoardMembers = (boardId: string) => {
  return useQuery<Member[]>({
    queryKey: ['members', boardId],
    queryFn: async () => {
      const { data } = await api.get(`/boards/${boardId}/members`);
      return data.members;
    },
    enabled: !!boardId,
  });
};

// Add a member to a board
export const useAddMember = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/boards/${boardId}/members`, { user_id: userId });
      return data.member as Member;
    },
    onSuccess: (newMember) => {
      queryClient.setQueryData(['members', boardId], (old: Member[] | undefined) => {
        return old ? [...old, newMember] : [newMember];
      });
    },
  });
};

// Remove a member from a board
export const useRemoveMember = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/boards/${boardId}/members/${memberId}`);
      return memberId;
    },
    onSuccess: (removedId) => {
      queryClient.setQueryData(['members', boardId], (old: Member[] | undefined) => {
        if (!old) return [];
        return old.filter((m) => m.id !== removedId);
      });
    },
  });
};
