import { Employee } from './Employee.js';
import { Service } from './Service.js';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'IN_PROGRESS'
  | 'CHECKED_IN';

export interface AppointmentBusinessSnapshot {
  id: string;
  name: string;
  address: string;
  city: string;
  ownerId: string;
}

export interface AppointmentClientSnapshot {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}


export interface AppointmentProps {
  id: string;
  businessId: string;
  clientId: string | null;
  employeeId: string | null;
  serviceId: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  notes: string | null;
  clientNotes: string | null;
  internalNotes: string | null;
  price: number;
  currency: string;
  paymentMethod: string | null;
  isPaid: boolean;
  confirmedAt: Date | null;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  completedAt: Date | null;
  service: Service;
  business: AppointmentBusinessSnapshot;
  client: AppointmentClientSnapshot | null;
  employee: Employee | null;
}

export class Appointment {
  constructor(public readonly props: AppointmentProps) {}

  toJSON(): AppointmentProps {
    return {
      ...this.props,
      service: this.props.service,
      employee: this.props.employee,
    };
  }

  get id(): string { return this.props.id; }
  get businessId(): string { return this.props.businessId; }
  get clientId(): string | null { return this.props.clientId; }
  get employeeId(): string | null { return this.props.employeeId; }
  get serviceId(): string { return this.props.serviceId; }
  get guestName(): string | null { return this.props.guestName; }
  get guestEmail(): string | null { return this.props.guestEmail; }
  get guestPhone(): string | null { return this.props.guestPhone; }
  get date(): Date { return this.props.date; }
  get startTime(): string { return this.props.startTime; }
  get endTime(): string { return this.props.endTime; }
  get duration(): number { return this.props.duration; }
  get status(): AppointmentStatus { return this.props.status; }
  get notes(): string | null { return this.props.notes; }
  get clientNotes(): string | null { return this.props.clientNotes; }
  get internalNotes(): string | null { return this.props.internalNotes; }
  get price(): number { return this.props.price; }
  get currency(): string { return this.props.currency; }
  get paymentMethod(): string | null { return this.props.paymentMethod; }
  get isPaid(): boolean { return this.props.isPaid; }
  get confirmedAt(): Date | null { return this.props.confirmedAt; }
  get reminderSentAt(): Date | null { return this.props.reminderSentAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get cancelledAt(): Date | null { return this.props.cancelledAt; }
  get completedAt(): Date | null { return this.props.completedAt; }
  get service(): Service { return this.props.service; }
  get business(): AppointmentBusinessSnapshot { return this.props.business; }
  get client(): AppointmentClientSnapshot | null { return this.props.client; }
  get employee(): Employee | null { return this.props.employee; }
}
