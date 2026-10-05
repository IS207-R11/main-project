import { apiClient } from '../client';
import { HealthCheckResponse } from '../types/system';

export const systemApi = {
  /**
   * GET /
   * Check if backend server is running
   */
  checkHealth: (): Promise<HealthCheckResponse> => {
    return apiClient<HealthCheckResponse>('/', {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
    });
  },
};
