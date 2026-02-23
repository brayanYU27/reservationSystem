import { apiClient } from '@/lib/api-client';
import type { Service, ApiResponse } from '@/types';

export const serviceService = {
  // Listar servicios de un negocio
  async getByBusiness(businessId: string): Promise<ApiResponse<Service[]>> {
    return apiClient.get<Service[]>(`/businesses/${businessId}/services`);
  },

  // Obtener servicio por ID
  async getById(serviceId: string): Promise<ApiResponse<Service>> {
    return apiClient.get<Service>(`/services/${serviceId}`);
  },

  // Crear servicio
  async create(businessId: string, data: Partial<Service>): Promise<ApiResponse<Service>> {
    return apiClient.post<Service>(`/businesses/${businessId}/services`, data);
  },

  // Actualizar servicio
  async update(serviceId: string, data: Partial<Service>): Promise<ApiResponse<Service>> {
    return apiClient.patch<Service>(`/services/${serviceId}`, data);
  },

  // Eliminar servicio
  async delete(serviceId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/services/${serviceId}`);
  },

  // Reordenar servicios
  async reorder(businessId: string, serviceIds: string[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/businesses/${businessId}/services/reorder`, {
      order: serviceIds,
    });
  },

  // Subir imagen de servicio
  async uploadImage(serviceId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    return fetch(`${apiClient['baseURL']}/services/${serviceId}/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
      body: formData,
    }).then(res => res.json());
  },
};
