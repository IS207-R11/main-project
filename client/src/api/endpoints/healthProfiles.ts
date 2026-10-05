import { apiClient } from '../client';
import { ApiResponse, MessageResponse, PaginatedResponse } from '../types/common';
import {
  CreateHealthProfileRequest,
  HealthProfile,
  ListHealthProfilesParams,
  UpdateHealthProfileRequest,
} from '../types/healthProfiles';

export const healthProfilesApi = {
  /**
   * GET /health-profiles/{userId}
   * Get list of health profiles for a user (OWNER or ADMIN)
   */
  listByUser: (
    userId: number,
    params?: ListHealthProfilesParams
  ): Promise<PaginatedResponse<HealthProfile>> => {
    return apiClient<PaginatedResponse<HealthProfile>>(
      `/health-profiles/${userId}`,
      {
        method: 'GET',
        params: params as Record<string, string | number | undefined>,
      }
    );
  },

  /**
   * POST /health-profiles/{userId}
   * Create a new health profile for a user (OWNER only)
   */
  create: (
    userId: number,
    data: CreateHealthProfileRequest
  ): Promise<ApiResponse<HealthProfile>> => {
    return apiClient<ApiResponse<HealthProfile>>(`/health-profiles/${userId}`, {
      method: 'POST',
      body: data,
    });
  },

  /**
   * PUT /health-profiles/{userId}/{profileId}
   * Update a health profile (OWNER only)
   */
  update: (
    userId: number,
    profileId: number,
    data: UpdateHealthProfileRequest
  ): Promise<ApiResponse<HealthProfile>> => {
    return apiClient<ApiResponse<HealthProfile>>(
      `/health-profiles/${userId}/${profileId}`,
      {
        method: 'PUT',
        body: data,
      }
    );
  },

  /**
   * DELETE /health-profiles/{profileId}
   * Delete a health profile (OWNER or ADMIN)
   */
  delete: (profileId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/health-profiles/${profileId}`, {
      method: 'DELETE',
    });
  },
};
