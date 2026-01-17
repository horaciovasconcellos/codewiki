import { useState, useMemo } from 'react';

export type SortOrder = 'asc' | 'desc';

interface UseTableSortProps<T, F extends keyof T> {
  data: T[];
  initialField: F;
  initialOrder?: SortOrder;
}

interface UseTableSortReturn<T, F extends keyof T> {
  sortField: F;
  sortOrder: SortOrder;
  sortedData: T[];
  handleSort: (field: F) => void;
}

/**
 * Hook customizado para ordenação de tabelas
 * Elimina duplicação de código de sorting em múltiplos componentes
 */
export function useTableSort<T, F extends keyof T>({
  data,
  initialField,
  initialOrder = 'asc',
}: UseTableSortProps<T, F>): UseTableSortReturn<T, F> {
  const [sortField, setSortField] = useState<F>(initialField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);

  const handleSort = (field: F) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedData = useMemo(() => {
    const sorted = [...data];
    
    sorted.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Tratamento para valores undefined/null
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
      if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

      // Comparação para strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Comparação para números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Comparação para datas
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Comparação genérica (converte para string)
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortField, sortOrder]);

  return {
    sortField,
    sortOrder,
    sortedData,
    handleSort,
  };
}
