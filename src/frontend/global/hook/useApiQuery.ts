import { useState, useEffect, useCallback } from 'react';

export const useApiQuery = <TData = any, TError = Error>(
  queryFn: () => Promise<TData>,
  options?: { enabled?: boolean; pollingInterval?: number },
) => {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<TError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const enabled = options?.enabled ?? true;
  const pollingInterval = options?.pollingInterval;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
      return result;
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (enabled) {
      fetch();
      if (pollingInterval) {
        intervalId = setInterval(fetch, pollingInterval);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [enabled, pollingInterval, fetch]);

  return { data, error, isLoading, refetch: fetch };
};
