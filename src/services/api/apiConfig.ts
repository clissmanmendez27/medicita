/**
 * API Client Configuration
 * Manages configuration for the Data Access Layer without exposing secrets.
 * Allows seamless switching between Local Mock Simulation and Real Node.js Backend API.
 */

export interface ApiConfig {
  baseUrl: string;
  useBackendApi: boolean;
  timeoutMs: number;
}

const STORAGE_KEY_API_MODE = 'medicita_use_backend_api';
const STORAGE_KEY_AUTH_TOKEN = 'medicita_auth_token';

// Determine default mode: check local storage or environment
const getInitialBackendMode = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_API_MODE);
    if (saved !== null) {
      return saved === 'true';
    }
    // Default to false (prototype local simulation data) until explicit connection
    return false;
  } catch {
    return false;
  }
};

export const apiConfig: ApiConfig = {
  // Uses relative `/api` by default (served by Express server.ts), or custom URL
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  useBackendApi: getInitialBackendMode(),
  timeoutMs: 8000,
};

export const ApiConfigManager = {
  isUsingBackendApi(): boolean {
    return apiConfig.useBackendApi;
  },

  setUseBackendApi(enabled: boolean): void {
    apiConfig.useBackendApi = enabled;
    try {
      localStorage.setItem(STORAGE_KEY_API_MODE, String(enabled));
    } catch (e) {
      console.warn('Could not persist API mode setting', e);
    }
  },

  getAuthToken(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  setAuthToken(token: string | null): void {
    try {
      if (token) {
        sessionStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
      }
    } catch (e) {
      console.warn('Could not store auth token in session', e);
    }
  },

  async testBackendHealth(): Promise<{ ok: boolean; message: string; version?: string }> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return {
          ok: true,
          message: 'Conexión exitosa con el backend de Node.js',
          version: data.version || '1.0.0',
        };
      }
      return { ok: false, message: `El servidor respondió con código ${response.status}` };
    } catch (err: any) {
      return {
        ok: false,
        message: 'No se pudo conectar con el endpoint del backend. Ejecutando en modo simulación de datos.',
      };
    }
  },
};
