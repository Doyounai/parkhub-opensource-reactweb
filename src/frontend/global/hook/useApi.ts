import { useState, useCallback } from 'react';

export const useApiMutation = <TData = any, TVariables = any, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) => {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<TError | null>(null);
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async (
      variables: TVariables,
      options?: { onSuccess?: (data: TData) => void; onError?: (error: TError) => void },
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (e: any) {
        setError(e);
        options?.onError?.(e);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [mutationFn],
  );

  const mutate = useCallback(
    (
      variables: TVariables,
      options?: { onSuccess?: (data: TData) => void; onError?: (error: TError) => void },
    ) => {
      mutateAsync(variables, options).catch(() => {
        // Errors are already handled and placed into state by mutateAsync.
        // mutate handles them silently here similar to TanStack usage,
        // but can be caught if using mutateAsync.
      });
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, data, error, isPending };
};
