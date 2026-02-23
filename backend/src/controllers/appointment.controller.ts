import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const prisma = new PrismaClient();

// Schema para validación
const createAppointmentSchema = z.object({
    businessId: z.string(),
    serviceId: z.string(),
    employeeId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
    clientNotes: z.string().optional(),
    // Guest fields (optional here, but required if no userId)
    guestName: z.string().optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().optional(),
});

// POST /api/appointments
export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        const data = createAppointmentSchema.parse(req.body);

        // If no user, require guest details
        if (!userId) {
            if (!data.guestName || !data.guestEmail || !data.guestPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de invitado requeridos (nombre, email, teléfono)'
                });
            }
        }

        // 1. Verificar disponibilidad (re-validación por seguridad)
        // Para simplificar, asumimos que el frontend ya validó, pero en producción
        // deberíamos checar doble reserva aquí.

        // 2. Obtener duración del servicio
        const service = await prisma.service.findUnique({
            where: { id: data.serviceId },
        });

        if (!service) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }

        // 4. Asignar empleado si no se seleccionó
        let employeeId = data.employeeId;
        const [hours, minutes] = data.startTime.split(':').map(Number);
        const startDate = new Date(data.date);

        // Ajuste de zona horaria: data.date suele ser YYYY-MM-DD. 
        // Al hacer new Date(data.date) es UTC. 
        // Para comparar con horarios de base de datos que están en UTC, está bien.
        // Pero para setHours, debemos usar setUTCHours para ser consistentes con la lógica de availability.
        startDate.setUTCHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime() + service.duration * 60000);
        const endTime = `${endDate.getUTCHours().toString().padStart(2, '0')}:${endDate.getUTCMinutes().toString().padStart(2, '0')}`;


        if (!employeeId) {
            // Buscar un empleado disponible que realice este servicio
            const activeEmployees = await prisma.employee.findMany({
                where: {
                    businessId: data.businessId,
                    isActive: true,
                },
                select: { id: true }
            });

            if (activeEmployees.length === 0) {
                return res.status(400).json({ success: false, message: 'No hay empleados disponibles' });
            }

            // Buscar conflictos para TODOS los empleados en este horario
            const conflicts = await prisma.appointment.findMany({
                where: {
                    businessId: data.businessId,
                    status: { not: 'CANCELLED' },
                    date: {
                        gte: new Date(new Date(data.date).setUTCHours(0, 0, 0, 0)), // Start of day UTC
                        lte: new Date(new Date(data.date).setUTCHours(23, 59, 59, 999)) // End of day UTC
                    },
                    OR: [
                        {
                            startTime: { lte: data.startTime },
                            endTime: { gt: data.startTime }
                        },
                        {
                            startTime: { lt: endTime },
                            endTime: { gte: endTime }
                        },
                        {
                            startTime: { gte: data.startTime },
                            endTime: { lte: endTime }
                        }
                    ]
                },
                select: { employeeId: true }
            });

            const busyEmployeeIds = new Set(conflicts.map(c => c.employeeId));

            // Encontrar el primer empleado que NO esté ocupado
            const availableEmployee = activeEmployees.find(emp => !busyEmployeeIds.has(emp.id));

            if (availableEmployee) {
                employeeId = availableEmployee.id;
            } else {
                return res.status(400).json({ success: false, message: 'No hay empleados disponibles en este horario (cupo lleno)' });
            }
        }

        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Error interno asignando empleado' });
        }

        // 5. Crear la cita
        const appointmentData: any = {
            businessId: data.businessId,
            serviceId: data.serviceId,
            employeeId: employeeId,
            date: new Date(data.date),
            startTime: data.startTime,
            endTime: endTime,
            status: 'PENDING',
            clientNotes: data.clientNotes,
            price: service.price,
            duration: service.duration,
        };

        if (userId) {
            appointmentData.clientId = userId;
        } else {
            appointmentData.guestName = data.guestName;
            appointmentData.guestEmail = data.guestEmail;
            appointmentData.guestPhone = data.guestPhone;
        }

        const appointment = await prisma.appointment.create({
            data: appointmentData,
            include: {
                service: true,
                employee: {
                    include: { user: true }
                },
                business: true,
                client: {
                    select: { email: true, firstName: true, lastName: true, phone: true }
                }
            }
        });

        // Send email notifications
        const customerEmail = userId ? appointment.client?.email : data.guestEmail;
        const customerName = userId
            ? `${appointment.client?.firstName} ${appointment.client?.lastName}`
            : data.guestName;

        if (customerEmail && customerName) {
            // Send confirmation to customer
            await EmailService.sendAppointmentConfirmation({
                to: customerEmail,
                customerName,
                businessName: appointment.business.name,
                serviceName: appointment.service.name,
                date: format(new Date(appointment.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
                time: appointment.startTime,
                address: `${appointment.business.address}, ${appointment.business.city}`,
                price: appointment.price,
                appointmentId: appointment.id
            });

            // Send in-app notification to customer (only if registered user)
            if (userId) {
                try {
                    await NotificationService.notifyAppointmentConfirmed({
                        userId,
                        businessName: appointment.business.name,
                        serviceName: appointment.service.name,
                        date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                        time: appointment.startTime,
                        appointmentId: appointment.id
                    });
                    console.log('✅ In-app notification sent to customer:', userId);
                } catch (error) {
                    console.error('❌ Error sending in-app notification to customer:', error);
                }
            }

            // Send notification to business owner
            const businessOwner = await prisma.user.findUnique({
                where: { id: appointment.business.ownerId },
                select: { email: true }
            });

            if (businessOwner?.email) {
                await EmailService.sendNewAppointmentNotification({
                    to: businessOwner.email,
                    businessName: appointment.business.name,
                    customerName,
                    serviceName: appointment.service.name,
                    date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                    time: appointment.startTime,
                    phone: userId ? (appointment.client?.phone || undefined) : data.guestPhone
                });

                // Send in-app notification to business owner
                try {
                    await NotificationService.notifyNewAppointment({
                        userId: appointment.business.ownerId,
                        customerName,
                        serviceName: appointment.service.name,
                        date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                        time: appointment.startTime,
                        appointmentId: appointment.id
                    });
                    console.log('✅ In-app notification sent to business owner:', appointment.business.ownerId);
                } catch (error) {
                    console.error('❌ Error sending in-app notification to business owner:', error);
                }

                // Send in-app notification to assigned employee
                if (appointment.employeeId) {
                    try {
                        const employee = await prisma.employee.findUnique({
                            where: { id: appointment.employeeId },
                            select: { userId: true }
                        });

                        if (employee?.userId) {
                            await NotificationService.notifyNewAppointment({
                                userId: employee.userId,
                                customerName,
                                serviceName: appointment.service.name,
                                date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                                time: appointment.startTime,
                                appointmentId: appointment.id
                            });
                            console.log('✅ In-app notification sent to employee:', employee.userId);
                        }
                    } catch (error) {
                        console.error('❌ Error sending in-app notification to employee:', error);
                    }
                }
            }
        }

        return res.status(201).json({
            success: true,
            data: appointment,
            message: 'Cita reservada con éxito'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, errors: error.errors });
        }
        return next(error);
    }
};

