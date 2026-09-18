/**
 * Unified HTTP Client for the Data Access Layer (DAL)
 * Safely attaches authorization headers, standardizes request/response bodies,
 * and normalizes error messages for the UI.
 */

import { apiConfig, ApiConfigManager } from './apiConfig';
import { ApiResponse } from '../../types/backend';

export class HttpClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${apiConfig.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = ApiConfigManager.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      let data: any = null;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const errorMsg =
          (data && typeof data === 'object' && (data.error || data.message)) ||
          `Error ${res.status}: ${res.statusText}`;
        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'Tiempo de espera de conexión agotado (Timeout)',
        };
      }
      return {
        success: false,
        error: err.message || 'Error de red al conectar con el servidor',
      };
    }
  }

  static async get<T>(endpoint: string, queryParams?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  static async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlSanitize(endpoint), {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlSanitize(endpoint), {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlSanitize(endpoint), {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(urlSanitize(endpoint), {
      method: 'DELETE',
    });
  }
}

function urlSanitize(endpoint: string): string {
  return endpoint;
}
