"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface InfiniteScrollTableProps<T> {
  data: {
    pages: Array<{
      data: T[];
      pagination: {
        page: number;
        total: number;
        hasNext: boolean;
      };
    }>;
    pageParams: number[];
  };
  columns: {
    key: keyof T | string;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
    className?: string;
  }[];
  loading?: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage?: boolean;
  className?: string;
  rowHeight?: number;
  onRowClick?: (item: T) => void;
}

export function InfiniteScrollTable<T>({
  data,
  columns,
  loading = false,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage = false,
  className = "",
  rowHeight = 56,
  onRowClick,
}: InfiniteScrollTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  // Flatten all pages data
  const allItems = data.pages.flatMap(page => page.data);

  const virtualizer = useVirtualizer({
    count: allItems.length + (isFetchingNextPage ? 5 : 0), // Add skeleton rows for loading
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const renderCellContent = (column: typeof columns[0], item: T) => {
    if (column.render) {
      return column.render(
        column.key in item ? (item as any)[column.key] : undefined,
        item
      );
    }
    
    const value = column.key in item ? (item as any)[column.key] : undefined;
    return value?.toString() || "";
  };

  // Auto-scroll detection
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      setIsAutoScrollEnabled(isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Infinite scroll trigger
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || !isAutoScrollEnabled || !hasNextPage || isFetchingNextPage) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 200; // pixels from bottom to trigger load more
      
      if (scrollHeight - scrollTop <= clientHeight + threshold) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isAutoScrollEnabled]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {allItems.length} of {data.pages[0]?.pagination.total || 0} items
        </div>
        <div className="flex items-center space-x-2">
          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAutoScrollEnabled(true);
                fetchNextPage();
              }}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div 
        ref={tableContainerRef}
        className="border rounded-lg overflow-auto"
        style={{ height: `${Math.min(allItems.length * rowHeight + rowHeight * 3, 800)}px` }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && allItems.length === 0 ? (
              // Initial loading skeleton
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Virtualized rows
              virtualizer.getVirtualItems().map((virtualRow) => {
                const itemIndex = virtualRow.index;
                const item = allItems[itemIndex];
                
                // Show loading skeleton for items being fetched
                if (!item && isFetchingNextPage) {
                  return (
                    <TableRow
                      key={`loading-${virtualRow.index}`}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                }

                if (!item) return null;

                return (
                  <TableRow
                    key={itemIndex}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                    onClick={() => onRowClick?.(item)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {renderCellContent(column, item)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Empty state */}
      {!loading && allItems.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <div className="text-gray-500">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        </div>
      )}

      {/* End of data indicator */}
      {!hasNextPage && allItems.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          End of results
        </div>
      )}
    </div>
  );
}