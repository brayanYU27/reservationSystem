import { apiClient } from '@/lib/api-client';
import type { Review, ApiResponse, PaginationParams } from '@/types';

export interface ReviewFilters extends PaginationParams {
  businessId?: string;
  rating?: number;
}

export const reviewService = {
  // Obtener reseñas de un negocio
  async getByBusiness(
    businessId: string, 
    filters?: Partial<ReviewFilters>
  ): Promise<ApiResponse<Review[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return apiClient.get<Review[]>(
      `/businesses/${businessId}/reviews?${params.toString()}`
    );
  },

  // Crear reseña
  async create(data: {
    businessId: string;
    appointmentId?: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<Review>> {
    return apiClient.post<Review>('/reviews', data);
  },

  // Actualizar reseña
  async update(
    id: string, 
    data: { rating: number; comment?: string }
  ): Promise<ApiResponse<Review>> {
    return apiClient.patch<Review>(`/reviews/${id}`, data);
  },

  // Eliminar reseña
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/reviews/${id}`);
  },

  // Responder a reseña (solo owner del negocio)
  async respond(id: string, response: string): Promise<ApiResponse<Review>> {
    return apiClient.post<Review>(`/reviews/${id}/respond`, {
      response,
    });
  },

  // Obtener mis reseñas
  async getMyReviews(): Promise<ApiResponse<Review[]>> {
    return apiClient.get<Review[]>('/reviews/me');
  },
};
