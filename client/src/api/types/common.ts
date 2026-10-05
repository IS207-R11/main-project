export interface ApiResponse<T = unknown> {
  message?: string;
  data: T;
}

export interface MessageResponse {
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total_records: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface SortablePaginationParams extends PaginationParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
