export type BusinessHoursDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface BusinessHoursProps {
  id: string;
  businessId: string;
  day: BusinessHoursDay;
  isOpen: boolean;
  open: string;
  close: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BusinessHours {
  constructor(private readonly props: BusinessHoursProps) {}

  get id(): string { return this.props.id; }
  get businessId(): string { return this.props.businessId; }
  get day(): BusinessHoursDay { return this.props.day; }
  get isOpen(): boolean { return this.props.isOpen; }
  get open(): string { return this.props.open; }
  get close(): string { return this.props.close; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): BusinessHoursProps {
    return { ...this.props };
  }
}