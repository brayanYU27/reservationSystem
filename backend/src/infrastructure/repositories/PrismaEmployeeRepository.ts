import { prisma } from '../../config/database.js';
import {
  IEmployeeRepository,
  CreateEmployeeRepositoryInput,
  EmployeeDbClient,
  EmployeeAppointmentRangeInput,
  UpdateEmployeeRepositoryInput,
} from '../../core/domain/IEmployeeRepository.js';
import { Employee } from '../../core/domain/entities/Employee.js';
import { EmployeeMapper } from './EmployeeMapper.js';
import { notFound } from '../../middleware/errorHandler.js';

export class PrismaEmployeeRepository implements IEmployeeRepository {
  async create(data: CreateEmployeeRepositoryInput): Promise<Employee> {
    const created = await prisma.employee.create({
      data: {
        userId: data.userId,
        businessId: data.businessId,
        position: data.position,
        bio: data.bio,
        specialties: JSON.stringify(data.specialties ?? []),
        avatar: data.avatar,
        workingHours: data.workingHours,
        isActive: data.isActive ?? true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    return EmployeeMapper.toDomain(created);
  }

  async findById(id: string, businessId: string): Promise<Employee | null> {
    const employee = await prisma.employee.findFirst({
      where: { id, businessId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    return employee ? EmployeeMapper.toDomain(employee) : null;
  }

  async findByBusinessId(businessId: string, onlyActive: boolean = true): Promise<Employee[]> {
    const employees = await prisma.employee.findMany({
      where: {
        businessId,
        ...(onlyActive ? { isActive: true } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return employees.map((employee) => EmployeeMapper.toDomain(employee));
  }

  async hasAppointmentsInRange(input: EmployeeAppointmentRangeInput, dbClient?: EmployeeDbClient): Promise<boolean> {
    const db = dbClient ?? prisma;

    const dayStart = new Date(input.date);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(input.date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const conflict = await db.appointment.findFirst({
      where: {
        businessId: input.businessId,
        employeeId: input.employeeId,
        status: { not: 'CANCELLED' },
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        OR: [
          {
            startTime: { lte: input.startTime },
            endTime: { gt: input.startTime },
          },
          {
            startTime: { lt: input.endTime },
            endTime: { gte: input.endTime },
          },
          {
            startTime: { gte: input.startTime },
            endTime: { lte: input.endTime },
          },
        ],
      },
      select: { id: true },
    });

    return Boolean(conflict);
  }

  async update(id: string, businessId: string, data: UpdateEmployeeRepositoryInput): Promise<Employee> {
    const existing = await prisma.employee.findFirst({ where: { id, businessId }, select: { id: true } });
    if (!existing) {
      throw notFound('Empleado no encontrado para este negocio');
    }

    const updated = await prisma.employee.update({
      where: { id: existing.id },
      data: {
        ...(data.position !== undefined ? { position: data.position } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.specialties !== undefined ? { specialties: JSON.stringify(data.specialties) } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
        ...(data.workingHours !== undefined ? { workingHours: data.workingHours } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    return EmployeeMapper.toDomain(updated);
  }

  async softDelete(id: string, businessId: string): Promise<void> {
    const existing = await prisma.employee.findFirst({ where: { id, businessId }, select: { id: true } });
    if (!existing) {
      throw notFound('Empleado no encontrado para este negocio');
    }

    await prisma.employee.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }
}
