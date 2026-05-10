/**
 * BusinessStats - Entidad de dominio para KPIs de negocio
 * 
 * Representa un conjunto de métricas agregadas de un negocio (barbería)
 * en un rango de fechas específico.
 */

export interface AppointmentStatusCount {
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'IN_PROGRESS' | 'CHECKED_IN';
  count: number;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

export interface BusinessStatsProps {
  businessId: string;
  dateFrom: Date;
  dateTo: Date;
  
  // KPIs principales
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  
  // Desglose por estado
  appointmentsByStatus: AppointmentStatusCount[];
  
  // Servicio más popular
  topService: TopService | null;
  
  // Timestamps
  generatedAt: Date;
}

/**
 * Entidad BusinessStats - Objeto de valor (Value Object)
 * 
 * Esta entidad solo contiene datos y no tiene comportamiento complejo.
 * Es inmutable y se usa para transferir datos entre capas.
 */
export class BusinessStats {
  private readonly props: BusinessStatsProps;

  constructor(props: BusinessStatsProps) {
    this.props = {
      ...props,
      generatedAt: props.generatedAt || new Date()
    };
  }

  // Getters para acceso inmutable
  get businessId(): string {
    return this.props.businessId;
  }

  get dateFrom(): Date {
    return this.props.dateFrom;
  }

  get dateTo(): Date {
    return this.props.dateTo;
  }

  get totalRevenue(): number {
    return this.props.totalRevenue;
  }

  get totalAppointments(): number {
    return this.props.totalAppointments;
  }

  get completedAppointments(): number {
    return this.props.completedAppointments;
  }

  get cancelledAppointments(): number {
    return this.props.cancelledAppointments;
  }

  get appointmentsByStatus(): AppointmentStatusCount[] {
    return [...this.props.appointmentsByStatus]; // Retornar copia para inmutabilidad
  }

  get topService(): TopService | null {
    return this.props.topService ? { ...this.props.topService } : null;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }

  // Métrica calculada: porcentaje de citas completadas
  get completionRate(): number {
    if (this.totalAppointments === 0) return 0;
    return Math.round((this.completedAppointments / this.totalAppointments) * 100);
  }

  // Métrica calculada: porcentaje de citas canceladas
  get cancellationRate(): number {
    if (this.totalAppointments === 0) return 0;
    return Math.round((this.cancelledAppointments / this.totalAppointments) * 100);
  }

  // Métrica calculada: ingresos promedio por cita completada
  get averageRevenuePerCompletedAppointment(): number {
    if (this.completedAppointments === 0) return 0;
    return Math.round((this.totalRevenue / this.completedAppointments) * 100) / 100;
  }

  /**
   * Convierte la entidad a un objeto plano (JSON)
   * Útil para serialización a respuestas HTTP
   */
  toJSON() {
    return {
      businessId: this.businessId,
      dateFrom: this.dateFrom.toISOString(),
      dateTo: this.dateTo.toISOString(),
      totalRevenue: this.totalRevenue,
      totalAppointments: this.totalAppointments,
      completedAppointments: this.completedAppointments,
      cancelledAppointments: this.cancelledAppointments,
      appointmentsByStatus: this.appointmentsByStatus,
      topService: this.topService,
      generatedAt: this.generatedAt.toISOString(),
      metrics: {
        completionRate: this.completionRate,
        cancellationRate: this.cancellationRate,
        averageRevenuePerCompletedAppointment: this.averageRevenuePerCompletedAppointment
      }
    };
  }
}
