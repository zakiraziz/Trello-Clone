import { useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Generic button handler hook.
 * Supports navigation, async API calls, and loading state.
 *
 * @param options - configuration for the button action
 * @returns { onClick, loading }
 */
export function useButtonHandler({
  navigateTo,
  asyncAction,
  onSuccess,
  onError,
}: {
  /** Destination route for navigation */
  navigateTo?: string;
  /** Async function to call (e.g., API request) */
  asyncAction?: () => Promise<unknown>;
  /** Optional success callback */
  onSuccess?: () => void;
  /** Optional error callback */
  onError?: (error: unknown) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: asyncAction || (async () => {}),
    onSuccess: () => {
      setLoading(false);
      queryClient.invalidateQueries(); // generic invalidation, can be refined per use case
      onSuccess?.();
    },
    onError: (error) => {
      setLoading(false);
      onError?.(error);
    },
    retry: false,
  });

  const handleClick = (_e: MouseEvent<HTMLElement>) => {
    if (loading) return;
    if (navigateTo) {
      navigate(navigateTo);
      return;
    }
    if (asyncAction) {
      setLoading(true);
      mutation.mutate();
      return;
    }
    // No action defined – do nothing
  };

  return { onClick: handleClick, loading };
}
