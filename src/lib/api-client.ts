import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import type {
  ApiResponse,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  AuthUser
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseURL: string;
  private http: AxiosInstance;
  private tokens: AuthTokens | null = null;
  private inflightGets = new Map<string, Promise<ApiResponse<unknown>>>();
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.http = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.loadTokens();
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.tokens?.accessToken) {
        config.headers.set('Authorization', `Bearer ${this.tokens.accessToken}`);
      }

      if (config.data instanceof FormData) {
        config.headers.delete('Content-Type');
      }

      return config;
    });

    this.http.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<any>) => {
        const status = error.response?.status;
        const data = error.response?.data;
        const backendMessage =
          data?.error?.message ||
          data?.message ||
          error.message ||
          'Ocurrió un error inesperado';

        if (status === 400 || status === 404 || status === 409) {
          toast.error(backendMessage);
        }

        if (status === 401 && this.tokens?.refreshToken) {
          const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
          const isRefreshRequest = originalConfig?.url?.includes('/auth/refresh');

          if (originalConfig && !originalConfig._retry && !isRefreshRequest) {
            originalConfig._retry = true;

            const refreshed = await this.getOrCreateRefreshPromise();
            if (refreshed && this.tokens?.accessToken) {
              originalConfig.headers.set('Authorization', `Bearer ${this.tokens.accessToken}`);
              return this.http.request(originalConfig);
            }
          }
        }

        // Importante: no tragarse el error, dejar que siga propagando.
        return Promise.reject(error);
      }
    );
  }

  private async getOrCreateRefreshPromise(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private loadTokens() {
    const stored = localStorage.getItem('auth_tokens');
    if (stored && stored !== 'undefined') {
      try {
        this.tokens = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse auth tokens', e);
        this.clearTokens();
      }
    }
  }

  private saveTokens(tokens: AuthTokens) {
    if (!tokens) return;
    this.tokens = tokens;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private clearTokens() {
    this.tokens = null;
    localStorage.removeItem('auth_tokens');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    dedupeGet: boolean = true
  ): Promise<ApiResponse<T>> {
    const method = (options.method || 'GET').toUpperCase();
    const dedupeKey = `${method}:${endpoint}:${this.tokens?.accessToken || ''}`;

    const doRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await this.http.request({
          url: endpoint,
          method: method as any,
          data: options.body instanceof FormData
            ? options.body
            : (typeof options.body === 'string' ? JSON.parse(options.body) : options.body),
          headers: options.headers as any,
        });

        const data = response.data;

        return {
          success: true,
          data: data.data || data,
          meta: data.meta,
        };
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const payload = error.response?.data;
          return {
            success: false,
            error: {
              code: payload?.error?.code || `HTTP_${status || 500}`,
              message: payload?.error?.message || payload?.message || error.message || 'Error en la petición',
              details: payload,
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error instanceof Error ? error.message : 'Error de red',
          },
        };
      }
    };

    // ... (dedupe logic remains same)
    if (method === 'GET' && dedupeGet) {
      const existing = this.inflightGets.get(dedupeKey);
      if (existing) {
        return existing as Promise<ApiResponse<T>>;
      }

      const promise = doRequest().finally(() => {
        this.inflightGets.delete(dedupeKey);
      });

      this.inflightGets.set(dedupeKey, promise as Promise<ApiResponse<unknown>>);
      return promise;
    }

    return doRequest();
  }

  // ... (methods get/post/put/etc remain same)
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      ...options,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ... (login/register/logout remain same)
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    const response = await this.post<AuthUser>('/auth/login', credentials);
    if (response.success && response.data) {
      this.saveTokens(response.data.tokens);
    }
    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthUser>> {
    const response = await this.post<AuthUser>('/auth/register', data);
    if (response.success && response.data) {
      this.saveTokens(response.data.tokens);
    }
    return response;
  }

  async logout(): Promise<void> {
    if (this.tokens?.refreshToken) {
      await this.post('/auth/logout', {
        refreshToken: this.tokens.refreshToken
      });
    }
    this.clearTokens();
  }

  async refreshToken(): Promise<boolean> {
    if (!this.tokens?.refreshToken) return false;

    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken: this.tokens.refreshToken,
      });

      const body = response.data;
      // Handle nested data structure: { success: true, data: { tokens: ... } }
      const tokens = body.data?.tokens || body.tokens;

      if (tokens) {
        this.saveTokens(tokens);
        return true;
      }

      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  isAuthenticated(): boolean {
    return !!this.tokens?.accessToken;
  }
}

export const apiClient = new ApiClient(API_URL);

export const businessService = {
  // ... existing methods
  async getBusinessById(id: string) {
    const response = await apiClient.get<any>(`/businesses/${id}`);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  },

  async getBusinessBySlug(slug: string) {
    const response = await apiClient.get<any>(`/businesses/slug/${slug}`);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  },

  async getAllBusinesses(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get<any>(`/businesses${queryString}`);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  },

  async getServiceById(id: string) {
    const response = await apiClient.get<any>(`/services/${id}`);
    // @ts-ignore
    return response.data.data || response.data;
  },

  // Gallery
  async likeGalleryImage(id: string) {
    const response = await apiClient.post(`/gallery/${id}/like`);
    return response.data;
  }
};
