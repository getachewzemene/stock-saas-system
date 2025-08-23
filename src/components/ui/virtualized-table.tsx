"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableVirtualized
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getColumnConfig, 
  getCellClasses, 
  getCellStyles, 
  getHeaderClasses, 
  getHeaderStyles 
} from "@/components/ui/table-column-utils.ts";

interface VirtualizedTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
    className?: string;
    // Override default column configuration
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    align?: 'left' | 'center' | 'right';
    truncate?: boolean;
    wrap?: boolean;
  }[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    showItemsPerPageSelector?: boolean;
  };
  className?: string;
  rowHeight?: number;
  onRowClick?: (item: T) => void;
  estimatedItemSize?: number;
  overscan?: number;
  title?: string;
  description?: string;
}

export function VirtualizedTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  className = "",
  rowHeight = 56,
  onRowClick,
  estimatedItemSize = 56,
  overscan = 5,
  title,
  description,
}: VirtualizedTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Handle scroll events for better performance
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set new timeout to reset scrolling state
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);
  
  // Initialize virtualizer with proper configuration
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => estimatedItemSize, [estimatedItemSize]),
    overscan,
    scrollMargin: rowHeight, // Account for header height
  });

  // Calculate column configuration
  const getMergedColumnConfig = (column: typeof columns[0]) => {
    // Get default config based on column key
    const defaultConfig = getColumnConfig(column.key.toString());
    
    // Override with custom configuration if provided
    return {
      ...defaultConfig,
      width: column.width || defaultConfig.width,
      minWidth: column.minWidth || defaultConfig.minWidth,
      maxWidth: column.maxWidth || defaultConfig.maxWidth,
      align: column.align || defaultConfig.align,
      truncate: column.truncate !== undefined ? column.truncate : defaultConfig.truncate,
      wrap: column.wrap !== undefined ? column.wrap : defaultConfig.wrap,
    };
  };

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-border">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      
      <CardContent className="p-0">
        {/* Table Container with proper virtualization */}
        <div 
          ref={tableContainerRef}
          className={`border-b border-border overflow-auto relative custom-scrollbar touch-pan-x table-container-mobile ${data.length === 0 ? 'overflow-x-hidden' : ''}`}
          style={{ 
            height: `${Math.min(data.length * estimatedItemSize + rowHeight + 16, 600)}px`,
            maxHeight: '70vh'
          }}
          onScroll={handleScroll}
        >
          <TableVirtualized className="w-full" style={{ tableLayout: 'fixed' }}>
            {/* Sticky Header */}
            <TableHeader 
              style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 20, 
                backgroundColor: 'hsl(var(--muted) / 0.5)',
                borderBottom: '2px solid hsl(var(--border))',
                boxShadow: '0 2px 4px hsl(var(--border) / 0.2)'
              }}
            >
              <TableRow>
                {columns.map((column) => {
                  const config = getMergedColumnConfig(column);
                  return (
                    <TableHead 
                      key={column.key} 
                      className={getHeaderClasses(config, column.className)}
                      style={getHeaderStyles(config)}
                    >
                      {column.header}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            {/* Virtualized Table Body */}
            <TableBody style={{ position: 'relative' }}>
              {loading ? (
                // Loading skeleton with proper alignment
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {Array.from({ length: Math.min(10, pagination?.limit || 10) }).map((_, index) => (
                    <TableRow 
                      key={index} 
                      style={{ 
                        position: 'relative',
                        height: `${rowHeight}px`,
                        zIndex: 1
                      }}
                    >
                      {columns.map((column) => {
                        const config = getMergedColumnConfig(column);
                        return (
                          <TableCell 
                            key={column.key} 
                            className={getCellClasses(config, column.className)}
                            style={getCellStyles(config)}
                          >
                            <Skeleton className="h-4 w-3/4" />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </div>
              ) : (
                // Virtualized rows with proper positioning
                <div
                  style={{
                    position: 'relative',
                    height: `${virtualizer.getTotalSize()}px`,
                    zIndex: 1,
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const item = data[virtualRow.index];
                    return (
                      <TableRow
                        key={virtualRow.index}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                        onClick={() => onRowClick?.(item)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                          zIndex: 1,
                          willChange: isScrolling ? 'transform' : 'auto',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        {columns.map((column) => {
                          const config = getMergedColumnConfig(column);
                          const content = renderCellContent(column, item);
                          return (
                            <TableCell 
                              key={column.key} 
                              className={getCellClasses(config, column.className)}
                              style={getCellStyles(config)}
                            >
                              {config.truncate ? (
                                <div className="truncate" title={content?.toString()}>
                                  {content}
                                </div>
                              ) : (
                                content
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </div>
              )}
            </TableBody>
          </TableVirtualized>
        </div>
      </CardContent>

      {/* Pagination Component */}
      {pagination && !loading && data.length > 0 && (
        <div className="px-6 py-4 border-t border-border bg-muted/20">
          <TablePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={pagination.onPageChange}
            onItemsPerPageChange={pagination.onItemsPerPageChange}
            showItemsPerPageSelector={pagination.showItemsPerPageSelector !== false}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && data.length === 0 && (
        <div className="px-6 py-12">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No data available</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
          </div>
        </div>
      )}
    </Card>
  );
}