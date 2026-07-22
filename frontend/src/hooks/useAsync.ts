import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../api/client';

/** Ejecuta una promesa y expone {data, loading, error, reload}. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    return fn()
      .then(setData)
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run };
}
