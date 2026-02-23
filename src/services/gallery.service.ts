import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface GalleryImage {
  id: string;
  businessId: string;
  url: string;
  title?: string | null;
  description?: string | null;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGalleryImageDto {
  url: string;
  title?: string;
  description?: string;
  isFeatured?: boolean;
  order?: number;
}

export interface UpdateGalleryImageDto {
  url?: string;
  title?: string;
  description?: string;
  isFeatured?: boolean;
  order?: number;
}

export const galleryService = {
  // Obtener todas las imágenes de la galería
  async getBusinessGallery(businessId: string): Promise<ApiResponse<GalleryImage[]>> {
    return apiClient.get<GalleryImage[]>(`/gallery/${businessId}`);
  },

  // Obtener una imagen específica
  async getGalleryImageById(
    businessId: string,
    imageId: string
  ): Promise<ApiResponse<GalleryImage>> {
    return apiClient.get<GalleryImage>(`/gallery/${businessId}/images/${imageId}`);
  },

  // Agregar imagen a la galería
  async createGalleryImage(
    businessId: string,
    data: CreateGalleryImageDto
  ): Promise<ApiResponse<GalleryImage>> {
    return apiClient.post<GalleryImage>(`/gallery/${businessId}`, data);
  },

  // Actualizar imagen
  async updateGalleryImage(
    businessId: string,
    imageId: string,
    data: UpdateGalleryImageDto
  ): Promise<ApiResponse<GalleryImage>> {
    return apiClient.put<GalleryImage>(`/gallery/${businessId}/images/${imageId}`, data);
  },

  // Eliminar imagen
  async deleteGalleryImage(businessId: string, imageId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/gallery/${businessId}/images/${imageId}`);
  },

  // Reordenar imágenes
  async reorderImages(
    businessId: string,
    images: Array<{ id: string; order: number }>
  ): Promise<ApiResponse<void>> {
    return apiClient.put(`/gallery/${businessId}/reorder`, { images });
  },
};
