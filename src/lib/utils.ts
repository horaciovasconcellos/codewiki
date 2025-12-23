import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { IdadeWIT } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calcularIdadeWIT(dataAbertura: string): IdadeWIT {
  const hoje = new Date();
  const abertura = new Date(dataAbertura);
  const diffTime = Math.abs(hoje.getTime() - abertura.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hoje';
  } else if (diffDays <= 7) {
    return 'Semana';
  } else if (diffDays <= 30) {
    return '1 Mês';
  } else {
    return 'Mais de 1 Mês';
  }
}

export function formatarData(data: string): string {
  if (!data) return '';
  
  // Se já estiver no formato YYYY-MM-DD, converter diretamente sem usar new Date
  // para evitar problemas de timezone
  if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  
  // Fallback para outros formatos
  const date = new Date(data);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
