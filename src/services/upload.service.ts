import { apiClient } from '@/lib/api-client';

export interface UploadImageResponse {
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

/**
 * Subir una imagen al servidor
 */
export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<UploadImageResponse>('/upload', formData);

  return response.data;
};

/**
 * Eliminar una imagen del servidor
 */
export const deleteUploadedImage = async (filename: string): Promise<void> => {
  await apiClient.delete(`/upload/${filename}`);
};
