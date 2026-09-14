import {
  GetSetMethodStoreGlobalPersist,
  GetStateStoreGlobalPersist,
} from '../../frontend/global/store/persist';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  timestamp: number;
  data: T;
}

export interface FetchOptions extends RequestInit {
  isPublic?: boolean;
}

export const apiFetch = async <T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> => {
  const { isPublic = true, ...requestInit } = options;
  const state = GetStateStoreGlobalPersist();
  const token = state.accessToken;

  const headers = new Headers(requestInit.headers || {});

  // Do NOT set Content-Type for FormData — the browser must auto-generate
  // the multipart/form-data boundary. Setting it manually breaks the upload.
  if (!headers.has('Content-Type') && !(requestInit.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Only attach authorization if it's NOT a public API and we have a token
  if (!isPublic && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...requestInit,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear the access token
    const { setAccessToken } = GetSetMethodStoreGlobalPersist();
    setAccessToken(null);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.message || `API Error: ${response.status} ${response.statusText}`,
    );
  }

  const result: ApiResponse<T> = await response.json();
  return result;
};
