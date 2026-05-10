import { Service } from './entities/Service.js';

export interface CreateServiceRepositoryInput {
  businessId: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  currency?: string;
  image?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateServiceRepositoryInput {
  name?: string;
  description?: string;
  category?: string;
  duration?: number;
  price?: number;
  currency?: string;
  image?: string | null;
  isActive?: boolean;
  order?: number;
}

export interface IServiceRepository {
  create(data: CreateServiceRepositoryInput): Promise<Service>;
  findById(id: string, businessId: string): Promise<Service | null>;
  findByBusinessId(businessId: string, onlyActive?: boolean): Promise<Service[]>;
  update(id: string, businessId: string, data: UpdateServiceRepositoryInput): Promise<Service>;
  softDelete(id: string, businessId: string): Promise<void>;
}
