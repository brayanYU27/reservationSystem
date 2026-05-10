import { Employee as PrismaEmployee, User as PrismaUser } from '@prisma/client';
import { Employee } from '../../core/domain/entities/Employee.js';

type PrismaEmployeeWithOptionalRelations = PrismaEmployee & {
  user?: Pick<PrismaUser, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'avatar'> | null;
  _count?: {
    appointments?: number;
  };
};

export class EmployeeMapper {
  static toDomain(prismaEmployee: PrismaEmployeeWithOptionalRelations): Employee {
    return new Employee({
      id: prismaEmployee.id,
      userId: prismaEmployee.userId,
      businessId: prismaEmployee.businessId,
      position: prismaEmployee.position,
      bio: prismaEmployee.bio,
      specialties: this.parseSpecialties(prismaEmployee.specialties),
      avatar: prismaEmployee.avatar,
      workingHours: prismaEmployee.workingHours,
      rating: prismaEmployee.rating,
      totalAppointments: prismaEmployee.totalAppointments,
      isActive: prismaEmployee.isActive,
      createdAt: prismaEmployee.createdAt,
      updatedAt: prismaEmployee.updatedAt,
      user: prismaEmployee.user
        ? {
            id: prismaEmployee.user.id,
            firstName: prismaEmployee.user.firstName,
            lastName: prismaEmployee.user.lastName,
            email: prismaEmployee.user.email,
            phone: prismaEmployee.user.phone,
            avatar: prismaEmployee.user.avatar,
          }
        : null,
      appointmentsCount: prismaEmployee._count?.appointments,
    });
  }

  private static parseSpecialties(specialties: string): string[] {
    try {
      const parsed = JSON.parse(specialties);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
