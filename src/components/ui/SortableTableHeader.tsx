import { Button } from '@/components/ui/button';
import { CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';
import { SortOrder } from '@/hooks/useTableSort';

interface SortableTableHeaderProps<F> {
  field: F;
  currentSortField: F;
  sortOrder: SortOrder;
  onSort: (field: F) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente reutilizável para headers de tabelas ordenáveis
 * Elimina duplicação de código de ícones e botões de ordenação
 */
export function SortableTableHeader<F>({
  field,
  currentSortField,
  sortOrder,
  onSort,
  children,
  className = '',
}: SortableTableHeaderProps<F>) {
  const getSortIcon = () => {
    if (currentSortField !== field) {
      return <CaretUpDown size={16} className="ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' 
      ? <CaretUp size={16} className="ml-1" />
      : <CaretDown size={16} className="ml-1" />;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-auto p-0 font-semibold hover:bg-transparent ${className}`}
      onClick={() => onSort(field)}
    >
      {children}
      {getSortIcon()}
    </Button>
  );
}
