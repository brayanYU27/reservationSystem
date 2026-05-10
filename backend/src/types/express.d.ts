export {};

declare global {
  namespace Express {
    interface Request {
      businessId?: string;
      userId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        businessId?: string;
      };
    }
  }
}
