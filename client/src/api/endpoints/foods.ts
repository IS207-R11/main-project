import { apiClient } from '../client';
import { ApiResponse, MessageResponse, PaginatedResponse } from '../types/common';
import {
  AddFavoriteFoodRequest,
  AddHatedFoodRequest,
  ChangeFoodStatusRequest,
  CreateFoodRequest,
  EatenFood,
  FoodCard,
  FoodOption,
  GachaRequest,
  ListEatenFoodParams,
  ListFoodsParams,
  ListUserFoodParams,
  RecordEatenFoodRequest,
  UpdateEatenFoodRequest,
  UpdateFavoriteFoodRequest,
  UpdateFoodRequest,
  UpdateHatedFoodRequest,
  UserFoodItem,
} from '../types/foods';


export const foodsApi = {
  /**
   * GET /foods
   * Get list of foods with filters, pagination, and sorting (Public, includes favorite_count & eaten_count)
   */
  list: (params?: ListFoodsParams): Promise<PaginatedResponse<FoodCard>> => {
    return apiClient<PaginatedResponse<FoodCard>>('/foods', {
      method: 'GET',
      params: params as Record<string, string | number | boolean | (string | number)[] | undefined>,
    });
  },

  /**
   * GET /foods/{foodId}
   * Get detail of a food by ID (Public, includes favorite_count & eaten_count)
   */
  getById: (foodId: number): Promise<ApiResponse<FoodCard>> => {
    return apiClient<ApiResponse<FoodCard>>(`/foods/${foodId}`, {
      method: 'GET',
    });
  },

  /**
   * GET /foods/options
   * Search foods and return top 5 options (ID and name only, Public)
   */
  options: (search: string): Promise<FoodOption[]> => {
    return apiClient<FoodOption[]>('/foods/options', {
      method: 'GET',
      params: { search },
    });
  },

  /**
   * POST /foods/gacha
   * Smart Gacha API based on ranking formula, excluded eaten/gacha lists, or foodSet
   */
  gacha: (data?: GachaRequest): Promise<ApiResponse<FoodCard>> => {
    return apiClient<ApiResponse<FoodCard>>('/foods/gacha', {
      method: 'POST',
      body: data || {},
    });
  },

  /**
   * PUT /foods
   * Create a new food item (User can only PUT, default status is PENDING)
   */
  create: (data: CreateFoodRequest): Promise<ApiResponse<FoodCard>> => {
    return apiClient<ApiResponse<FoodCard>>('/foods', {
      method: 'PUT',
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

  // ==========================================
  // FAVORITE FOODS (Only owner user has full CRUD)
  // ==========================================

  /**
   * GET /foods/favorite/{userId}
   * Get favorite foods of the logged in user (OWNER only)
   */
  getFavorites: (
    userId: number,
    params?: ListUserFoodParams
  ): Promise<PaginatedResponse<UserFoodItem>> => {
    return apiClient<PaginatedResponse<UserFoodItem>>(`/foods/favorite/${userId}`, {
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
   * PUT /foods/favorite
   * Update favorite note (OWNER only)
   */
  updateFavorite: (data: UpdateFavoriteFoodRequest): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/foods/favorite', {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * DELETE /foods/favorite/{foodId}
   * Remove food from favorites (OWNER only)
   */
  removeFavorite: (foodId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/foods/favorite/${foodId}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // HATED FOODS (Only owner user has full CRUD)
  // ==========================================

  /**
   * GET /foods/hated/{userId}
   * Get hated foods of the logged in user (OWNER only)
   */
  getHated: (
    userId: number,
    params?: ListUserFoodParams
  ): Promise<PaginatedResponse<UserFoodItem>> => {
    return apiClient<PaginatedResponse<UserFoodItem>>(`/foods/hated/${userId}`, {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * POST /foods/hated
   * Add food to hated list (OWNER only)
   */
  addHated: (data: AddHatedFoodRequest): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/foods/hated', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * PUT /foods/hated
   * Update hated food note (OWNER only)
   */
  updateHated: (data: UpdateHatedFoodRequest): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/foods/hated', {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * DELETE /foods/hated/{foodId}
   * Remove food from hated list (OWNER only)
   */
  removeHated: (foodId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/foods/hated/${foodId}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // EATEN FOODS (Only owner user has full CRUD)
  // ==========================================

  /**
   * GET /foods/eaten/{userId}
   * Get eaten foods history of a user (OWNER only)
   */
  getEaten: (
    userId: number,
    params?: ListEatenFoodParams
  ): Promise<PaginatedResponse<EatenFood>> => {
    return apiClient<PaginatedResponse<EatenFood>>(`/foods/eaten/${userId}`, {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * POST /foods/eaten
   * Record an eaten food item (OWNER only)
   */
  recordEaten: (data: RecordEatenFoodRequest): Promise<ApiResponse<EatenFood>> => {
    return apiClient<ApiResponse<EatenFood>>('/foods/eaten', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * PUT /foods/eaten/{eatenId}
   * Update eaten food record (OWNER only)
   */
  updateEaten: (
    eatenId: number,
    data: UpdateEatenFoodRequest
  ): Promise<ApiResponse<EatenFood>> => {
    return apiClient<ApiResponse<EatenFood>>(`/foods/eaten/${eatenId}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * DELETE /foods/eaten/{eatenId}
   * Delete eaten food entry (OWNER only)
   */
  deleteEaten: (eatenId: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/foods/eaten/${eatenId}`, {
      method: 'DELETE',
    });
  },
};
