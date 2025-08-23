"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  expandedItems: string[];
  toggleExpanded: (item: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedState = localStorage.getItem('stockpro-sidebar-state');
      if (savedState) {
        const { isCollapsed: savedCollapsed, expandedItems: savedExpanded } = JSON.parse(savedState);
        setIsCollapsed(savedCollapsed);
        setExpandedItems(savedExpanded || []);
      }
    } catch (error) {
      console.error('Failed to parse sidebar state:', error);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (isMounted) {
      const stateToSave = {
        isCollapsed,
        expandedItems
      };
      localStorage.setItem('stockpro-sidebar-state', JSON.stringify(stateToSave));
    }
  }, [isCollapsed, expandedItems, isMounted]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const toggleMobile = () => {
    setIsMobileOpen(prev => !prev);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const toggleExpanded = (item: string) => {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      isMobileOpen,
      toggleCollapse,
      toggleMobile,
      closeMobile,
      expandedItems,
      toggleExpanded
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}