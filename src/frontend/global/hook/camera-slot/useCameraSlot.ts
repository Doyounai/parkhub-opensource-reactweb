import { useCallback } from 'react';
import { apiFetch, ApiResponse } from '../../../../core/api';
import { useApiMutation } from '../useApi';
import { useApiQuery } from '../useApiQuery';

export type CameraSlot = {
  id: number;
  camera_id: number;
  slot_id: number;
  label: string;
  points: any;
  color: string;
  camera?: any; // CameraEntity
  slot?: any; // SlotEntity
};

export type CameraSlotBody = {
  camera_id: number;
  label: string;
  slot_id: number;
  points: any;
  color: string;
};

export type CameraSlotBulkBody = {
  data: CameraSlotBody[];
};

// POST /camera-slot/bulk-camera/:id
export const useCameraSlotCreateBulk = (id: number) => {
  return useApiMutation<ApiResponse<CameraSlot>, CameraSlotBulkBody>(async (body) => {
    return apiFetch<CameraSlot>(`/camera-slot/bulk-camera/${id}`, {
      method: 'POST',
      body: JSON.stringify(body),
      isPublic: false,
    });
  });
};

// GET /camera-slot/bulk-camera/:id
export const useCameraSlotGetBulk = (id: number) => {
  const queryFn = useCallback(
    () => apiFetch<CameraSlot[]>(`/camera-slot/bulk-camera/${id}`, { isPublic: false }),
    [id],
  );

  return useApiQuery<ApiResponse<CameraSlot[]>>(queryFn, { enabled: !!id });
};
