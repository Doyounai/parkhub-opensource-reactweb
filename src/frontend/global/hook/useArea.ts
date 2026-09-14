import { useCallback } from 'react';
import { apiFetch, ApiResponse } from '../../../core/api';
import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApi';
import { Camera } from './camera/useCamera';

export type Area = {
  id: number;
  name: string;
  des: string;
  cameras: Camera[];
  area_json: any;
};

export type AreaBody = {
  name?: string;
  des?: string;
  area_json?: any;
};

// GET /area  (public)
export const useAreaList = () => {
  const queryFn = useCallback(() => apiFetch<Area[]>('/area', { isPublic: true }), []);
  return useApiQuery<ApiResponse<Area[]>>(queryFn);
};

// GET /area/:id  (public)
export const useAreaDetail = (id: number) => {
  const queryFn = useCallback(
    () => apiFetch<Area>(`/area/${id}`, { isPublic: true }),
    [id],
  );
  return useApiQuery<ApiResponse<Area>>(queryFn, { enabled: !!id });
};

// POST /area  (private)
export const useAreaCreate = () => {
  return useApiMutation<ApiResponse<Area>, AreaBody>(async (body) => {
    return apiFetch<Area>('/area', {
      method: 'POST',
      body: JSON.stringify(body),
      isPublic: false,
    });
  });
};

// PATCH /area/:id  (private)
export const useAreaUpdate = () => {
  return useApiMutation<ApiResponse<Area>, { id: number; body: AreaBody }>(
    async ({ id, body }) => {
      return apiFetch<Area>(`/area/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        isPublic: false,
      });
    },
  );
};

// DELETE /area/:id  (private)
export const useAreaDelete = () => {
  return useApiMutation<ApiResponse<void>, number>(async (id) => {
    return apiFetch<void>(`/area/${id}`, {
      method: 'DELETE',
      isPublic: false,
    });
  });
};
