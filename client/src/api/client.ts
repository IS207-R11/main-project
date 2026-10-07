import { API_BASE_URL } from './config';
import { ApiErrorResponse } from './types/common';
import { normalizeErrorMessage } from '@/lib/errorMapping';

export class ApiError extends Error {
  status: number;
  data?: ApiErrorResponse;
  originalMessage: string;

  constructor(status: number, message: string, data?: ApiErrorResponse, originalMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.originalMessage = originalMessage || message;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | (string | number)[] | undefined | null>;
  body?: unknown;
  token?: string;
}

let inMemoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, token, headers, ...restOptions } = options;

  // Build query string
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  const authToken = token || getAuthToken();
  if (authToken) {
    reqHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      reqHeaders['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers: reqHeaders,
      body: requestBody,
    });
  } catch (err: unknown) {
    console.error(`[Network Error] ${url}:`, err);
    throw new ApiError(
      0,
      normalizeErrorMessage('Network error'),
      undefined,
      err instanceof Error ? err.message : String(err)
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorData: ApiErrorResponse | undefined;
    let rawErrorMessage = `HTTP Error ${response.status}: ${response.statusText}`;

    try {
      if (isJson) {
        errorData = await response.json();
        if (errorData?.errors && typeof errorData.errors === 'object') {
          const firstKey = Object.keys(errorData.errors)[0];
          const errList = firstKey ? errorData.errors[firstKey] : null;
          if (Array.isArray(errList) && errList.length > 0) {
            rawErrorMessage = String(errList[0]);
          } else if (errorData?.message) {
            rawErrorMessage = errorData.message;
          }
        } else if (errorData?.message) {
          rawErrorMessage = errorData.message;
        }
      } else {
        const text = await response.text();
        if (text) rawErrorMessage = text;
      }
    } catch {
      // Failed to parse response body
    }

    // Requirement: Lỗi thật sự thì xuất ra console log
    console.error(`[API Error] ${response.status} ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      url,
      rawErrorMessage,
      errorData,
    });

    // Requirement: Chuẩn hóa các thông báo phổ biến nhất sang tiếng Việt, không được chuẩn hóa thì "Đã có lỗi xảy ra!"
    const normalizedMessage = normalizeErrorMessage(rawErrorMessage);

    throw new ApiError(response.status, normalizedMessage, errorData, rawErrorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
