export interface EmployeeUserSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

export interface EmployeeProps {
  id: string;
  userId: string;
  businessId: string;
  position: string;
  bio: string | null;
  specialties: string[];
  avatar: string | null;
  workingHours: unknown | null;
  rating: number;
  totalAppointments: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: EmployeeUserSnapshot | null;
  appointmentsCount?: number;
}

export class Employee {
  constructor(public readonly props: EmployeeProps) {}

  toJSON(): EmployeeProps {
    return { ...this.props };
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get businessId(): string { return this.props.businessId; }
  get position(): string { return this.props.position; }
  get bio(): string | null { return this.props.bio; }
  get specialties(): string[] { return this.props.specialties; }
  get avatar(): string | null { return this.props.avatar; }
  get workingHours(): unknown | null { return this.props.workingHours; }
  get rating(): number { return this.props.rating; }
  get totalAppointments(): number { return this.props.totalAppointments; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get user(): EmployeeUserSnapshot | null | undefined { return this.props.user; }
  get appointmentsCount(): number | undefined { return this.props.appointmentsCount; }
}
