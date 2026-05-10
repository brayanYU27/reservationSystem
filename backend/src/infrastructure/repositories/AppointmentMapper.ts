import { Prisma } from '@prisma/client';
import { Appointment } from '../../core/domain/entities/Appointment.js';
import { EmployeeMapper } from './EmployeeMapper.js';
import { ServiceMapper } from './ServiceMapper.js';

type PrismaAppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    service: true;
    employee: {
      include: {
        user: true;
      };
    };
    business: true;
    client: {
      select: {
        email: true;
        firstName: true;
        lastName: true;
        phone: true;
      };
    };
  };
}>;

export class AppointmentMapper {
  static toDomain(prismaAppointment: PrismaAppointmentWithRelations): Appointment {
    return new Appointment({
      id: prismaAppointment.id,
      businessId: prismaAppointment.businessId,
      clientId: prismaAppointment.clientId,
      employeeId: prismaAppointment.employeeId,
      serviceId: prismaAppointment.serviceId,
      guestName: prismaAppointment.guestName,
      guestEmail: prismaAppointment.guestEmail,
      guestPhone: prismaAppointment.guestPhone,
      date: prismaAppointment.date,
      startTime: prismaAppointment.startTime,
      endTime: prismaAppointment.endTime,
      duration: prismaAppointment.duration,
      status: prismaAppointment.status,
      notes: prismaAppointment.notes,
      clientNotes: prismaAppointment.clientNotes,
      internalNotes: prismaAppointment.internalNotes,
      price: prismaAppointment.price,
      currency: prismaAppointment.currency,
      paymentMethod: prismaAppointment.paymentMethod,
      isPaid: prismaAppointment.isPaid,
      confirmedAt: prismaAppointment.confirmedAt,
      reminderSentAt: prismaAppointment.reminderSentAt,
      createdAt: prismaAppointment.createdAt,
      updatedAt: prismaAppointment.updatedAt,
      cancelledAt: prismaAppointment.cancelledAt,
      completedAt: prismaAppointment.completedAt,
      service: ServiceMapper.toDomain(prismaAppointment.service),
      business: {
        id: prismaAppointment.business.id,
        name: prismaAppointment.business.name,
        address: prismaAppointment.business.address,
        city: prismaAppointment.business.city,
        ownerId: prismaAppointment.business.ownerId,
      },
      client: prismaAppointment.client
        ? {
            email: prismaAppointment.client.email,
            firstName: prismaAppointment.client.firstName,
            lastName: prismaAppointment.client.lastName,
            phone: prismaAppointment.client.phone,
          }
        : null,
      employee: prismaAppointment.employee
        ? EmployeeMapper.toDomain(prismaAppointment.employee)
        : null,
    });
  }
}
