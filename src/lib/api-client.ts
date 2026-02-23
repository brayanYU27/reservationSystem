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
  private tokens: AuthTokens | null = null;
  private inflightGets = new Map<string, Promise<ApiResponse<unknown>>>();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokens();
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
    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    if (this.tokens?.accessToken) {
      // @ts-ignore - HeadersInit type is complex, but this assignment is valid
      headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
    }

    const method = (options.method || 'GET').toUpperCase();
    const authHeader = typeof headers === 'object' && 'Authorization' in headers ? String((headers as any).Authorization) : '';
    const dedupeKey = `${method}:${endpoint}:${authHeader}`;

    const doRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          // Si es 401, intentar refrescar el token
          if (response.status === 401 && this.tokens?.refreshToken) {
            // Evitar loop infinito si ya estamos intentando refrescar
            const isRefreshRequest = endpoint.includes('/auth/refresh');
            if (isRefreshRequest) {
              return {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Session expired',
                }
              };
            }

            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Reintentar la petición original (sin dedupe para evitar auto-referencia)
              return this.request<T>(endpoint, options, false);
            }
          }

          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: data.message || data.error?.message || 'Error en la petición',
              details: data,
            },
          };
        }

        return {
          success: true,
          data: data.data || data,
          meta: data.meta,
        };
      } catch (error) {
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
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      });

      if (response.ok) {
        const body = await response.json();
        // Handle nested data structure: { success: true, data: { tokens: ... } }
        const tokens = body.data?.tokens || body.tokens;

        if (tokens) {
          this.saveTokens(tokens);
          return true;
        }
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
