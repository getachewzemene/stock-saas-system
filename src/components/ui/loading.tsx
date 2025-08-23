import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function Loading({ size = "md", text = "Loading...", className = "" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface LoadingCardProps {
  count?: number;
}

export function LoadingCard({ count = 1 }: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </>
  );
}

interface LoadingTableProps {
  rows?: number;
  columns?: number;
}

export function LoadingTable({ rows = 5, columns = 6 }: LoadingTableProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-6 gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  );
}