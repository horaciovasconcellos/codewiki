import { useState, useMemo, useEffect } from 'react';

interface UseTablePaginationProps<T> {
  data: T[];
  initialPageSize?: number;
}

interface UseTablePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

/**
 * Hook customizado para paginação de tabelas
 * Elimina duplicação de código de paginação em múltiplos componentes
 */
export function useTablePagination<T>({
  data,
  initialPageSize = 10,
}: UseTablePaginationProps<T>): UseTablePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(data.length / pageSize);

  // Reset page quando dados mudam
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [data.length, totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  };
}
