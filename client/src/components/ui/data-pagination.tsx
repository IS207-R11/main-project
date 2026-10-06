'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faAnglesLeft,
  faAnglesRight,
} from '@fortawesome/free-solid-svg-icons';

export interface DataPaginationProps {
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export const DataPagination: React.FC<DataPaginationProps> = ({
  currentPage,
  totalRecords,
  pageSize,
  onPageChange,
  isLoading = false,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  if (totalRecords <= 0 && totalPages <= 1) {
    return null;
  }

  const startRecord = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(totalRecords, currentPage * pageSize);

  // Calculate pages list to display (max 5 buttons + ellipsis)
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-muted-foreground ${className}`}
    >
      <div className="font-medium text-[11px] sm:text-xs">
        Hiển thị <strong className="text-foreground font-bold">{startRecord}</strong> -{' '}
        <strong className="text-foreground font-bold">{endRecord}</strong> trong{' '}
        <strong className="text-foreground font-bold">{totalRecords}</strong> bản ghi (Trang{' '}
        <strong className="text-foreground font-bold">{currentPage}</strong> / {totalPages})
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(1)}
          className="h-8 w-8 p-0"
          title="Trang đầu"
        >
          <FontAwesomeIcon icon={faAnglesLeft} className="text-[10px]" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2 gap-1 text-xs font-semibold"
          title="Trang trước"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
          <span className="hidden sm:inline">Trước</span>
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === currentPage ? 'default' : 'outline'}
                size="sm"
                disabled={isLoading}
                onClick={() => onPageChange(p)}
                className={`h-8 w-8 p-0 text-xs font-bold ${
                  p === currentPage ? 'shadow-xs' : ''
                }`}
              >
                {p}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2 gap-1 text-xs font-semibold"
          title="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 p-0"
          title="Trang cuối"
        >
          <FontAwesomeIcon icon={faAnglesRight} className="text-[10px]" />
        </Button>
      </div>
    </div>
  );
};
