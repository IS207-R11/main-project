import { apiClient } from '../client';
import { ApiResponse, MessageResponse, PaginatedResponse } from '../types/common';
import {
  CreateNutritionRequest,
  ListNutritionsParams,
  Nutrition,
  NutritionOption,
  UpdateNutritionRequest,
} from '../types/nutritions';

export const nutritionsApi = {
  /**
   * GET /nutritions
   * Get list of nutritions with search, pagination, and sorting
   */
  list: (params?: ListNutritionsParams): Promise<PaginatedResponse<Nutrition>> => {
    return apiClient<PaginatedResponse<Nutrition>>('/nutritions', {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * GET /nutritions/options
   * Search nutritions and return top 5 options (ID and name only)
   */
  options: (search: string): Promise<NutritionOption[]> => {
    return apiClient<NutritionOption[]>('/nutritions/options', {
      method: 'GET',
      params: { search },
    });
  },

  /**
   * GET /nutritions/{nutritionId}
   * Get details of a nutrition item
   */
  getById: (nutritionId: number): Promise<ApiResponse<Nutrition>> => {
    return apiClient<ApiResponse<Nutrition>>(`/nutritions/${nutritionId}`, {
      method: 'GET',
    });
  },

  /**
   * POST /nutritions
   * Create a new nutrition item (USER or ADMIN)
   */
  create: (data: CreateNutritionRequest): Promise<ApiResponse<Nutrition>> => {
    return apiClient<ApiResponse<Nutrition>>('/nutritions', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * PUT /nutritions/{nutritionId}
   * Update nutrition item (ADMIN only)
   */
  update: (
    nutritionId: number,
    data: UpdateNutritionRequest
  ): Promise<ApiResponse<Nutrition>> => {
    return apiClient<ApiResponse<Nutrition>>(`/nutritions/${nutritionId}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * DELETE /nutritions/{nutritionId}
   * Delete nutrition item (ADMIN only)
   */
  delete: (nutritionId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/nutritions/${nutritionId}`, {
      method: 'DELETE',
    });
  },
};
