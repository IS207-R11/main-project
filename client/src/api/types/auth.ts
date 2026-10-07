import { User } from './users';

export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user?: User;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  address?: string;
}

export interface SignUpResponse {
  message: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user: User;
}

export interface SignOutRequest {
  username?: string;
  refreshToken?: string;
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
