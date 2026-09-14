import { apiFetch, ApiResponse } from '../../../../core/api';
import { useApiMutation } from '../useApi';

export type SubmitResponse = {
  message: string;
  areaSessionId: number;
};

export type SubmitAreaSessionBody = {
  area_id: number;
  slot_events: SubmitSlotEvent[];
};

export type SubmitSlotEvent = {
  slot_id: number;
  status: 'empty' | 'occupied';
  type: 'manual';
};

// POST /area-session/submit (private)
export const useSubmitAreaSession = () => {
  return useApiMutation<ApiResponse<SubmitResponse>, SubmitAreaSessionBody>(
    async (body) => {
      return apiFetch<SubmitResponse>('/area-session/submit', {
        method: 'POST',
        body: JSON.stringify(body),
        isPublic: false,
      });
    },
  );
};

// POST /submit (private)
export const useSubmitSession = () => {
  return useApiMutation<ApiResponse<any>, any>(async (body) => {
    return apiFetch<any>('/camera-session/submit', {
      method: 'POST',
      body: body,
      isPublic: false,
    });
  });
};
