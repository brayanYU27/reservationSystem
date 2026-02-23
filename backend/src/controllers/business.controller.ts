import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Category } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CONTROLADORES PÚBLICOS
// ============================================

// GET /api/businesses - Listar todos los negocios
export const getAllBusinesses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      category,
      city,
      search,
      query, // Alias for search
      limit = '20',
      offset = '0'
    } = req.query;

    const searchTerm = (search || query) as string;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category as Category;
    }

    if (city) {
      where.city = {
        contains: city as string,
        mode: 'insensitive'
      };
    }

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: [
          { rating: 'desc' },
          { totalReviews: 'desc' }
        ],
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          services: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
            }
          },
          _count: {
            select: {
              services: true,
              employees: true,
            }
          }
        }
      }),
      prisma.business.count({ where })
    ]);

    // Transformar datos para cumplir con BusinessSearchResult
    const formattedBusinesses = businesses.map(business => {
      // Calcular rango de precios
      const prices = business.services.map(s => s.price);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      // Calcular si está abierto ahora (simple implementation)
      // TODO: Implementar lógica real con workingHours y fecha actual
      const isOpenNow = false;

      return {
        ...business,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        isOpenNow,
        services: business.services.slice(0, 5) // Limitar servicios en la respuesta procesada
      };
    });

    return res.json({
      success: true,
      data: {
        businesses: formattedBusinesses,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      }
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/businesses/:id - Obtener negocio por ID
export const getBusinessById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          }
        },
        services: {
          where: { isActive: true },
        },
        employees: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            }
          }
        },
        gallery: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            services: true,
            employees: true,
            appointments: true,
            reviews: true
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    return res.json({
      success: true,
      data: business
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/businesses/slug/:slug - Obtener negocio por slug
export const getBusinessBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params as { slug: string };

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          }
        },
        services: {
          where: { isActive: true },
        },
        employees: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            }
          }
        },
        gallery: true,
        _count: {
          select: {
            services: true,
            employees: true,
            appointments: true,
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    return res.json({
      success: true,
      data: business
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// CONTROLADORES PROTEGIDOS
// ============================================

// POST /api/businesses - Crear negocio (requiere auth)
export const createBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    const {
      name,
      category,
      description,
      address,
      city,
      state,
      postalCode,
      phone,
      email,
      whatsapp,
      website,
      socialMedia,
      workingHours,
      logo,
      coverImage,
      latitude,
      longitude,
    } = req.body;

    // Verificar que el usuario no tenga ya un negocio
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: userId }
    });

    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: 'Ya tienes un negocio registrado'
      });
    }

    // Generar slug único
    let slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slugExists = await prisma.business.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${slug}-${counter}`;
      slugExists = await prisma.business.findUnique({ where: { slug } });
      counter++;
    }

    const business = await prisma.business.create({
      data: {
        ownerId: userId,
        name,
        slug,
        category,
        description,
        address,
        city,
        state,
        postalCode,
        phone,
        email: email || `${phone}@temp.com`,
        whatsapp,
        website,
        latitude: latitude || null,
        longitude: longitude || null,
        socialMedia: socialMedia || {},
        workingHours: workingHours || {},
        settings: {
          bookingWindow: 30,
          cancellationPolicy: 24,
          autoConfirm: false,
          requireDeposit: false,
        },
        logo,
        coverImage,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: business,
      message: 'Negocio creado exitosamente'
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/businesses/:id - Actualizar negocio
export const updateBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;

    // Verificar propiedad
    const business = await prisma.business.findUnique({
      where: { id }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    if (business.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar este negocio'
      });
    }

    const {
      name,
      description,
      address,
      city,
      state,
      postalCode,
      phone,
      email,
      whatsapp,
      website,
      socialMedia,
      workingHours,
      settings,
      logo,
      coverImage,
    } = req.body;

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postalCode }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(website !== undefined && { website }),
        ...(socialMedia && { socialMedia }),
        ...(workingHours && { workingHours }),
        ...(settings && { settings }),
        ...(logo !== undefined && { logo }),
        ...(coverImage !== undefined && { coverImage }),
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Negocio actualizado exitosamente'
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/businesses/:id - Desactivar negocio
export const deleteBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;

    // Verificar propiedad
    const business = await prisma.business.findUnique({
      where: { id }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    if (business.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar este negocio'
      });
    }

    // Desactivar en lugar de eliminar
    await prisma.business.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Negocio desactivado exitosamente'
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/businesses/my/business - Obtener mi negocio
export const getMyBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    let business = await prisma.business.findFirst({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          }
        },
        services: true,
        employees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
              }
            }
          }
        },
        subscription: true,
        _count: {
          select: {
            services: true,
            employees: true,
            appointments: true,
          }
        }
      }
    });

    // Si no es dueño, verificar si es empleado
    if (!business) {
      const employee = await prisma.employee.findUnique({
        where: { userId },
        include: {
          business: {
            include: {
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  avatar: true,
                }
              },
              services: true,
              employees: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                      avatar: true,
                    }
                  }
                }
              },
              subscription: true,
              _count: {
                select: {
                  services: true,
                  employees: true,
                  appointments: true,
                }
              }
            }
          }
        }
      });

      if (employee) {
        business = employee.business;
      }
    }

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No tienes un negocio registrado ni estás vinculado como empleado'
      });
    }

    return res.json({
      success: true,
      data: business
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/businesses/:id/availability - Obtener horarios disponibles
export const getBusinessAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { date, serviceId, employeeId } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Fecha requerida' });
    }

    // 1. Obtener configuración del negocio (horarios)
    const business = await prisma.business.findUnique({
      where: { id: id as string },
      select: { workingHours: true }
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
    }

    // 2. Determinar día de la semana
    const searchDate = new Date(date as string);
    // Ajustar a zona horaria local o UTC según se necesite. 
    // Para simplificar, asumimos que 'date' viene YYYY-MM-DD y lo tratamos como local al negocio.
    // getDay() devuelve 0-6.
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    // IMPORTANTE: new Date('2024-02-12') en JS es UTC. new Date('2024-02-12T00:00:00') es local.
    // Usaremos UTC para evitar problemas de offset en el día.
    const dayName = days[searchDate.getUTCDay()];

    const workingHours = (business.workingHours as any[] || []).find((h: any) => h.day === dayName);

    if (!workingHours || !workingHours.isOpen) {
      return res.json({ success: true, data: [] }); // Cerrado este día
    }

    // 3. Generar slots base
    const slots: string[] = [];
    const [openHour, openMin] = workingHours.open.split(':').map(Number);
    const [closeHour, closeMin] = workingHours.close.split(':').map(Number);

    let current = new Date(searchDate);
    current.setUTCHours(openHour, openMin, 0, 0);

    const closeTime = new Date(searchDate);
    closeTime.setUTCHours(closeHour, closeMin, 0, 0);

    // Duración del servicio para verificar que cabe antes del cierre
    let serviceDuration = 30; // Default
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId as string } });
      if (service) serviceDuration = service.duration;
    }

    while (current.getTime() + serviceDuration * 60000 <= closeTime.getTime()) {
      const timeString = `${current.getUTCHours().toString().padStart(2, '0')}:${current.getUTCMinutes().toString().padStart(2, '0')}`;
      slots.push(timeString);
      // Incremento de 30 min por defecto
      current.setUTCMinutes(current.getUTCMinutes() + 30);
    }

    // 4. Obtener citas existentes
    const whereAppointments: any = {
      businessId: id,
      date: {
        gte: new Date(`${date}T00:00:00.000Z`),
        lte: new Date(`${date}T23:59:59.999Z`),
      },
      status: { not: 'CANCELLED' }
    };

    // 5. Obtener empleados activos
    const activeEmployees = await prisma.employee.findMany({
      where: {
        businessId: id as string,
        isActive: true
        // TODO: Filtrar por servicio que pueden realizar si existiera esa relación
      },
      select: { id: true }
    });

    if (activeEmployees.length === 0) {
      return res.json({ success: true, data: [] }); // Sin empleados no hay citas
    }

    if (employeeId) {
      whereAppointments.employeeId = employeeId;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: whereAppointments,
      select: { startTime: true, endTime: true, employeeId: true }
    });

    // 6. Generar respuesta con disponibilidad
    const finalSlots = slots.map(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + serviceDuration;

      let isAvailable = false;

      // Si se eligió un empleado, verificamos sus conflicto
      if (employeeId) {
        const hasConflict = existingAppointments.some(apt => {
          const [sh, sm] = apt.startTime.split(':').map(Number);
          const [eh, em] = apt.endTime.split(':').map(Number);
          const aptStart = sh * 60 + sm;
          const aptEnd = eh * 60 + em;
          return slotStart < aptEnd && slotEnd > aptStart; // Intersección
        });
        isAvailable = !hasConflict;
      } else {
        // "Cualquiera": El slot es válido si AL MENOS UN empleado está libre
        const freeEmployee = activeEmployees.find(emp => {
          const hasConflict = existingAppointments.some(apt => {
            if (apt.employeeId !== emp.id) return false;
            const [sh, sm] = apt.startTime.split(':').map(Number);
            const [eh, em] = apt.endTime.split(':').map(Number);
            const aptStart = sh * 60 + sm;
            const aptEnd = eh * 60 + em;
            return slotStart < aptEnd && slotEnd > aptStart;
          });
          return !hasConflict;
        });
        isAvailable = !!freeEmployee;
      }

      return {
        time: slot,
        available: isAvailable
      };
    });

    return res.json({
      success: true,
      data: finalSlots,
      // @ts-ignore
      debug: {
        dateProvided: date,
        dayName,
        workingHours: workingHours || 'NotFound',
        activeEmployees: activeEmployees.length,
        baseSlots: slots.length
      }
    });

  } catch (error) {
    return next(error);
  }
};

// GET /api/businesses/:id/appointments - Obtener citas de un negocio
export const getBusinessAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // Business ID
    const { dateFrom, dateTo, status } = req.query;

    const where: any = {
      businessId: id // Usar index directo de businessId
    };

    if (dateFrom && dateTo) {
      where.date = {
        gte: new Date(`${dateFrom}T00:00:00.000Z`),
        lte: new Date(`${dateTo}T23:59:59.999Z`),
      };
    }

    if (status && status !== 'all') {
      where.status = status as string;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true, // Importante para la tabla
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Formatear respuesta como espera el frontend
    const formattedAppointments = appointments.map(apt => ({
      ...apt,
      client: apt.client ? {
        ...apt.client,
        name: `${apt.client.firstName} ${apt.client.lastName}`,
      } : null,
    }));

    return res.json({ success: true, data: formattedAppointments });
  } catch (error) {
    return next(error);
  }
};
