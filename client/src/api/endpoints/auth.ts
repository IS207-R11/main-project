import { apiClient } from '../client';
import {
  ChangePasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SignInRequest,
  SignInResponse,
  SignOutRequest,
  SignUpRequest,
  SignUpResponse,
} from '../types/auth';
import { MessageResponse } from '../types/common';

export const authApi = {
  /**
   * POST /auth/signin
   * Authenticate user with username and password
   */
  signIn: (data: SignInRequest): Promise<SignInResponse> => {
    return apiClient<SignInResponse>('/auth/signin', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * POST /auth/signup
   * Register a new user account
   */
  signUp: (data: SignUpRequest): Promise<SignUpResponse> => {
    return apiClient<SignUpResponse>('/auth/signup', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * POST /auth/signout
   * Sign out current user session
   */
  signOut: (data?: SignOutRequest): Promise<MessageResponse> => {
    return apiClient<MessageResponse>('/auth/signout', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * POST /auth/refresh-token
   * Refresh JWT access token
   */
  refreshToken: (data?: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return apiClient<RefreshTokenResponse>('/auth/refresh-token', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * POST /auth/change-password/{userID}
   * Change user password (ADMIN or OWNER)
   */
  changePassword: (
    userID: number,
    data: ChangePasswordRequest
  ): Promise<MessageResponse> => {
    return apiClient<MessageResponse>(`/auth/change-password/${userID}`, {
      method: 'POST',
      body: data,
    });
  },
};
