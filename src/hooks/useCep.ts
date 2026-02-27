import { useState, useCallback } from "react";

interface CepData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
}

interface UseCepReturn {
  fetchCep: (cep: string) => Promise<CepData | null>;
  loading: boolean;
  error: string | null;
}

export function useCep(): UseCepReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCep = useCallback(async (rawCep: string): Promise<CepData | null> => {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) {
      setError("CEP deve ter 8 dígitos");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      if (!res.ok) {
        setError("CEP não encontrado");
        return null;
      }
      const data: CepData = await res.json();
      return data;
    } catch {
      setError("Erro ao buscar CEP");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchCep, loading, error };
}
