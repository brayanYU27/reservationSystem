import { Prisma, PrismaClient } from '@prisma/client';
import { Employee } from './entities/Employee.js';

export type EmployeeDbClient = PrismaClient | Prisma.TransactionClient;

export interface CreateEmployeeRepositoryInput {
  userId: string;
  businessId: string;
  position: string;
  bio?: string;
  specialties?: string[];
  avatar?: string;
  workingHours?: unknown;
  isActive?: boolean;
}

export interface UpdateEmployeeRepositoryInput {
  position?: string;
  bio?: string | null;
  specialties?: string[];
  avatar?: string | null;
  workingHours?: unknown;
  isActive?: boolean;
}

export interface EmployeeAppointmentRangeInput {
  employeeId: string;
  businessId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface IEmployeeRepository {
  create(data: CreateEmployeeRepositoryInput): Promise<Employee>;
  findById(id: string, businessId: string): Promise<Employee | null>;
  findByBusinessId(businessId: string, onlyActive?: boolean): Promise<Employee[]>;
  hasAppointmentsInRange(input: EmployeeAppointmentRangeInput, dbClient?: EmployeeDbClient): Promise<boolean>;
  update(id: string, businessId: string, data: UpdateEmployeeRepositoryInput): Promise<Employee>;
  softDelete(id: string, businessId: string): Promise<void>;
}
