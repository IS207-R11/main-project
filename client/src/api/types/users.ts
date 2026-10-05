import { PaginationParams } from './common';

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'BANNED';

export interface User {
  user_id: number;
  role: UserRole;
  email: string;
  username: string;
  address: string | null;
  status: UserStatus;
  created_at: string | null;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  address?: string;
}

export interface ChangeUserRoleRequest {
  role: UserRole;
}

export interface ChangeUserStatusRequest {
  status: UserStatus;
}

export type ListUsersParams = PaginationParams;
