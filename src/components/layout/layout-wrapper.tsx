"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebar } from "@/lib/sidebar/context";
import { useRefresh } from "@/lib/hooks/use-refresh";
import { toast } from "sonner";
import { 
  ShimmerStatsCard, 
  ShimmerChart, 
  ShimmerTable, 
  ShimmerList 
} from "@/components/ui/shimmer";

interface LayoutWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
  showShimmer?: boolean;
  shimmerType?: "dashboard" | "table" | "list" | "chart" | "custom";
}

export function LayoutWrapper({ 
  children, 
  title, 
  subtitle, 
  showNewButton = false, 
  onNewClick,
  onRefreshClick,
  isRefreshing = false,
  showShimmer = true,
  shimmerType = "dashboard"
}: LayoutWrapperProps) {
  const { isMobileOpen, closeMobile } = useSidebar();
  
  const { refresh, isRefreshing: isLayoutRefreshing } = useRefresh({
    onSuccess: () => {
      toast.success("Data refreshed successfully");
    },
    onError: (error) => {
      toast.error("Failed to refresh data");
    },
    showShimmer
  });

  const handleRefresh = () => {
    if (onRefreshClick) {
      onRefreshClick();
    } else {
      refresh();
    }
  };

  const refreshingState = isRefreshing || isLayoutRefreshing;

  const renderShimmerContent = () => {
    switch (shimmerType) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Stats cards shimmer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerStatsCard key={i} delay={i * 100} />
              ))}
            </div>
            
            {/* Charts shimmer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ShimmerChart type="line" delay={400} />
              <ShimmerChart type="bar" delay={600} />
            </div>
            
            {/* Recent activity shimmer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ShimmerTable rows={5} columns={4} delay={800} />
              </div>
              <div>
                <ShimmerList items={5} delay={1000} />
              </div>
            </div>
          </div>
        );
        
      case "table":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerStatsCard key={i} delay={i * 100} />
              ))}
            </div>
            <ShimmerTable rows={8} columns={6} delay={400} />
          </div>
        );
        
      case "list":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerStatsCard key={i} delay={i * 100} />
              ))}
            </div>
            <ShimmerList items={10} delay={400} />
          </div>
        );
        
      case "chart":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ShimmerChart type="line" delay={200} />
              <ShimmerChart type="bar" delay={400} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ShimmerChart type="pie" delay={600} />
              <ShimmerChart type="line" delay={800} />
              <ShimmerChart type="bar" delay={1000} />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerStatsCard key={i} delay={i * 100} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <ShimmerChart key={i} type="line" delay={400 + i * 200} />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative z-10">
      {/* Sidebar - remains static during refresh */}
      <Sidebar />
      
      {/* Main content */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden relative z-20 transition-colors duration-300 ${
          isMobileOpen ? 'bg-black bg-opacity-50' : ''
        }`}
        onClick={isMobileOpen ? closeMobile : undefined}
      >
        {/* Header - remains static during refresh */}
        <Header 
          title={title} 
          subtitle={subtitle} 
          showNewButton={showNewButton} 
          onNewClick={onNewClick}
          onRefreshClick={handleRefresh}
          isRefreshing={refreshingState}
        />
        
        {/* Page content - this is where shimmer effects will be shown */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-6">
            {refreshingState && showShimmer ? (
              renderShimmerContent()
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}