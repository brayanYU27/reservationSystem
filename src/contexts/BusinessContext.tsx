import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { businessService } from '@/services/business.service';
import type { Business } from '@/types';

interface BusinessContextType {
  business: Business | null;
  isLoading: boolean;
  loadBusiness: () => Promise<void>;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Cargar negocio si el usuario es owner o employee
    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();
      if (userRole === 'business_owner' || userRole === 'employee') {
        loadBusiness();
      } else {
        setBusiness(null);
      }
    } else {
      setBusiness(null);
    }
  }, [user, isAuthenticated]);

  const loadBusiness = async () => {
    setIsLoading(true);
    try {
      const response = await businessService.getMyBusiness();
      if (response.success && response.data) {
        setBusiness(response.data);
      }
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBusiness = async (data: Partial<Business>) => {
    if (!business) {
      throw new Error('No hay negocio cargado');
    }

    const response = await businessService.update(business.id, data);
    
    if (response.success && response.data) {
      setBusiness(response.data);
    } else {
      throw new Error(response.error?.message || 'Error al actualizar negocio');
    }
  };

  const refreshBusiness = async () => {
    await loadBusiness();
  };

  return (
    <BusinessContext.Provider
      value={{
        business,
        isLoading,
        loadBusiness,
        updateBusiness,
        refreshBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
