import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'BUSINESS_OWNER', 'EMPLOYEE'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Business schemas
export const createBusinessSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  category: z.enum(['BARBERSHOP', 'BEAUTY_SALON', 'SPA', 'NAILS', 'MASSAGE', 'TATTOO', 'OTHER'], {
    errorMap: () => ({ message: 'Categoría inválida' }),
  }),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  address: z.string().min(5, 'La dirección es requerida'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado es requerido'),
  postalCode: z.string().min(4, 'El código postal es requerido'),
  phone: z.string().min(10, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  workingHours: z.record(z.string(), z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  })).optional(),
  logo: z.string().url('URL inválida').optional().or(z.literal('')),
  coverImage: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  postalCode: z.string().min(4).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  workingHours: z.record(z.string(), z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  })).optional(),
  settings: z.object({
    bookingWindow: z.number().optional(),
    cancellationPolicy: z.number().optional(),
    autoConfirm: z.boolean().optional(),
    requireDeposit: z.boolean().optional(),
  }).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  coverImage: z.string().url().optional().or(z.literal('')),
});

// Employee schemas
export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  position: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  color: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  position: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
