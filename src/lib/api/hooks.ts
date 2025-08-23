"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Generic API fetch function
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Enhanced pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Generic hooks with enhanced caching
export function useApiQuery<T>(
  queryKey: string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    staleTime?: number;
    cacheTime?: number;
    prefetch?: boolean;
  }
) {
  return useQuery({
    queryKey,
    queryFn: () => apiFetch<T>(endpoint),
    staleTime: options?.staleTime || 1000 * 60 * 5, // 5 minutes default
    gcTime: options?.cacheTime || 1000 * 60 * 30, // 30 minutes default
    ...options,
  });
}

// Paginated query hook
export function useApiPaginatedQuery<T>(
  queryKey: string[],
  endpoint: string,
  params: PaginationParams,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: PaginatedResponse<T>) => void;
    onError?: (error: Error) => void;
    keepPreviousData?: boolean;
  }
) {
  // Ensure params is defined and has default values
  const safeParams = {
    page: params?.page || 1,
    limit: params?.limit || 20,
    search: params?.search,
    sortBy: params?.sortBy,
    sortOrder: params?.sortOrder,
    filters: params?.filters
  };

  const queryString = new URLSearchParams({
    page: safeParams.page.toString(),
    limit: safeParams.limit.toString(),
    ...(safeParams.search && { search: safeParams.search }),
    ...(safeParams.sortBy && { sortBy: safeParams.sortBy }),
    ...(safeParams.sortOrder && { sortOrder: safeParams.sortOrder }),
    ...(safeParams.filters && Object.entries(safeParams.filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value.toString();
      }
      return acc;
    }, {} as Record<string, string>)),
  }).toString();

  return useQuery({
    queryKey: [...queryKey, safeParams],
    queryFn: () => apiFetch<PaginatedResponse<T>>(`${endpoint}?${queryString}`),
    keepPreviousData: options?.keepPreviousData ?? true,
    staleTime: 1000 * 60 * 2, // 2 minutes for paginated data
    ...options,
  });
}

// Infinite query for virtual scrolling
export function useApiInfiniteQuery<T>(
  queryKey: string[],
  endpoint: string,
  params: Omit<PaginationParams, 'page'> & { limit: number },
  options?: {
    enabled?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    getNextPageParam?: (lastPage: any) => number | undefined;
  }
) {
  // Ensure params is defined and has default values
  const safeParams = {
    limit: params?.limit || 20,
    search: params?.search,
    sortBy: params?.sortBy,
    sortOrder: params?.sortOrder,
    filters: params?.filters
  };

  const queryString = new URLSearchParams({
    limit: safeParams.limit.toString(),
    ...(safeParams.search && { search: safeParams.search }),
    ...(safeParams.sortBy && { sortBy: safeParams.sortBy }),
    ...(safeParams.sortOrder && { sortOrder: safeParams.sortOrder }),
    ...(safeParams.filters && Object.entries(safeParams.filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value.toString();
      }
      return acc;
    }, {} as Record<string, string>)),
  }).toString();

  return useInfiniteQuery({
    queryKey: [...queryKey, safeParams],
    queryFn: ({ pageParam = 1 }) => 
      apiFetch<PaginatedResponse<T>>(`${endpoint}?${queryString}&page=${pageParam}`),
    getNextPageParam: (lastPage) => 
      options?.getNextPageParam?.(lastPage) ?? 
      (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
    staleTime: 1000 * 60 * 2, // 2 minutes for infinite data
    ...options,
  });
}

export function useApiMutation<T, V = any>(
  endpoint: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables?: V) => {
      const url = method === "DELETE" && typeof variables === "string" 
        ? `${endpoint}/${variables}` 
        : endpoint;
      
      const fetchOptions: RequestInit = {
        method,
      };

      if (method !== "DELETE" && variables) {
        fetchOptions.body = JSON.stringify(variables);
      }

      return apiFetch<T>(url, fetchOptions);
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      
      // Invalidate relevant queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: (error: Error) => {
      options?.onError?.(error);
      toast.error(error.message);
    },
  });
}

// Enhanced hooks with pagination support
export function useProducts(params?: PaginationParams) {
  const paginatedQuery = useApiPaginatedQuery<any[]>(
    ["products", params],
    "/products",
    params || { page: 1, limit: 20 }, // Provide default params if undefined
    {
      select: (data) => data,
      onError: (error) => {
        toast.error("Failed to fetch products");
      },
      enabled: !!params,
    }
  );
  
  const regularQuery = useApiQuery<{ products: any[] }>(
    ["products"],
    "/products",
    {
      select: (data) => data.products || [],
      onError: (error) => {
        toast.error("Failed to fetch products");
      },
      enabled: !params,
    }
  );

  return params ? paginatedQuery : regularQuery;
}

export function useUsers(params?: PaginationParams) {
  const paginatedQuery = useApiPaginatedQuery<any[]>(
    ["users", params],
    "/users",
    params || { page: 1, limit: 20 }, // Provide default params if undefined
    {
      select: (data) => data,
      onError: (error) => {
        toast.error("Failed to fetch users");
      },
      enabled: !!params,
    }
  );
  
  const regularQuery = useApiQuery<{ users: any[] }>(
    ["users"],
    "/users",
    {
      select: (data) => data.users || [],
      onError: (error) => {
        toast.error("Failed to fetch users");
      },
      enabled: !params,
    }
  );

  return params ? paginatedQuery : regularQuery;
}

