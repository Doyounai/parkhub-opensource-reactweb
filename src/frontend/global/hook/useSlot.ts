import { useCallback } from 'react';
import { apiFetch, ApiResponse } from '../../../core/api';
import { useApiQuery } from './useApiQuery';

export type SlotStatus = 'occupied' | 'empty';

export type SlotLatestStatus = {
  id: number;
  name: string;
  area_id: number;
  status: SlotStatus;
  last_updated: string;
};

// GET /slot/latest-status?area={areaId}
export const useSlotLatestStatus = (areaId: number) => {
  const queryFn = useCallback(
    () => apiFetch<SlotLatestStatus[]>(`/slot/latest-status?area=${areaId}`, { isPublic: false }),
    [areaId],
  );
  return useApiQuery<ApiResponse<SlotLatestStatus[]>>(queryFn, {
    enabled: !!areaId,
    pollingInterval: 5000,
  });
};
