import { apiClient } from '@/lib/api-client';
import type {
  Business,
  BusinessSettings,
  ApiResponse,
  PaginationParams,
  SearchFilters,
  SearchResult,
  Service,
  Employee,
  Appointment
} from '@/types';

interface GetAllBusinessesParams {
  category?: string;
  city?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface GetAllBusinessesResponse {
  businesses: Business[];
  total: number;
  limit: number;
  offset: number;
}

export const businessService = {
  // Obtener todos los negocios
  async getAll(params?: GetAllBusinessesParams): Promise<ApiResponse<GetAllBusinessesResponse>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return apiClient.get<GetAllBusinessesResponse>(
      `/businesses${queryString ? '?' + queryString : ''}`
    );
  },

  // Obtener negocios (con filtros y búsqueda)
  async search(filters: SearchFilters): Promise<ApiResponse<SearchResult>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });

    return apiClient.get<SearchResult>(`/businesses/search?${params.toString()}`);
  },

  // Obtener negocio por ID
  async getById(id: string): Promise<ApiResponse<Business>> {
    return apiClient.get<Business>(`/businesses/${id}`);
  },

  // Obtener negocio por slug
  async getBySlug(slug: string): Promise<ApiResponse<Business>> {
    return apiClient.get<Business>(`/businesses/slug/${slug}`);
  },

  // Crear negocio (onboarding)
  async create(data: Partial<Business>): Promise<ApiResponse<Business>> {
    return apiClient.post<Business>('/businesses', data);
  },

  // Actualizar negocio
  async update(id: string, data: Partial<Business>): Promise<ApiResponse<Business>> {
    return apiClient.put<Business>(`/businesses/${id}`, data);
  },

  // Obtener mi negocio
  async getMy(): Promise<ApiResponse<Business>> {
    return apiClient.get<Business>('/businesses/my/business');
  },

  // Eliminar negocio
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/businesses/${id}`);
  },

  // Actualizar configuración
  async updateSettings(
    businessId: string,
    settings: Partial<BusinessSettings>
  ): Promise<ApiResponse<BusinessSettings>> {
    return apiClient.patch<BusinessSettings>(
      `/businesses/${businessId}/settings`,
      settings
    );
  },

  // Subir logo
  async uploadLogo(businessId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('logo', file);

    return fetch(`${apiClient['baseURL']}/businesses/${businessId}/logo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
      body: formData,
    }).then(res => res.json());
  },

  // Subir imagen de portada
  async uploadCover(businessId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('cover', file);

    return fetch(`${apiClient['baseURL']}/businesses/${businessId}/cover`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
      body: formData,
    }).then(res => res.json());
  },

  // Obtener disponibilidad
  async getAvailability(
    businessId: string,
    date: string,
    serviceId?: string,
    employeeId?: string
  ): Promise<ApiResponse<{ time: string; available: boolean }[]>> {
    const params = new URLSearchParams({ date });
    if (serviceId) params.append('serviceId', serviceId);
    if (employeeId) params.append('employeeId', employeeId);

    return apiClient.get<{ time: string; available: boolean }[]>(
      `/businesses/${businessId}/availability?${params.toString()}`
    );
  },

  // Obtener mi negocio (como dueño)
  async getMyBusiness(): Promise<ApiResponse<Business>> {
    return apiClient.get<Business>('/businesses/my/business');
  },

  // Verificar disponibilidad de slug
  async checkSlugAvailability(slug: string): Promise<ApiResponse<{ available: boolean }>> {
    return apiClient.get<{ available: boolean }>(`/businesses/check-slug/${slug}`);
  },

  // Obtener servicios de un negocio
  async getServices(businessId: string): Promise<ApiResponse<Service[]>> {
    return apiClient.get<Service[]>(`/businesses/${businessId}/services`);
  },

  // Obtener empleados de un negocio
  async getEmployees(businessId: string): Promise<ApiResponse<Employee[]>> {
    return apiClient.get<Employee[]>(`/businesses/${businessId}/employees`);
  },

  // Obtener citas de un negocio
  async getAppointments(businessId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<ApiResponse<Appointment[]>> {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return apiClient.get<Appointment[]>(
      `/businesses/${businessId}/appointments${queryString ? `?${queryString}` : ''}`
    );
  },

  // Dar like a imagen de galería
  async likeGalleryImage(id: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/gallery/${id}/like`);
  },

  // Quitar like a imagen de galería
  async unlikeGalleryImage(id: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/gallery/${id}/unlike`);
  },
};
