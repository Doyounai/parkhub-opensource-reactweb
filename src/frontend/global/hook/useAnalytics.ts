import { useCallback } from 'react';
import { apiFetch, ApiResponse } from '../../../core/api';
import { useApiQuery } from './useApiQuery';

// ─── Shared Params ───────────────────────────────────────────────────────────

export interface AnalyticsParams {
  from?: string;
  to?: string;
  granularity?: 'hour' | 'day' | 'week';
}

function buildQueryString(params: AnalyticsParams): string {
  const q = new URLSearchParams();
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.granularity) q.set('granularity', params.granularity);
  const str = q.toString();
  return str ? `?${str}` : '';
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface OccupancyTimelinePoint {
  timestamp: string;
  occupancyRate: number;
  occupiedCount: number;
  totalSlots: number;
  sessionCount: number;
}

export interface OccupancyTimelineResponse {
  areaId: number;
  from: string;
  to: string;
  granularity: string;
  data: OccupancyTimelinePoint[];
}

export interface ArrivalRatePoint {
  timestamp: string;
  arrivals: number;
}

export interface ArrivalRateResponse {
  areaId: number;
  from: string;
  to: string;
  granularity: string;
  data: ArrivalRatePoint[];
}

export interface SlotDuration {
  slotId: number;
  slotName: string;
  avgDurationMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  parkingCount: number;
}

export interface AvgParkingDurationResponse {
  areaId: number;
  from: string;
  to: string;
  avgDurationMinutes: number;
  slots: SlotDuration[];
}

export interface SlotHeatmapEntry {
  slotId: number;
  slotName: string;
  occupancyRate: number;
  totalOccupied: number;
  totalEmpty: number;
  totalEvents: number;
}

export interface SlotHeatmapResponse {
  areaId: number;
  from: string;
  to: string;
  slots: SlotHeatmapEntry[];
}

export interface PeakHourEntry {
  hour: number;
  avgOccupancyRate: number;
}

export interface PeakHoursResponse {
  areaId: number;
  from: string;
  to: string;
  data: PeakHourEntry[];
}

export interface AnalyticsSummaryResponse {
  areaId: number;
  areaName: string;
  from: string;
  to: string;
  totalSessions: number;
  totalSlots: number;
  avgOccupancyRate: number;
  peakOccupancyRate: number;
  peakTimestamp: string;
  totalArrivals: number;
  avgParkingDurationMinutes: number;
  mostUsedSlot: { slotId: number; slotName: string; occupancyRate: number };
  leastUsedSlot: { slotId: number; slotName: string; occupancyRate: number };
}

export interface PredictionMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ConfusionMatrixRaw {
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
}

export interface AccuracyPrediction {
  method: string;
  metrics: PredictionMetrics;
  confusionMatrix: ConfusionMatrixRaw;
  totalSamples: number;
}

export interface AccuracyCameraData {
  cameraId: number;
  cameraName: string;
  predictions: AccuracyPrediction[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
// NOTE: Matches the existing useArea.ts pattern:
//   useApiQuery<ApiResponse<T>> so hook.data is ApiResponse<T>
//   In the page: hook.data?.data gives the actual analytics payload
// ─────────────────────────────────────────────────────────────────────────────

export const useAnalyticsSummary = (areaId: number, params: AnalyticsParams) => {
  const queryFn = useCallback(
    () =>
      apiFetch<AnalyticsSummaryResponse>(
        `/analytics/area/${areaId}/summary${buildQueryString(params)}`,
        { isPublic: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areaId, params.from, params.to],
  );
  return useApiQuery<ApiResponse<AnalyticsSummaryResponse>>(queryFn, { enabled: !!areaId });
};

export const useOccupancyTimeline = (areaId: number, params: AnalyticsParams) => {
  const queryFn = useCallback(
    () =>
      apiFetch<OccupancyTimelineResponse>(
        `/analytics/area/${areaId}/occupancy-timeline${buildQueryString(params)}`,
        { isPublic: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areaId, params.from, params.to, params.granularity],
  );
  return useApiQuery<ApiResponse<OccupancyTimelineResponse>>(queryFn, { enabled: !!areaId });
};

export const useArrivalRate = (areaId: number, params: AnalyticsParams) => {
  const queryFn = useCallback(
    () =>
      apiFetch<ArrivalRateResponse>(
        `/analytics/area/${areaId}/arrival-rate${buildQueryString(params)}`,
        { isPublic: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areaId, params.from, params.to, params.granularity],
  );
  return useApiQuery<ApiResponse<ArrivalRateResponse>>(queryFn, { enabled: !!areaId });
};

export const useAvgParkingDuration = (areaId: number, params: AnalyticsParams) => {
  const queryFn = useCallback(
    () =>
      apiFetch<AvgParkingDurationResponse>(
        `/analytics/area/${areaId}/avg-parking-duration${buildQueryString(params)}`,
        { isPublic: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areaId, params.from, params.to],
  );
  return useApiQuery<ApiResponse<AvgParkingDurationResponse>>(queryFn, { enabled: !!areaId });
};

export const useSlotHeatmap = (areaId: number, params: AnalyticsParams) => {
  const queryFn = useCallback(
    () =>
      apiFetch<SlotHeatmapResponse>(
        `/analytics/area/${areaId}/slot-heatmap${buildQueryString(params)}`,
        { isPublic: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areaId, params.from, params.to],
  );
  return useApiQuery<ApiResponse<SlotHeatmapResponse>>(queryFn, { enabled: !!areaId });
};

export const usePeakHours = (areaId: number, params: AnalyticsParams) => {
  const queryFn = useCallback(
    () =>
      apiFetch<PeakHoursResponse>(
        `/analytics/area/${areaId}/peak-hours${buildQueryString(params)}`,
        { isPublic: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areaId, params.from, params.to],
  );
  return useApiQuery<ApiResponse<PeakHoursResponse>>(queryFn, { enabled: !!areaId });
};

export const useAccuracy = () => {
  const queryFn = useCallback(
    () => apiFetch<AccuracyCameraData[]>('/analytics/accuracy', { isPublic: true }),
    []
  );
  return useApiQuery<ApiResponse<AccuracyCameraData[]>>(queryFn);
};

export interface RawDataEntry {
  session_id: number;
  camera_name: string | null;
  slot_id: number;
  slot_name: string | null;
  timestamp: string | null;
  manual: string | null;
  drone: string | null;
  yolo: string | null;
}

export interface RawDataResponse {
  data: RawDataEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface RawDataParams {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  cameraId?: number;
}

export const useRawData = (params: RawDataParams) => {
  const queryFn = useCallback(
    () => {
      const q = new URLSearchParams();
      if (params.page !== undefined) q.set('page', params.page.toString());
      if (params.pageSize !== undefined) q.set('limit', params.pageSize.toString());
      if (params.from) q.set('from', params.from);
      if (params.to) q.set('to', params.to);
      if (params.cameraId !== undefined) q.set('cameraId', params.cameraId.toString());
      const str = q.toString();
      const qs = str ? `?${str}` : '';
      return apiFetch<RawDataResponse>(`/analytics/raw-data${qs}`, { isPublic: true });
    },
    [params.page, params.pageSize, params.from, params.to, params.cameraId]
  );
  return useApiQuery<ApiResponse<RawDataResponse>>(queryFn);
};

