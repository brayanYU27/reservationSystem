export interface ServiceProps {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  currency: string;
  image: string | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  appointmentsCount?: number;
}

export class Service {
  constructor(public readonly props: ServiceProps) {}

  toJSON(): ServiceProps {
    return { ...this.props };
  }

  get id(): string { return this.props.id; }
  get businessId(): string { return this.props.businessId; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get category(): string { return this.props.category; }
  get duration(): number { return this.props.duration; }
  get price(): number { return this.props.price; }
  get currency(): string { return this.props.currency; }
  get image(): string | null { return this.props.image; }
  get isActive(): boolean { return this.props.isActive; }
  get order(): number { return this.props.order; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get appointmentsCount(): number | undefined { return this.props.appointmentsCount; }
}
