"use client";

import React from "react";

interface ShimmerCardProps {
  className?: string;
  children: React.ReactNode;
}

export function ShimmerCard({ className = "", children }: ShimmerCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface ShimmerLineProps {
  width?: string;
  height?: string;
  className?: string;
  delay?: number;
}

export function ShimmerLine({ 
  width = "100%", 
  height = "1rem", 
  className = "",
  delay = 0 
}: ShimmerLineProps) {
  return (
    <div 
      className={`shimmer bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={{ 
        width, 
        height,
        animationDelay: `${delay}ms`
      }}
    />
  );
}

interface ShimmerCircleProps {
  size?: string;
  className?: string;
  delay?: number;
}

export function ShimmerCircle({ 
  size = "3rem", 
  className = "",
  delay = 0 
}: ShimmerCircleProps) {
  return (
    <div 
      className={`shimmer bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}
      style={{ 
        width: size, 
        height: size,
        animationDelay: `${delay}ms`
      }}
    />
  );
}

interface ShimmerRectangleProps {
  width?: string;
  height?: string;
  className?: string;
  delay?: number;
}

export function ShimmerRectangle({ 
  width = "100%", 
  height = "8rem", 
  className = "",
  delay = 0 
}: ShimmerRectangleProps) {
  return (
    <div 
      className={`shimmer bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
      style={{ 
        width, 
        height,
        animationDelay: `${delay}ms`
      }}
    />
  );
}

interface ShimmerAvatarProps {
  size?: string;
  className?: string;
  delay?: number;
}

export function ShimmerAvatar({ 
  size = "2.5rem", 
  className = "",
  delay = 0 
}: ShimmerAvatarProps) {
  return (
    <div 
      className={`shimmer bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}
      style={{ 
        width: size, 
        height: size,
        animationDelay: `${delay}ms`
      }}
    />
  );
}

interface ShimmerButtonProps {
  width?: string;
  height?: string;
  className?: string;
  delay?: number;
}

export function ShimmerButton({ 
  width = "6rem", 
  height = "2.5rem", 
  className = "",
  delay = 0 
}: ShimmerButtonProps) {
  return (
    <div 
      className={`shimmer bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
      style={{ 
        width, 
        height,
        animationDelay: `${delay}ms`
      }}
    />
  );
}

interface ShimmerTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function ShimmerTable({ 
  rows = 5, 
  columns = 4, 
  className = "" 
}: ShimmerTableProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <ShimmerLine key={`header-${i}`} height="1.5rem" delay={i * 100} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <ShimmerLine 
              key={`cell-${rowIndex}-${colIndex}`} 
              height="2rem" 
              delay={(rowIndex * columns + colIndex) * 50} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ShimmerStatsCardProps {
  className?: string;
  delay?: number;
}

export function ShimmerStatsCard({ className = "", delay = 0 }: ShimmerStatsCardProps) {
  return (
    <ShimmerCard className={`p-6 ${className}`}>
      <div className="space-y-4">
        <ShimmerLine width="60%" height="1rem" delay={delay} />
        <ShimmerLine width="40%" height="2rem" delay={delay + 100} />
        <ShimmerLine width="80%" height="0.75rem" delay={delay + 200} />
      </div>
    </ShimmerCard>
  );
}

interface ShimmerChartProps {
  type?: "line" | "bar" | "pie";
  className?: string;
  delay?: number;
}

export function ShimmerChart({ 
  type = "line", 
  className = "", 
  delay = 0 
}: ShimmerChartProps) {
  return (
    <ShimmerCard className={`p-6 ${className}`}>
      <div className="space-y-4">
        <ShimmerLine width="30%" height="1.5rem" delay={delay} />
        <div className="h-64 relative">
          {type === "line" && (
            <div className="absolute inset-0 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <ShimmerLine 
                  key={`line-${i}`} 
                  width="100%" 
                  height="0.5rem" 
                  delay={delay + i * 50} 
                />
              ))}
            </div>
          )}
          {type === "bar" && (
            <div className="absolute inset-0 flex items-end justify-between">
              {Array.from({ length: 12 }).map((_, i) => (
                <ShimmerRectangle 
                  key={`bar-${i}`} 
                  width="6%" 
                  height={`${Math.random() * 60 + 20}%`} 
                  delay={delay + i * 50} 
                />
              ))}
            </div>
          )}
          {type === "pie" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShimmerCircle size="12rem" delay={delay} />
            </div>
          )}
        </div>
      </div>
    </ShimmerCard>
  );
}

interface ShimmerListProps {
  items?: number;
  className?: string;
  showAvatar?: boolean;
}

export function ShimmerList({ 
  items = 5, 
  className = "", 
  showAvatar = true 
}: ShimmerListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={`item-${i}`} className="flex items-center space-x-3 p-3">
          {showAvatar && <ShimmerAvatar delay={i * 100} />}
          <div className="flex-1 space-y-2">
            <ShimmerLine width="70%" height="1rem" delay={i * 100 + 50} />
            <ShimmerLine width="50%" height="0.75rem" delay={i * 100 + 100} />
          </div>
          <ShimmerButton width="4rem" height="2rem" delay={i * 100 + 150} />
        </div>
      ))}
    </div>
  );
}