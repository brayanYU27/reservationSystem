// ============================================
// TIPOS PRINCIPALES DEL SISTEMA MULTI-TENANT
// ============================================

export type UserRole = 'CLIENT' | 'BUSINESS_OWNER' | 'EMPLOYEE' | 'ADMIN' | 'client' | 'business_owner' | 'employee' | 'admin';
export type BusinessCategory = 'barbershop' | 'salon' | 'spa' | 'nails' | 'beauty' | 'other';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'IN_PROGRESS' | 'CHECKED_IN';
export type PaymentMethod = 'card' | 'cash' | 'transfer';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// ============================================
// USUARIO
// ============================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  businessId?: string; // Si es owner o employee
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  employeeProfile?: {
    id: string;
    businessId: string;
    position: string;
  };
}

// ... (skipping to Appointment)



export interface UserProfile extends User {
  favoriteBusinesses: string[]; // IDs de negocios favoritos
  appointmentHistory: AppointmentSummary[];
}

// ============================================
// NEGOCIO (TENANT)
// ============================================
export interface Business {
  id: string;
  tenantId: string; // ID único del tenant
  ownerId: string; // ID del usuario propietario
  name: string;
  slug: string; // URL amigable: serviconnect.com/barberia-downtown
  category: BusinessCategory;
  description: string;
  logo?: string;
  coverImage?: string;

  // Ubicación
  address: string;
  city: string;
  state: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Contacto
  phone: string;
  email: string;
  whatsapp?: string;
  website?: string;

  // Redes sociales
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };

  // Horarios
  workingHours: BusinessHours[];
  timezone: string;

  // Configuración
  settings: BusinessSettings;

  // Suscripción
  subscriptionId: string;
  subscriptionStatus: SubscriptionStatus;

  // Métricas
  rating: number;
  totalReviews: number;
  totalAppointments: number;

  // Estado
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  gallery?: GalleryImage[]; // Array de imágenes
  faqs?: { question: string; answer: string }[];
  reviews?: Review[];
  _count?: {
    reviews?: number;
    appointments?: number;
    services?: number;
    employees?: number;
  };
}

export interface GalleryImage {
  id: string;
  businessId: string;
  url: string;
  title?: string;
  description?: string;
  likes: number; // Added
  isFeatured: boolean;
  order: number;
}

export interface BusinessHours {
  day: DayOfWeek;
  isOpen: boolean;
  open: string; // formato: "09:00"
  close: string; // formato: "20:00"
  breaks?: {
    startTime: string;
    endTime: string;
  }[];
}

export interface BusinessSettings {
  // Reservas
  bookingAdvanceDays: number; // Días de anticipación para reservar
  bookingCancellationHours: number; // Horas antes para cancelar
  requiresConfirmation: boolean; // Requiere confirmación del negocio
  allowsOnlinePayment: boolean;
  autoConfirmBookings: boolean;

  // Notificaciones
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };

  // Apariencia
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
}

// ============================================
// SERVICIOS
// ============================================
export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;
  duration: number; // minutos
  price: number;
  currency: string;
  image?: string;
  isActive: boolean;
  order: number; // Para ordenar en la UI
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// EMPLEADOS
// ============================================
export interface Employee {
  id: string;
  userId: string; // Referencia al User
  businessId: string;
  position: string;
  bio?: string;
  specialties: string[];
  avatar?: string;

  // Horarios personalizados
  workingHours?: BusinessHours[];

  // Servicios que ofrece
  services: string[]; // IDs de servicios

  // Métricas
  rating: number;
  totalAppointments: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
}

// ============================================
// CITAS/RESERVAS
// ============================================
export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  employeeId?: string; // Opcional si no hay preferencia
  serviceId: string;

  // Fecha y hora
  date: Date;
  startTime: string; // "14:30"
  endTime: string; // "15:30"
  duration: number; // minutos

  // Estado
  status: AppointmentStatus;

  // Notas
  notes?: string;
  clientNotes?: string;
  internalNotes?: string;

  // Pago
  price: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  isPaid: boolean;

  // Confirmación y recordatorios
  confirmedAt?: Date;
  reminderSentAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;

  // Relations (populated)
  business?: {
    name: string;
    logo?: string;
    address: string;
    city: string;
  };
  service?: {
    name: string;
    duration: number;
    price: number;
  };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  employee?: {
    name: string; // or user.firstName + lastName
    avatar?: string;
  };
}

export interface AppointmentSummary {
  id: string;
  businessName: string;
  businessLogo?: string;
  serviceName: string;
  date: Date;
  startTime: string;
  status: AppointmentStatus;
  price: number;
}

// ============================================
// SUSCRIPCIONES
// ============================================
export interface Subscription {
  id: string;
  businessId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;

  // Facturación
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';

  // Fechas
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelledAt?: Date;

  // Límites según el tier
  limits: {
    maxEmployees: number;
    maxServices: number;
    maxAppointmentsPerMonth: number;
    customDomain: boolean;
    whiteLabel: boolean;
    advancedAnalytics: boolean;
    apiAccess: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// RESEÑAS
// ============================================
export interface Review {
  id: string;
  businessId: string;
  clientId: string;
  appointmentId?: string;
  rating: number; // 1-5
  comment?: string;
  client?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  response?: {
    text: string;
    respondedAt: Date;
    respondedBy: string;
  };
  isVerified: boolean; // Si vino de una cita real
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// NOTIFICACIONES
// ============================================
export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'reminder' | 'cancellation' | 'review' | 'subscription' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// ============================================
// ANALYTICS
// ============================================
export interface BusinessAnalytics {
  businessId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    totalRevenue: number;
    averageRating: number;
    newClients: number;
    returningClients: number;
    occupancyRate: number; // Porcentaje de tiempo ocupado
  };
  topServices: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }[];
  topEmployees: {
    employeeId: string;
    employeeName: string;
    appointmentCount: number;
    rating: number;
  }[];
}

// ============================================
// BÚSQUEDA Y FILTROS
// ============================================
export interface SearchFilters {
  query?: string;
  category?: BusinessCategory;
  city?: string;
  state?: string;
  rating?: number; // Mínimo rating
  priceRange?: {
    min: number;
    max: number;
  };
  services?: string[];
  isOpenNow?: boolean;
  hasAvailability?: boolean;
  sortBy?: 'rating' | 'distance' | 'price' | 'popularity';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  businesses: BusinessSearchResult[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BusinessSearchResult {
  id: string;
  name: string;
  slug: string;
  category: BusinessCategory;
  description?: string;
  logo?: string;
  coverImage?: string;
  rating: number;
  totalReviews: number;
  address: string;
  city: string;
  state: string;
  distance?: number; // km desde ubicación del usuario
  priceRange: {
    min: number;
    max: number;
  };
  services: {
    id: string;
    name: string;
    price: number;
  }[];
  isOpenNow: boolean;
  nextAvailableSlot?: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}
