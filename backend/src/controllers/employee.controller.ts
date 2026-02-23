import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();

// ============================================
// CREATE EMPLOYEE (AND USER)
// ============================================
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId; // Owner's ID
        const {
            firstName,
            lastName,
            email,
            phone,
            position,
            bio,
            specialties,
            avatar,
            color // Optional: For calendar color
        } = req.body;

        // 1. Verify Business Ownership
        const business = await prisma.business.findFirst({
            where: { ownerId: userId }
        });

        if (!business) {
            return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
        }

        // 2. Check limits (Subscription) - Optional for now

        // 3. Create or Link User
        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Create new user with default password
            const temporaryPassword = 'password123';
            const hashedPassword = await hashPassword(temporaryPassword);

            user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone,
                    role: 'EMPLOYEE',
                    emailVerified: true // Assume verified by admin
                }
            });
        } else {
            // Check if user is already an employee of ANY business? 
            // For simplicity, we allow one user to be employee in multiple businesses (logic allows it), 
            // but 'role' is single. If they were CLIENT, upgrade to EMPLOYEE? 
            // safer: If they are NOT admin/owner, set to EMPLOYEE.
            if (user.role === 'CLIENT') {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'EMPLOYEE' }
                });
            }
        }

        // 4. Check if already employee of THIS business
        const existingEmployee = await prisma.employee.findFirst({
            where: {
                userId: user.id,
                businessId: business.id
            }
        });

        if (existingEmployee) {
            // If inactive, reactivate?
            if (!existingEmployee.isActive) {
                const reactivated = await prisma.employee.update({
                    where: { id: existingEmployee.id },
                    data: { isActive: true, position, bio, specialties: JSON.stringify(specialties) }
                });
                return res.status(200).json({ success: true, data: reactivated, message: 'Empleado reactivado exitosamente' });
            }
            return res.status(400).json({ success: false, message: 'El usuario ya es empleado de este negocio' });
        }

        // 5. Create Employee Record
        const newEmployee = await prisma.employee.create({
            data: {
                userId: user.id,
                businessId: business.id,
                position,
                bio,
                specialties: JSON.stringify(specialties || []),
                isActive: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: newEmployee,
            message: 'Empleado agregado exitosamente'
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET EMPLOYEES
// ============================================
export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId; // Owner's ID

        // 1. Get Business
        const business = await prisma.business.findFirst({
            where: { ownerId: userId }
        });

        if (!business) {
            return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
        }

        // 2. Get Employees
        const employees = await prisma.employee.findMany({
            where: {
                businessId: business.id,
                isActive: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        appointments: true // Maybe filter by status?
                    }
                }
            }
        });

        // Parse specialties on the fly? Usually frontend handles JSON string, but cleaner if we parsed it.
        // Prisma returns it as string if mapped to String.
        const parsedEmployees = employees.map(emp => ({
            ...emp,
            specialties: typeof emp.specialties === 'string' ? JSON.parse(emp.specialties) : emp.specialties
        }));

        res.json({
            success: true,
            data: parsedEmployees
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// UPDATE EMPLOYEE
// ============================================
export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const {
            position,
            bio,
            specialties,
            isActive
        } = req.body;

        // Validation: Verify ownership (via middleware, but we double check relationship)
        // Actually, generic Auth middleware just gives us userId. 
        // We need to ensure the employee belongs to the owner's business.

        // ... (Skipping verbose ownership check for MVP speed, reliant on finding employee by ID AND business ownership)

        // 1. Find the employee and their business
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: { business: true }
        });

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        // 2. Verify Requesting User is Owner of that Business
        const requestingUserId = (req as any).userId;
        if (employee.business.ownerId !== requestingUserId) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        // 3. Update
        const updated = await prisma.employee.update({
            where: { id },
            data: {
                ...(position && { position }),
                ...(bio && { bio }),
                ...(specialties && { specialties: JSON.stringify(specialties) }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: {
                ...updated,
                specialties: typeof updated.specialties === 'string' ? JSON.parse(updated.specialties) : updated.specialties
            },
            message: 'Empleado actualizado'
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// DELETE EMPLOYEE
// ============================================
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const requestingUserId = (req as any).userId;

        const employee = await prisma.employee.findUnique({
            where: { id },
            include: { business: true }
        });

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        if (employee.business.ownerId !== requestingUserId) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        // Soft Delete
        await prisma.employee.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ success: true, message: 'Empleado eliminado exitosamente' });

    } catch (error) {
        next(error);
    }
};
