import { User } from './users';

export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface SignUpRequest {
  username: string;
  password: string;
  email?: string;
}

export interface SignUpResponse {
  message: string;
  user: User;
}

export interface SignOutRequest {
  username?: string;
}

export interface RefreshTokenRequest {
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword: string;
}
