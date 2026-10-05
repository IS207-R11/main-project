import { apiClient } from '../client';
import { ApiResponse, MessageResponse, PaginatedResponse } from '../types/common';
import {
  ChangeUserStatusRequest,
  ListUsersParams,
  UpdateUserRequest,
  User,
} from '../types/users';

export const usersApi = {
  /**
   * GET /users
   * Get list of users with pagination and search (ADMIN or MODERATOR)
   */
  list: (params?: ListUsersParams): Promise<PaginatedResponse<User>> => {
    return apiClient<PaginatedResponse<User>>('/users', {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * GET /users/{id}
   * Get user details by ID (ADMIN, MODERATOR or OWNER)
   */
  getById: (id: number): Promise<ApiResponse<User>> => {
    return apiClient<ApiResponse<User>>(`/users/${id}`, {
      method: 'GET',
    });
  },

  /**
   * PUT /users/{id}
   * Update user profile (OWNER only)
   */
  update: (id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    return apiClient<ApiResponse<User>>(`/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * DELETE /users/{id}
   * Delete user account (OWNER or ADMIN)
   */
  delete: (id: number): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * PUT /users/{id}/change-status
   * Change user account status (ADMIN or MODERATOR)
   */
  changeStatus: (
    id: number,
    data: ChangeUserStatusRequest
  ): Promise<ApiResponse<User>> => {
    return apiClient<ApiResponse<User>>(`/users/${id}/change-status`, {
      method: 'PUT',
      body: data,
    });
  },
};
