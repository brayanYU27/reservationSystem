import { apiClient } from '@/lib/api-client';
import type {
  Appointment,
  AppointmentStatus,
  ApiResponse,
  PaginationParams
} from '@/types';

export interface CreateAppointmentData {
  businessId: string;
  serviceId: string;
  employeeId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  clientNotes?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface AppointmentFilters extends PaginationParams {
  businessId?: string;
  clientId?: string;
  employeeId?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
}

export const appointmentService = {
  // Crear cita
  async create(data: CreateAppointmentData): Promise<ApiResponse<Appointment>> {
    return apiClient.post<Appointment>('/appointments', data);
  },

  // Obtener cita por ID
  async getById(id: string): Promise<ApiResponse<Appointment>> {
    return apiClient.get<Appointment>(`/appointments/${id}`);
  },

  // Listar citas con filtros
  async list(filters: AppointmentFilters): Promise<ApiResponse<Appointment[]>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    return apiClient.get<Appointment[]>(`/appointments?${params.toString()}`);
  },

  // Obtener mis citas (como cliente)
  async getMyAppointments(filters?: Partial<AppointmentFilters>): Promise<ApiResponse<Appointment[]>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return apiClient.get<Appointment[]>(`/appointments/me?${params.toString()}`);
  },

  // Obtener citas de mi negocio
  async getBusinessAppointments(
    businessId: string,
    filters?: Partial<AppointmentFilters>
  ): Promise<ApiResponse<Appointment[]>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return apiClient.get<Appointment[]>(
      `/businesses/${businessId}/appointments?${params.toString()}`
    );
  },

  // Actualizar estado de cita
  async updateStatus(
    id: string,
    status: AppointmentStatus,
    notes?: string
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.patch<Appointment>(`/appointments/${id}/status`, {
      status,
      internalNotes: notes,
    });
  },

  // Confirmar cita
  async confirm(id: string): Promise<ApiResponse<Appointment>> {
    return this.updateStatus(id, 'CONFIRMED');
  },

  // Cancelar cita
  async cancel(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    return apiClient.post<Appointment>(`/appointments/${id}/cancel`, {
      reason,
    });
  },

  // Completar cita
  async complete(id: string): Promise<ApiResponse<Appointment>> {
    return this.updateStatus(id, 'COMPLETED');
  },

  // Marcar como no show
  async markNoShow(id: string): Promise<ApiResponse<Appointment>> {
    return this.updateStatus(id, 'NO_SHOW');
  },

  // Reprogramar cita
  async reschedule(
    id: string,
    newDate: string,
    newStartTime: string
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.post<Appointment>(`/appointments/${id}/reschedule`, {
      date: newDate,
      startTime: newStartTime,
    });
  },

  // Actualizar notas del cliente
  async updateClientNotes(id: string, notes: string): Promise<ApiResponse<Appointment>> {
    return apiClient.patch<Appointment>(`/appointments/${id}`, {
      clientNotes: notes,
    });
  },

  // Marcar como pagado
  async markAsPaid(
    id: string,
    paymentMethod: string
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.post<Appointment>(`/appointments/${id}/payment`, {
      paymentMethod,
    });
  },
};
