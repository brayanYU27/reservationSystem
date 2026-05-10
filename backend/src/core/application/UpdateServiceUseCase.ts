import { PrismaClient } from '@prisma/client';
import { IServiceRepository, UpdateServiceRepositoryInput } from '../domain/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
import {
  BusinessConflictError,
  ValidationError,
  ResourceNotFoundError,
} from '../domain/errors/AppError.js';

export interface UpdateServiceInput {
  serviceId: string;
  businessId: string;
  data: UpdateServiceRepositoryInput;
}

export class UpdateServiceUseCase {
  constructor(
    private readonly serviceRepository: IServiceRepository,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: UpdateServiceInput): Promise<Service> {
    const hasAnyFieldToUpdate = Object.keys(input.data).length > 0;
    if (!hasAnyFieldToUpdate) {
      throw new ValidationError('Debes enviar al menos un campo para actualizar');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: input.serviceId },
      select: { id: true, businessId: true },
    });

    if (!service) {
      throw new ResourceNotFoundError('Servicio');
    }

    if (service.businessId !== input.businessId) {
      throw new BusinessConflictError('El servicio no pertenece al businessId de la petición');
    }

    return this.serviceRepository.update(input.serviceId, input.businessId, input.data);
  }
}
