import { apiClient } from '@/lib/api-client';
import type { 
  Subscription, 
  SubscriptionTier,
  ApiResponse 
} from '@/types';

export const subscriptionService = {
  // Obtener planes disponibles
  async getPlans(): Promise<ApiResponse<{
    tier: SubscriptionTier;
    name: string;
    price: number;
    currency: string;
    features: string[];
    limits: Subscription['limits'];
  }[]>> {
    return apiClient.get('/subscriptions/plans');
  },

  // Obtener suscripción actual
  async getCurrent(businessId: string): Promise<ApiResponse<Subscription>> {
    return apiClient.get<Subscription>(`/businesses/${businessId}/subscription`);
  },

  // Crear suscripción
  async create(
    businessId: string, 
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<ApiResponse<Subscription>> {
    return apiClient.post<Subscription>(`/businesses/${businessId}/subscription`, {
      tier,
      billingCycle,
    });
  },

  // Actualizar suscripción
  async upgrade(
    businessId: string, 
    tier: SubscriptionTier
  ): Promise<ApiResponse<Subscription>> {
    return apiClient.post<Subscription>(
      `/businesses/${businessId}/subscription/upgrade`,
      { tier }
    );
  },

  // Cancelar suscripción
  async cancel(businessId: string): Promise<ApiResponse<Subscription>> {
    return apiClient.post<Subscription>(
      `/businesses/${businessId}/subscription/cancel`
    );
  },

  // Reactivar suscripción
  async reactivate(businessId: string): Promise<ApiResponse<Subscription>> {
    return apiClient.post<Subscription>(
      `/businesses/${businessId}/subscription/reactivate`
    );
  },

  // Obtener historial de facturación
  async getBillingHistory(businessId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/businesses/${businessId}/subscription/billing`);
  },
};
