import { Service as PrismaService } from '@prisma/client';
import { Service } from '../../core/domain/entities/Service.js';

type PrismaServiceWithOptionalCount = PrismaService & {
  _count?: {
    appointments?: number;
  };
};

export class ServiceMapper {
  static toDomain(prismaService: PrismaServiceWithOptionalCount): Service {
    return new Service({
      id: prismaService.id,
      businessId: prismaService.businessId,
      name: prismaService.name,
      description: prismaService.description,
      category: prismaService.category,
      duration: prismaService.duration,
      price: prismaService.price,
      currency: prismaService.currency,
      image: prismaService.image,
      isActive: prismaService.isActive,
      order: prismaService.order,
      createdAt: prismaService.createdAt,
      updatedAt: prismaService.updatedAt,
      appointmentsCount: prismaService._count?.appointments,
    });
  }
}
