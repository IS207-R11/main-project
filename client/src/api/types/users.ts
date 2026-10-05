import { PaginationParams } from './common';

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'BANNED';

export type Gender = 'MALE' | 'FEMALE';

export interface User {
  user_id: number;
  role: UserRole;
  email: string;
  username: string;
  status: UserStatus;
  date_of_birth: string | null;
  phone: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  created_at: string | null;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  date_of_birth?: string;
  phone?: string;
  avatar_url?: string;
  gender?: Gender;
}

export interface ChangeUserStatusRequest {
  status: UserStatus;
}

export type ListUsersParams = PaginationParams;
