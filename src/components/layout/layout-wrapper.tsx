"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebar } from "@/lib/sidebar/context";

interface LayoutWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
}

export function LayoutWrapper({ 
  children, 
  title, 
  subtitle, 
  showNewButton = false, 
  onNewClick 
}: LayoutWrapperProps) {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative z-10">
      <Sidebar />
      
      {/* Main content */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden relative z-20 transition-colors duration-300 ${
          isMobileOpen ? 'bg-black bg-opacity-50' : ''
        }`}
        onClick={isMobileOpen ? closeMobile : undefined}
      >
        <Header 
          title={title} 
          subtitle={subtitle} 
          showNewButton={showNewButton} 
          onNewClick={onNewClick} 
        />
        
        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}