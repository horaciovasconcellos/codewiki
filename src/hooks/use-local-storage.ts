import { useState, useEffect } from 'react';

/**
 * Hook customizado para substituir useKV do GitHub Spark
 * Usa localStorage para persistência de dados
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Tenta pegar do localStorage
      const item = window.localStorage.getItem(key);
      
      // Se o item não existir ou for null/undefined, retorna o valor inicial
      if (!item || item === 'undefined' || item === 'null') {
        return initialValue;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Erro ao carregar ${key} do localStorage:`, error);
      return initialValue;
    }
  });

  // Escuta mudanças no localStorage (de outras abas ou atualizações diretas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Erro ao atualizar ${key}:`, error);
        }
      }
    };

    // Também verifica mudanças locais periodicamente
    const intervalId = setInterval(() => {
      try {
        const item = window.localStorage.getItem(key);
        const currentValue = item ? JSON.parse(item) : initialValue;
        // Atualiza apenas se mudou
        if (JSON.stringify(currentValue) !== JSON.stringify(storedValue)) {
          setStoredValue(currentValue);
        }
      } catch (error) {
        // Silencioso
      }
    }, 1000); // Verifica a cada 1 segundo

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [key, initialValue, storedValue]);

  // Função para atualizar o valor
  const setValue = (value: T) => {
    try {
      // Salva no estado
      setStoredValue(value);
      // Salva no localStorage
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}
