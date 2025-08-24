"use client";

import { useQueryClient } from "@tanstack/react-query";

interface UseRefreshOptions {
  queryKeys?: string[][];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useRefresh(options: UseRefreshOptions = {}) {
  const queryClient = useQueryClient();
  const { queryKeys = [], onSuccess, onError } = options;

  const refresh = async () => {
    try {
      // If specific query keys are provided, only invalidate those
      if (queryKeys.length > 0) {
        await Promise.all(
          queryKeys.map(key => 
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      } else {
        // Otherwise, invalidate all queries
        await queryClient.invalidateQueries();
      }
      
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return { refresh };
}