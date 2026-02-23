import { apiClient } from '@/lib/api-client';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  ApiResponse, 
  AuthUser 
} from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    return apiClient.login(credentials);
  },

  async register(data: RegisterData): Promise<ApiResponse<AuthUser>> {
    return apiClient.register(data);
  },

  async logout(): Promise<void> {
    await apiClient.logout();
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('/auth/profile', data);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/password-reset/request', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/password-reset/confirm', {
      token,
      newPassword,
    });
  },

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },

  getAccessToken(): string | null {
    return apiClient.getAccessToken();
  },
};
