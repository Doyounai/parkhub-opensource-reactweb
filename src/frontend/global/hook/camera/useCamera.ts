import { useCallback } from 'react';
import { apiFetch, ApiResponse } from '../../../../core/api';
import { useApiMutation } from '../useApi';
import { Area } from '../useArea';
import { useApiQuery } from '../useApiQuery';

export type Camera = {
  id: number;
  name: string;
  area_id: number;

  /**
   * Description of the camera location or purpose.
   * Mapped from the 'des' field in the database.
   */
  des: string | null;

  /**
   * The stream URL, IP address, or static reference path
   * used to capture the camera view for detection.
   */
  view: string;

  area?: Area;
  camera_slots?: any[]; // Replace 'any' with CameraSlotEntity once created
};

// POST /camera (private)
export const useCameraCreate = () => {
  return useApiMutation<ApiResponse<Camera>, any>(async (body) => {
    return apiFetch<Camera>('/camera', {
      method: 'POST',
      body: body,
      isPublic: false,
    });
  });
};

// GET /camera/:id (private)
export const useCameraDetail = (id: number) => {
  const queryFn = useCallback(
    () => apiFetch<Camera>(`/camera/${id}`, {isPublic: false}), 
    [id]
  );

  return useApiQuery<ApiResponse<Camera>>(queryFn, { enabled: !!id });
}