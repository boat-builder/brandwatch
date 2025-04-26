// Base configuration for API requests

// const API_BASE_URL = 'https://mac-fde-689.lockjaw.link';
const API_BASE_URL = 'http://localhost:8080';

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export class ApiError extends Error {
  status: number;
  data?: unknown;
  
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/**
 * Handles API requests with proper error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new ApiError(
        data.message || 'An error occurred during the API request',
        response.status,
        data
      );
    }
    
    return { data: data as T };
  } catch (error) {
    if (error instanceof ApiError) {
      return { 
        error: {
          message: error.message,
          code: String(error.status),
        }
      };
    }
    
    return { 
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    };
  }
}
