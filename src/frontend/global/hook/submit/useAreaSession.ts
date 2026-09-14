import { apiFetch, ApiResponse } from '../../../../core/api';
import { useApiQuery } from '../useApiQuery';
import { useCallback } from 'react';

export type SlotEvent = {
  id: number;
  session_id: number;
  camsession_id: number | null;
  slot_id: number;
  status: string;
  type: string;
  created_at: string;
};

export type CameraSession = {
  id: number;
  session_id: number;
  camera_id: number;
  view: string;
  detect: boolean;
  created_at: string;
  updated_at: string;
};

export type AreaSession = {
  id: number;
  area_id: number;
  created_at: string;
  slotEvents: SlotEvent[];
  cameraSessions: CameraSession[];
};

export const useAreaSessionList = (areaId: number) => {
  const queryFn = useCallback(
    () => apiFetch<AreaSession[]>(`/area-session/area/${areaId}`, { isPublic: false }),
    [areaId],
  );
  return useApiQuery<ApiResponse<AreaSession[]>>(queryFn, { enabled: !!areaId });
};

export const useAreaSessionDetail = (id: number) => {
  const queryFn = useCallback(
    () => apiFetch<AreaSession>(`/area-session/${id}`, { isPublic: false }),
    [id],
  );
  return useApiQuery<ApiResponse<AreaSession>>(queryFn, { enabled: !!id });
};
