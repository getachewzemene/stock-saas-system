"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface NavigationContextType {
  currentPath: string;
  navigate: (path: string) => void;
  isLoading: boolean;
  navigationHistory: string[];
  goBack: () => void;
  goForward: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Initialize navigation history with current path
    setNavigationHistory([pathname]);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Update current path when pathname changes
      setNavigationHistory(prev => {
        const newHistory = [...prev, pathname];
        // Keep only last 10 entries
        return newHistory.slice(-10);
      });
      
      // Reset loading state when pathname changes
      setIsLoading(false);
    }
  }, [pathname, isMounted]);

  const navigate = (path: string) => {
    if (path === pathname) return;
    
    setIsLoading(true);
    
    // Use Next.js router for client-side navigation
    router.push(path);
    
    // Fallback: Reset loading state after a reasonable timeout
    // This handles cases where navigation might not trigger pathname change
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Store timeout ID for cleanup
    return () => clearTimeout(loadingTimeout);
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const previousPath = navigationHistory[navigationHistory.length - 2];
      navigate(previousPath);
    }
  };

  const goForward = () => {
    // This would be implemented if we had forward navigation
    // For now, we'll keep it simple
  };

  return (
    <NavigationContext.Provider value={{
      currentPath: pathname,
      navigate,
      isLoading,
      navigationHistory,
      goBack,
      goForward
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}