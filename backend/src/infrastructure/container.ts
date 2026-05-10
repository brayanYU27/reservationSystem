import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database.js';
import { PrismaServiceRepository } from './repositories/PrismaServiceRepository.js';
import { PrismaAppointmentRepository } from './repositories/PrismaAppointmentRepository.js';
import { PrismaEmployeeRepository } from './repositories/PrismaEmployeeRepository.js';
import { PrismaAnalyticsRepository } from './repositories/PrismaAnalyticsRepository.js';
import { CreateServiceUseCase } from '../core/application/CreateServiceUseCase.js';
import { UpdateServiceUseCase } from '../core/application/UpdateServiceUseCase.js';
import { CreateAppointmentUseCase } from '../core/application/CreateAppointmentUseCase.js';
import { GetBusinessStatsUseCase } from '../core/application/GetBusinessStatsUseCase.js';

export interface AppContainer {
  prisma: PrismaClient;
  repositories: {
    serviceRepository: PrismaServiceRepository;
    appointmentRepository: PrismaAppointmentRepository;
    employeeRepository: PrismaEmployeeRepository;
    analyticsRepository: PrismaAnalyticsRepository;
  };
  useCases: {
    createServiceUseCase: CreateServiceUseCase;
    updateServiceUseCase: UpdateServiceUseCase;
    createAppointmentUseCase: CreateAppointmentUseCase;
    getBusinessStatsUseCase: GetBusinessStatsUseCase;
  };
}

export const createContainer = (prismaClient: PrismaClient = defaultPrisma): AppContainer => {
  const serviceRepository = new PrismaServiceRepository();
  const appointmentRepository = new PrismaAppointmentRepository();
  const employeeRepository = new PrismaEmployeeRepository();
  const analyticsRepository = new PrismaAnalyticsRepository();

  const createServiceUseCase = new CreateServiceUseCase(serviceRepository, prismaClient);
  const updateServiceUseCase = new UpdateServiceUseCase(serviceRepository, prismaClient);
  const createAppointmentUseCase = new CreateAppointmentUseCase(
    appointmentRepository,
    employeeRepository,
    prismaClient
  );
  const getBusinessStatsUseCase = new GetBusinessStatsUseCase(analyticsRepository, prismaClient);

  return {
    prisma: prismaClient,
    repositories: {
      serviceRepository,
      appointmentRepository,
      employeeRepository,
      analyticsRepository,
    },
    useCases: {
      createServiceUseCase,
      updateServiceUseCase,
      createAppointmentUseCase,
      getBusinessStatsUseCase,
    },
  };
};

export const container = createContainer();
