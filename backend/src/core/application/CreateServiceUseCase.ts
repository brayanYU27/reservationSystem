import { PrismaClient } from '@prisma/client';
import { IServiceRepository } from '../domain/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
import { ResourceNotFoundError } from '../domain/errors/AppError.js';

export interface CreateServiceInput {
  businessId: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  image?: string;
}

export class CreateServiceUseCase {
  constructor(
    private readonly serviceRepository: IServiceRepository,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: CreateServiceInput): Promise<Service> {
    const business = await this.prisma.business.findUnique({
      where: { id: input.businessId },
      select: { id: true },
    });

    if (!business) {
      throw new ResourceNotFoundError('Negocio');
    }

    const lastService = await this.prisma.service.findFirst({
      where: { businessId: input.businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.serviceRepository.create({
      businessId: input.businessId,
      name: input.name,
      description: input.description,
      category: input.category,
      duration: input.duration,
      price: input.price,
      image: input.image,
      order: lastService ? lastService.order + 1 : 1,
    });
  }
}
