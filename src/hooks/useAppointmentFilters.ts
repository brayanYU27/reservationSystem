/**
 * useAppointmentFilters.ts
 * 
 * Hook personalizado para centralizar la lógica de filtros de citas
 * Reutilizable entre AppointmentsTab y BusinessCalendarView
 * 
 * Beneficios:
 * - Sincronización automática de filtros entre vistas
 * - Código DRY (No se repite)
 * - Cambios en un lugar afectan a todas las vistas
 */

import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { format } from 'date-fns';

export interface AppointmentFilters {
  selectedDate: Date | undefined;
  selectedEmployeeId: string;
  searchTerm: string;
  filterStatus: string;
}

export interface UseAppointmentFiltersReturn {
  filters: AppointmentFilters;
  setSelectedDate: (date: Date | undefined) => void;
  setSelectedEmployeeId: (employeeId: string) => void;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: string) => void;
  resetFilters: () => void;
  getDateRange: () => { from: string; to: string };
}

interface AppointmentFiltersProviderProps {
  children: ReactNode;
  initialDate?: Date;
  initialEmployeeId?: string;
}

const AppointmentFiltersContext = createContext<UseAppointmentFiltersReturn | undefined>(undefined);

/**
 * Hook para manejar filtros de citas de manera centralizada
 * 
 * @param initialDate - Fecha inicial (por defecto hoy)
 * @param initialEmployeeId - ID de empleado inicial (por defecto 'all')
 * @returns Objeto con filtros y funciones para actualizarlos
 */
function useAppointmentFiltersState(
  initialDate?: Date,
  initialEmployeeId?: string
): UseAppointmentFiltersReturn {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate || new Date()
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialEmployeeId || 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const resetFilters = useCallback(() => {
    setSelectedDate(initialDate || new Date());
    setSelectedEmployeeId(initialEmployeeId || 'all');
    setSearchTerm('');
    setFilterStatus('all');
  }, [initialDate, initialEmployeeId]);

  const getDateRange = useCallback(() => {
    const date = selectedDate || new Date();
    const isoDate = format(date, 'yyyy-MM-dd');
    return {
      from: isoDate,
      to: isoDate,
    };
  }, [selectedDate]);

  return {
    filters: {
      selectedDate,
      selectedEmployeeId,
      searchTerm,
      filterStatus,
    },
    setSelectedDate,
    setSelectedEmployeeId,
    setSearchTerm,
    setFilterStatus,
    resetFilters,
    getDateRange,
  };
}

export function AppointmentFiltersProvider({
  children,
  initialDate,
  initialEmployeeId,
}: AppointmentFiltersProviderProps) {
  const value = useAppointmentFiltersState(initialDate, initialEmployeeId);
  const memoizedValue = useMemo(() => value, [value]);

  return createElement(AppointmentFiltersContext.Provider, { value: memoizedValue }, children);
}

export function useAppointmentFilters(): UseAppointmentFiltersReturn {
  const context = useContext(AppointmentFiltersContext);

  if (!context) {
    throw new Error('useAppointmentFilters must be used within an AppointmentFiltersProvider');
  }

  return context;
}
