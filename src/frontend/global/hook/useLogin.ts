import { useApiMutation } from './useApi';
import { apiFetch, ApiResponse } from '../../../core/api';
import { GetSetMethodStoreGlobalPersist } from '../store/persist';

// You can create specific types based on the example body
type LoginBody = {
  username?: string;
  password?: string;
};

type LoginContextDto = {
  access_token: string;
};

export const useLogin = () => {
  return useApiMutation<ApiResponse<LoginContextDto>, LoginBody>(async (credentials) => {
    // We pass isPublic: true as default or we can explicitly state it
    const response = await apiFetch<LoginContextDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      isPublic: true,
    });

    if (response.success && response.data?.access_token) {
      // Save access token to persist storage
      const { setAccessToken } = GetSetMethodStoreGlobalPersist();
      setAccessToken(response.data.access_token);
    } else {
      throw new Error(response.message || 'Login failed.');
    }

    return response;
  });
};