export function useStock(params?: PaginationParams) {
  const paginatedQuery = useApiPaginatedQuery<any[]>(
    ["stock", params],
    "/stock",
    params || { page: 1, limit: 20 }, // Provide default params if undefined
    {
      select: (data) => data,
      onError: (error) => {
        toast.error("Failed to fetch stock data");
      },
      enabled: !!params,
    }
  );
  
  const regularQuery = useApiQuery<{ stockItems: any[] }>(
    ["stock"],
    "/stock",
    {
      select: (data) => data.stockItems || [],
      onError: (error) => {
        toast.error("Failed to fetch stock data");
      },
      enabled: !params,
    }
  );

  return params ? paginatedQuery : regularQuery;
}

export function useSales(params?: PaginationParams) {
  const paginatedQuery = useApiPaginatedQuery<any[]>(
    ["sales", params],
    "/sales",
    params || { page: 1, limit: 20 }, // Provide default params if undefined
    {
      select: (data) => data,
      onError: (error) => {
        toast.error("Failed to fetch sales data");
      },
      enabled: !!params,
    }
  );
  
  const regularQuery = useApiQuery<{ sales: any[] }>(
    ["sales"],
    "/sales",
    {
      select: (data) => data.sales || [],
      onError: (error) => {
        toast.error("Failed to fetch sales data");
      },
      enabled: !params,
    }
  );

  return params ? paginatedQuery : regularQuery;
}

export function useTransfers(params?: PaginationParams) {
  const paginatedQuery = useApiPaginatedQuery<any[]>(
    ["transfers", params],
    "/transfers",
    params || { page: 1, limit: 20 }, // Provide default params if undefined
    {
      select: (data) => data,
      onError: (error) => {
        toast.error("Failed to fetch transfers");
      },
      enabled: !!params,
    }
  );
  
  const regularQuery = useApiQuery<{ transfers: any[] }>(
    ["transfers"],
    "/transfers",
    {
      select: (data) => data.transfers || [],
      onError: (error) => {
        toast.error("Failed to fetch transfers");
      },
      enabled: !params,
    }
  );

  return params ? paginatedQuery : regularQuery;
}

export function useBatches(params?: PaginationParams) {
  const paginatedQuery = useApiPaginatedQuery<any[]>(
    ["batches", params],
    "/batches",
    params || { page: 1, limit: 20 }, // Provide default params if undefined
    {
      select: (data) => data,
      onError: (error) => {
        toast.error("Failed to fetch batches");
      },
      enabled: !!params,
    }
  );
  
  const regularQuery = useApiQuery<{ batches: any[] }>(
    ["batches"],
    "/batches",
    {
      select: (data) => data.batches || [],
      onError: (error) => {
        toast.error("Failed to fetch batches");
      },
      enabled: !params,
    }
  );

  return params ? paginatedQuery : regularQuery;
}

export function useAlerts(params?: PaginationParams) {
  const paginatedQuery = useApiPaginatedQuery<any[]>(
    ["alerts", params],
    "/alerts",
    params || { page: 1, limit: 20 }, // Provide default params if undefined
    {
      select: (data) => data,
      onError: (error) => {
        toast.error("Failed to fetch alerts");
      },
      enabled: !!params,
    }
  );
  
  const regularQuery = useApiQuery<{ alerts: any[] }>(
    ["alerts"],
    "/alerts",
    {
      select: (data) => data.alerts || [],
      onError: (error) => {
        toast.error("Failed to fetch alerts");
      },
      enabled: !params,
    }
  );

  return params ? paginatedQuery : regularQuery;
}

// Infinite scroll versions for virtualization
export function useProductsInfinite(params: Omit<PaginationParams, 'page'> & { limit: number }) {
  return useApiInfiniteQuery<any[]>(
    ["products", "infinite", params],
    "/products",
    params || { limit: 20 }, // Provide default params if undefined
    {
      onError: (error) => {
        toast.error("Failed to fetch products");
      },
    }
  );
}

export function useUsersInfinite(params: Omit<PaginationParams, 'page'> & { limit: number }) {
  return useApiInfiniteQuery<any[]>(
    ["users", "infinite", params],
    "/users",
    params || { limit: 20 }, // Provide default params if undefined
    {
      onError: (error) => {
        toast.error("Failed to fetch users");
      },
    }
  );
}

export function useStockInfinite(params: Omit<PaginationParams, 'page'> & { limit: number }) {
  return useApiInfiniteQuery<any[]>(
    ["stock", "infinite", params],
    "/stock",
    params || { limit: 20 }, // Provide default params if undefined
    {
      onError: (error) => {
        toast.error("Failed to fetch stock data");
      },
    }
  );
}

// Keep original hooks for backward compatibility
export function useCategories() {
  return useApiQuery<any[]>(
    ["categories"],
    "/categories",
    {
      onError: (error) => {
        toast.error("Failed to fetch categories");
      },
    }
  );
}

export function useAnalytics(params?: { startDate: string; endDate: string; tab?: string }) {
  const queryString = new URLSearchParams(params).toString();
  return useApiQuery<any>(
    ["analytics", params],
    `/analytics?${queryString}`,
    {
      enabled: !!params?.startDate && !!params?.endDate,
      onError: (error) => {
        toast.error("Failed to fetch analytics data");
      },
    }
  );
}

export function useReports() {
  return useApiQuery<any[]>(
    ["reports"],
    "/reports",
    {
      onError: (error) => {
        toast.error("Failed to fetch reports");
      },
    }
  );
}

export function useLocations() {
  return useApiQuery<any[]>(
    ["locations"],
    "/locations",
    {
      onError: (error) => {
        toast.error("Failed to fetch locations");
      },
    }
  );
}