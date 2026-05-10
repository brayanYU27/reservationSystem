import { prisma } from '../../config/database.js';
import {
  IServiceRepository,
  CreateServiceRepositoryInput,
  UpdateServiceRepositoryInput,
} from '../../core/domain/IServiceRepository.js';
import { Service } from '../../core/domain/entities/Service.js';
import { ServiceMapper } from './ServiceMapper.js';
import { notFound } from '../../middleware/errorHandler.js';

export class PrismaServiceRepository implements IServiceRepository {
  async create(data: CreateServiceRepositoryInput): Promise<Service> {
    const created = await prisma.service.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        description: data.description,
        category: data.category,
        duration: data.duration,
        price: data.price,
        currency: data.currency ?? 'MXN',
        image: data.image,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
      },
    });

    return ServiceMapper.toDomain(created);
  }

  async findById(id: string, businessId: string): Promise<Service | null> {
    const service = await prisma.service.findFirst({
      where: { id, businessId },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    return service ? ServiceMapper.toDomain(service) : null;
  }

  async findByBusinessId(businessId: string, onlyActive: boolean = true): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    return services.map((service) => ServiceMapper.toDomain(service));
  }

  async update(id: string, businessId: string, data: UpdateServiceRepositoryInput): Promise<Service> {
    const existing = await prisma.service.findFirst({ where: { id, businessId }, select: { id: true } });
    if (!existing) {
      throw notFound('Servicio no encontrado para este negocio');
    }

    const updated = await prisma.service.update({
      where: { id: existing.id },
      data,
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    return ServiceMapper.toDomain(updated);
  }

  async softDelete(id: string, businessId: string): Promise<void> {
    const existing = await prisma.service.findFirst({ where: { id, businessId }, select: { id: true } });
    if (!existing) {
      throw notFound('Servicio no encontrado para este negocio');
    }

    await prisma.service.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }
}
