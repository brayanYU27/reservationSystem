import { Prisma, PrismaClient } from '@prisma/client';
import { Appointment, AppointmentStatus } from './entities/Appointment.js';

export type DbClient = PrismaClient | Prisma.TransactionClient;

export interface CreateAppointmentRepositoryInput {
  businessId: string;
  serviceId: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  clientNotes?: string;
  clientId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface IAppointmentRepository {
  create(data: CreateAppointmentRepositoryInput, dbClient?: DbClient): Promise<Appointment>;
}
