import { PrismaClient } from '@prisma/client';
import {
  IAppointmentRepository,
  CreateAppointmentRepositoryInput,
  DbClient,
} from '../domain/IAppointmentRepository.js';
import { IEmployeeRepository } from '../domain/IEmployeeRepository.js';
import { Appointment } from '../domain/entities/Appointment.js';
import {
  BusinessConflictError,
  ValidationError,
  ResourceNotFoundError,
} from '../domain/errors/AppError.js';

export interface CreateAppointmentInput {
  businessId: string;
  serviceId: string;
  employeeId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  clientNotes?: string;
  clientId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  actorBusinessId?: string;
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly employeeRepository: IEmployeeRepository,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    if (input.actorBusinessId && input.actorBusinessId !== input.businessId) {
      throw new BusinessConflictError('El tenant del usuario no coincide con el businessId solicitado');
    }

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.findFirst({
        where: {
          id: input.serviceId,
          businessId: input.businessId,
          isActive: true,
        },
        select: {
          id: true,
          duration: true,
          price: true,
        },
      });

      if (!service) {
        throw new ResourceNotFoundError('Servicio');
      }

      const startDate = this.buildStartDateUtc(input.date, input.startTime);
      const endDate = new Date(startDate.getTime() + service.duration * 60_000);
      const endTime = this.toHHMM(endDate);

      const employeeId = await this.resolveEmployeeId(
        {
          businessId: input.businessId,
          requestedEmployeeId: input.employeeId,
          serviceId: input.serviceId,
          date: input.date,
          startTime: input.startTime,
          endTime,
        },
        tx
      );

      const createPayload: CreateAppointmentRepositoryInput = {
        businessId: input.businessId,
        serviceId: input.serviceId,
        employeeId,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime,
        duration: service.duration,
        price: service.price,
        status: 'PENDING',
        clientNotes: input.clientNotes,
        clientId: input.clientId,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
      };

      return this.appointmentRepository.create(createPayload, tx);
    });
  }

  private async resolveEmployeeId(params: {
    businessId: string;
    requestedEmployeeId?: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
  }, dbClient: DbClient): Promise<string> {
    if (params.requestedEmployeeId) {
      const employee = await dbClient.employee.findFirst({
        where: {
          id: params.requestedEmployeeId,
          businessId: params.businessId,
          isActive: true,
          services: { some: { id: params.serviceId } },
        },
        select: { id: true },
      });

      if (!employee) {
        throw new ResourceNotFoundError('Empleado del negocio para este servicio');
      }

      const hasConflict = await this.hasTimeConflict({
        businessId: params.businessId,
        employeeId: employee.id,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
      }, dbClient);

      if (hasConflict) {
        throw new BusinessConflictError('El barbero no está disponible en ese horario');
      }

      return employee.id;
    }

    const activeEmployees = await dbClient.employee.findMany({
      where: {
        businessId: params.businessId,
        isActive: true,
        services: { some: { id: params.serviceId } },
      },
      select: { id: true },
    });

    if (activeEmployees.length === 0) {
      throw new ResourceNotFoundError('Empleados disponibles para este servicio');
    }

    let availableEmployee: { id: string } | undefined;

    for (const employee of activeEmployees) {
      const hasConflict = await this.hasTimeConflict({
        businessId: params.businessId,
        employeeId: employee.id,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
      }, dbClient);

      if (!hasConflict) {
        availableEmployee = employee;
        break;
      }
    }

    if (!availableEmployee) {
      throw new BusinessConflictError('El barbero no está disponible en ese horario');
    }

    return availableEmployee.id;
  }

  private async hasTimeConflict(params: {
    businessId: string;
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
  }, dbClient: DbClient): Promise<boolean> {
    return this.employeeRepository.hasAppointmentsInRange({
      employeeId: params.employeeId,
      businessId: params.businessId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
    }, dbClient);
  }

  private buildStartDateUtc(date: string, startTime: string): Date {
    const [hours, minutes] = startTime.split(':').map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new ValidationError('startTime debe tener formato HH:mm válido');
    }

    const startDate = new Date(date);
    if (Number.isNaN(startDate.getTime())) {
      throw new ValidationError('date debe tener formato YYYY-MM-DD válido');
    }

    startDate.setUTCHours(hours, minutes, 0, 0);
    return startDate;
  }

  private toHHMM(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
