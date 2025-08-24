"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface UseRefreshOptions {
  queryKeys?: string[][];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showShimmer?: boolean;
}

export function useRefresh(options: UseRefreshOptions = {}) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { queryKeys = [], onSuccess, onError, showShimmer = true } = options;

  const refresh = async (refreshFunction?: () => Promise<void>) => {
    setIsRefreshing(true);
    try {
      // If a custom refresh function is provided, call it first
      if (refreshFunction) {
        await refreshFunction();
      }
      
      // If specific query keys are provided, only invalidate those
      if (queryKeys.length > 0) {
        await Promise.all(
          queryKeys.map(key => 
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      } else {
        // Otherwise, invalidate all queries except layout/navigation queries
        await queryClient.invalidateQueries({
          predicate: (query) => {
            // Exclude layout and navigation queries from refresh
            const queryKey = query.queryKey;
            return !(
              Array.isArray(queryKey) && 
              (queryKey.includes('layout') || 
               queryKey.includes('navigation') ||
               queryKey.includes('sidebar') ||
               queryKey.includes('user') ||
               queryKey.includes('settings'))
            );
          }
        });
      }
      
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing, showShimmer };
}