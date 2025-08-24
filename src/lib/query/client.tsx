"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import dynamic from "next/dynamic";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // Don't retry on 404 or 401 errors
              if (error?.status === 404 || error?.status === 401) {
                return false;
              }
              return failureCount < 3;
            },
            // Enable prefetching for better performance
            prefetch: true,
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry on 404 or 401 errors
              if (error?.status === 404 || error?.status === 401) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

// Dynamically import ReactQueryDevtools to avoid SSR issues
const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((mod) => mod.ReactQueryDevtools),
  { ssr: false }
);