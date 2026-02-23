import { apiClient } from '@/lib/api-client';
import type { ApiResponse, Employee } from '@/types';

export const employeeService = {
  // Obtener todos los empleados del negocio
  getAll: async (): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get('/employees');
  },

  getByBusiness: async (businessId: string): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get('/employees');
  },

  // Crear un nuevo empleado
  create: async (data: any): Promise<ApiResponse<Employee>> => {
    return apiClient.post('/employees', data);
  },

  // Actualizar un empleado existente
  update: async (id: string, data: any): Promise<ApiResponse<Employee>> => {
    return apiClient.put(`/employees/${id}`, data);
  },

  // Eliminar (desactivar) un empleado
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/employees/${id}`);
  }
};
