import { apiClient } from '../client';
import { ApiResponse, MessageResponse, PaginatedResponse, PaginationParams } from '../types/common';
import {
  AddFavoriteFoodRequest,
  AddScannedFoodRequest,
  ChangeFoodStatusRequest,
  CreateFoodRequest,
  EatenFood,
  FoodCard,
  FoodOption,
  GachaParams,
  ListFoodsParams,
  RecordEatenFoodRequest,
  UpdateFoodRequest,
} from '../types/foods';

export const foodsApi = {
  /**
   * GET /foods
   * Get list of foods with filters, pagination, and sorting
   */
  list: (params?: ListFoodsParams): Promise<PaginatedResponse<FoodCard>> => {
    return apiClient<PaginatedResponse<FoodCard>>('/foods', {
      method: 'GET',
      params: params as Record<string, string | number | boolean | (string | number)[] | undefined>,
    });
  },

  /**
   * GET /foods/options
   * Search foods and return top 5 options (ID and name only)
   */
  options: (search: string): Promise<FoodOption[]> => {
    return apiClient<FoodOption[]>('/foods/options', {
      method: 'GET',
      params: { search },
    });
  },

  /**
   * GET /foods/gacha
   * Random gacha food recommendations
   */
  gacha: (params?: GachaParams): Promise<FoodCard[]> => {
    return apiClient<FoodCard[]>('/foods/gacha', {
      method: 'GET',
      params: params as Record<string, string | number | (string | number)[] | undefined>,
    });
  },

  /**
   * POST /foods
   * Create a new food item (USER or ADMIN)
   */
  create: (data: CreateFoodRequest): Promise<ApiResponse<FoodCard>> => {
    return apiClient<ApiResponse<FoodCard>>('/foods', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * PUT /foods/{foodId}
   * Update a food item (ADMIN only)
   */
  update: (
    foodId: number,
    data: UpdateFoodRequest
  ): Promise<ApiResponse<FoodCard>> => {
    return apiClient<ApiResponse<FoodCard>>(`/foods/${foodId}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * DELETE /foods/{foodId}
   * Delete a food item (ADMIN only)
   */
  delete: (foodId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/foods/${foodId}`, {
      method: 'DELETE',
    });
  },

  /**
   * PUT /foods/{foodId}/change-status
   * Change food status (ADMIN or MODERATOR)
   */
  changeStatus: (
    foodId: number,
    data: ChangeFoodStatusRequest
  ): Promise<ApiResponse<FoodCard>> => {
    return apiClient<ApiResponse<FoodCard>>(`/foods/${foodId}/change-status`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * GET /foods/favorite/{userId}
   * Get favorite foods of a user (OWNER only)
   */
  getFavorites: (
    userId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<FoodCard>> => {
    return apiClient<PaginatedResponse<FoodCard>>(`/foods/favorite/${userId}`, {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * POST /foods/favorite
   * Add food to favorites (OWNER only)
   */
  addFavorite: (data: AddFavoriteFoodRequest): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/foods/favorite', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * DELETE /foods/favorite
   * Remove food from favorites via query param (OWNER only)
   */
  removeFavorite: (foodId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/foods/favorite', {
      method: 'DELETE',
      params: { food_id: foodId },
    });
  },

  /**
   * GET /foods/scanned/{userId}
   * Get scanned foods history of a user (OWNER only)
   */
  getScanned: (
    userId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<FoodCard>> => {
    return apiClient<PaginatedResponse<FoodCard>>(`/foods/scanned/${userId}`, {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * POST /foods/scanned
   * Add food to scanned history (OWNER only)
   */
  addScanned: (data: AddScannedFoodRequest): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/foods/scanned', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * GET /foods/eaten/{userId}
   * Get eaten foods history of a user (OWNER only)
   */
  getEaten: (
    userId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<EatenFood>> => {
    return apiClient<PaginatedResponse<EatenFood>>(`/foods/eaten/${userId}`, {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * POST /foods/eaten
   * Record an eaten meal with food items (OWNER only)
   */
  recordEaten: (
    data: RecordEatenFoodRequest
  ): Promise<ApiResponse<EatenFood>> => {
    return apiClient<ApiResponse<EatenFood>>('/foods/eaten', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * DELETE /foods/eaten
   * Delete eaten food entry via query param (OWNER only)
   */
  deleteEaten: (eatenFoodId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/foods/eaten', {
      method: 'DELETE',
      params: { eaten_food_id: eatenFoodId },
    });
  },
};
