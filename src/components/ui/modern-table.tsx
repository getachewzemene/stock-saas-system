"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCaption 
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface ModernTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
    className?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
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
  onRowClick?: (item: T) => void;
  title?: string;
  description?: string;
  actions?: (item: T) => React.ReactNode;
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
}

export function ModernTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  className = "",
  onRowClick,
  title,
  description,
  actions,
  emptyState,
}: ModernTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronRight className="w-4 h-4 ml-1" /> : 
      <ChevronRight className="w-4 h-4 ml-1 rotate-90" />;
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

  const getCellAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const defaultEmptyState = {
    title: "No data available",
    description: "Try adjusting your filters or search terms",
    icon: null,
  };

  const currentEmptyState = emptyState || defaultEmptyState;

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
        <div className="overflow-hidden">
          <Table className={`w-full ${data.length === 0 ? 'overflow-x-hidden' : ''}`}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.key} 
                    className={`
                      ${getCellAlignment(column.align)}
                      ${column.width ? `w-${column.width}` : ''}
                      font-semibold text-foreground
                      hover:bg-muted/50 cursor-pointer
                      transition-colors
                      select-none
                    `}
                    onClick={() => handleSort(column.key.toString())}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {getSortIcon(column.key.toString())}
                    </div>
                  </TableHead>
                ))}
                {actions && (
                  <TableHead className="w-[100px] text-right">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: pagination?.limit || 10 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={getCellAlignment(column.align)}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-3">
                      {currentEmptyState.icon && (
                        <div className="text-muted-foreground">
                          {currentEmptyState.icon}
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-medium text-foreground">
                          {currentEmptyState.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentEmptyState.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                data.map((item, index) => (
                  <TableRow 
                    key={index}
                    className={`
                      ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                      transition-colors
                      border-b border-border
                    `}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={column.key} 
                        className={`
                          ${getCellAlignment(column.align)}
                          ${column.className || ''}
                          py-4
                        `}
                      >
                        {renderCellContent(column, item)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="text-right py-4">
                        {actions(item)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Pagination */}
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
    </Card>
  );
}

// Re-export the original table components for backward compatibility
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";