// GET /api/appointments/me
export const getMyAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;

        const appointments = await prisma.appointment.findMany({
            where: { clientId: userId },
            include: {
                business: {
                    select: { name: true, address: true }
                },
                service: {
                    select: { name: true, duration: true, price: true }
                },
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return res.json({ success: true, data: appointments });
    } catch (error) {
        return next(error);
    }
};

// PATCH /api/appointments/:id/status
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validar status
        const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'IN_PROGRESS', 'CHECKED_IN'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                client: { select: { id: true, email: true, firstName: true, lastName: true } },
                service: { select: { name: true } },
                business: { select: { name: true, ownerId: true } }
            }
        });

        // Send notifications when status changes to CONFIRMED
        if (status === 'CONFIRMED' && appointment.client) {
            try {
                // Notify customer
                await NotificationService.notifyAppointmentConfirmed({
                    userId: appointment.client.id,
                    businessName: appointment.business.name,
                    serviceName: appointment.service.name,
                    date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                    time: appointment.startTime,
                    appointmentId: appointment.id
                });
                console.log('✅ Confirmation notification sent to customer:', appointment.client.id);
            } catch (error) {
                console.error('❌ Error sending confirmation notification:', error);
            }

            // Notify business owner
            try {
                const customerName = `${appointment.client.firstName} ${appointment.client.lastName}`;
                await NotificationService.notifyNewAppointment({
                    userId: appointment.business.ownerId,
                    customerName,
                    serviceName: appointment.service.name,
                    date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                    time: appointment.startTime,
                    appointmentId: appointment.id
                });
                console.log('✅ New appointment notification sent to business owner:', appointment.business.ownerId);
            } catch (error) {
                console.error('❌ Error sending notification to business owner:', error);
            }
        }

        return res.json({ success: true, data: appointment });
    } catch (error) {
        return next(error);
    }
};

// POST /api/appointments/:id/cancel
export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { reason: _reason } = req.body;
        const userId = (req as any).userId;

        const appointment = await prisma.appointment.update({
            where: { id },
            data: {
                status: 'CANCELLED',
            },
            include: {
                client: {
                    select: { email: true, firstName: true, lastName: true }
                },
                service: {
                    select: { name: true }
                },
                business: {
                    select: { name: true }
                }
            }
        });

        // Send cancellation email
        const customerEmail = appointment.clientId ? appointment.client?.email : appointment.guestEmail;
        const customerName = appointment.clientId
            ? `${appointment.client?.firstName} ${appointment.client?.lastName}`
            : appointment.guestName;

        if (customerEmail && customerName) {
            await EmailService.sendAppointmentCancellation({
                to: customerEmail,
                customerName,
                businessName: appointment.business.name,
                serviceName: appointment.service.name,
                date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                time: appointment.startTime,
                cancelledBy: userId ? 'customer' : 'business'
            });

            // Send in-app notification to customer (only if registered user)
            if (appointment.clientId) {
                await NotificationService.notifyAppointmentCancelled({
                    userId: appointment.clientId,
                    businessName: appointment.business.name,
                    serviceName: appointment.service.name,
                    date: format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es }),
                    cancelledBy: userId ? 'customer' : 'business'
                });
            }
        }

        return res.json({ success: true, data: appointment });
    } catch (error) {
        return next(error);
    }
};

// GET /api/appointments
export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { employeeId, date, status, page = 1, limit = 100 } = req.query;

        const where: any = {};

        if (employeeId) {
            where.employeeId = String(employeeId);
        }

        if (date) {
            const searchDate = new Date(date as string);
            const startOfDay = new Date(searchDate.setUTCHours(0, 0, 0, 0));
            const endOfDay = new Date(searchDate.setUTCHours(23, 59, 59, 999));
            where.date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        if (status) {
            where.status = Array.isArray(status) ? status[0] : String(status);
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        price: true
                    }
                },
                employee: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'asc',
            },
            skip,
            take: Number(limit),
        });

        const total = await prisma.appointment.count({ where });

        return res.json({
            success: true,
            data: appointments,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        return next(error);
    }
};
