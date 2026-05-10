import { prisma } from '../../config/database.js';
import {
  IAppointmentRepository,
  CreateAppointmentRepositoryInput,
  DbClient,
} from '../../core/domain/IAppointmentRepository.js';
import { Appointment } from '../../core/domain/entities/Appointment.js';
import { AppointmentMapper } from './AppointmentMapper.js';

export class PrismaAppointmentRepository implements IAppointmentRepository {
  async create(data: CreateAppointmentRepositoryInput, dbClient?: DbClient): Promise<Appointment> {
    const db = dbClient ?? prisma;

    const created = await db.appointment.create({
      data: {
        businessId: data.businessId,
        serviceId: data.serviceId,
        employeeId: data.employeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        status: data.status,
        clientNotes: data.clientNotes,
        price: data.price,
        clientId: data.clientId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
      },
      include: {
        service: true,
        employee: {
          include: {
            user: true,
          },
        },
        business: true,
        client: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    return AppointmentMapper.toDomain(created);
  }
}
