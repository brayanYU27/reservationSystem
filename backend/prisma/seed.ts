import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getCurrentWeekMonday(date: Date): Date {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  const day = base.getDay(); // 0 domingo ... 6 sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diffToMonday);
  return base;
}

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  console.log('🧹 Limpiando datos existentes...');
  // await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.service.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.business.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Contraseña por defecto para todos los usuarios (hasheada)
  const defaultPassword = await bcrypt.hash('password123', 10);

  // ============================================
  // CREAR USUARIOS
  // ============================================
  console.log('👤 Creando usuarios...');

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@serviconnect.com',
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Clientes
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'maria.garcia@example.com',
        password: defaultPassword,
        firstName: 'María',
        lastName: 'García',
        phone: '5551234567',
        role: 'CLIENT',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'juan.perez@example.com',
        password: defaultPassword,
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '5557654321',
        role: 'CLIENT',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ana.martinez@example.com',
        password: defaultPassword,
        firstName: 'Ana',
        lastName: 'Martínez',
        phone: '5559876543',
        role: 'CLIENT',
        emailVerified: true,
      },
    }),
  ]);

  // Dueños de negocios
  const businessOwners = await Promise.all([
    prisma.user.create({
      data: {
        email: 'carlos@barbershop.com',
        password: defaultPassword,
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        phone: '5551111111',
        role: 'BUSINESS_OWNER',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'lucia@salon.com',
        password: defaultPassword,
        firstName: 'Lucía',
        lastName: 'Fernández',
        phone: '5552222222',
        role: 'BUSINESS_OWNER',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'miguel@spa.com',
        password: defaultPassword,
        firstName: 'Miguel',
        lastName: 'Torres',
        phone: '5553333333',
        role: 'BUSINESS_OWNER',
        emailVerified: true,
      },
    }),
  ]);

  // Empleados (usuarios que serán empleados)
  const employeeUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'pedro@example.com',
        password: defaultPassword,
        firstName: 'Pedro',
        lastName: 'Sánchez',
        phone: '5554444444',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia@example.com',
        password: defaultPassword,
        firstName: 'Sofía',
        lastName: 'López',
        phone: '5555555555',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'david@example.com',
        password: defaultPassword,
        firstName: 'David',
        lastName: 'Ramírez',
        phone: '5556666666',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    }),
  ]);

  console.log(`✅ ${1 + clients.length + businessOwners.length + employeeUsers.length} usuarios creados`);

  // ============================================
  // CREAR NEGOCIOS
  // ============================================
  console.log('🏢 Creando negocios...');

  const business1 = await prisma.business.create({
    data: {
      ownerId: businessOwners[0].id,
      name: 'Elite Barbershop',
      slug: 'elite-barbershop',
      category: 'BARBERSHOP',
      description: 'La mejor barbería de la ciudad. Cortes modernos y clásicos con atención personalizada.',
      logo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
      coverImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200',
      address: 'Av. Insurgentes 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '03100',
      phone: '5551111111',
      email: 'info@elitebarbershop.com',
      whatsapp: '5551111111',
      website: 'https://elitebarbershop.com',
      socialMedia: {
        instagram: '@elitebarbershop',
        facebook: 'elitebarbershop',
      },
      workingHours: [
        { day: 'monday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'tuesday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'wednesday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'thursday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'friday', open: '09:00', close: '21:00', isOpen: true },
        { day: 'saturday', open: '10:00', close: '19:00', isOpen: true },
        { day: 'sunday', open: '10:00', close: '15:00', isOpen: true },
      ],
      settings: {
        allowOnlineBooking: true,
        requiresDeposit: false,
        cancellationPolicy: '24 horas de anticipación',
        currency: 'MXN',
      },
      // @ts-ignore
      faqs: [
        { question: "¿Necesito hacer cita previa?", answer: "Sí, recomendamos agendar con anticipación para asegurar tu lugar." },
        { question: "¿Aceptan tarjeta?", answer: "Sí, aceptamos todas las tarjetas de crédito y débito, así como efectivo." },
        { question: "¿Tienen estacionamiento?", answer: "Sí, contamos con estacionamiento gratuito para clientes." }
      ] as Prisma.InputJsonValue,
      rating: 4.8,
      totalReviews: 156,
      isVerified: true,
    },
  });

  // Crear dueño para el negocio de ejemplo
  const patronOwner = await prisma.user.create({
    data: {
      email: 'patron@elpatron.com',
      firstName: 'Don',
      lastName: 'Patrón',
      password: defaultPassword,
      role: 'BUSINESS_OWNER',
      emailVerified: true,
    }
  });

  // Crear negocio adicional para reviews y faqs
  const businessWithReviewsAndFaqs = await prisma.business.create({
    data: {
      ownerId: patronOwner.id,
      name: 'Barbería "El Patrón"',
      slug: 'barberia-el-patron',
      category: 'BARBERSHOP',
      description: 'La mejor experiencia de barbería tradicional en el corazón de la ciudad. Nuestros maestros barberos combinan técnicas clásicas con estilos modernos.',
      address: 'Av. Insurgentes Sur 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '06600',
      phone: '5512345678',
      email: 'contacto@elpatron.com',
      workingHours: [
        { day: 'monday', isOpen: true, open: '09:00', close: '20:00' },
        { day: 'tuesday', isOpen: true, open: '09:00', close: '20:00' },
        { day: 'wednesday', isOpen: true, open: '09:00', close: '20:00' },
        { day: 'thursday', isOpen: true, open: '09:00', close: '20:00' },
        { day: 'friday', isOpen: true, open: '09:00', close: '20:00' },
        { day: 'saturday', isOpen: true, open: '10:00', close: '18:00' },
        { day: 'sunday', isOpen: false, open: '00:00', close: '00:00' }
      ],
      // @ts-ignore
      faqs: [
        { question: "¿Necesito hacer cita previa?", answer: "Sí, recomendamos agendar con anticipación para asegurar tu lugar, aunque aceptamos visitas si hay disponibilidad." },
        { question: "¿Qué formas de pago aceptan?", answer: "Aceptamos efectivo, tarjetas de crédito/débito y transferencias bancarias." },
        { question: "¿Puedo cancelar o reprogramar?", answer: "Sí, puedes cancelar o reprogramar hasta 2 horas antes de tu cita sin costo alguno." }
      ] as Prisma.InputJsonValue,
      settings: {
        allowOnlineBooking: true,
        requiresDeposit: false,
        cancellationPolicy: '24 horas de anticipación',
        currency: 'MXN',
      },
      rating: 4.8,
      totalReviews: 12,
      coverImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80',
    }
  });

  console.log('Business created:', businessWithReviewsAndFaqs.id);

  // Crear cliente para las reseñas
  const clientForReviews = await prisma.user.create({
    data: {
      email: 'cliente_reviews@ejemplo.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      password: defaultPassword,
      role: 'CLIENT',
      emailVerified: true,
    }
  });

  // Crear reseñas
  await prisma.review.createMany({
    data: [
      {
        businessId: businessWithReviewsAndFaqs.id,
        clientId: clientForReviews.id,
        rating: 5,
        comment: "Excelente servicio, un maestro con las tijeras. Siempre salgo satisfecho.",
        isVerified: true
      },
      {
        businessId: businessWithReviewsAndFaqs.id,
        clientId: clientForReviews.id,
        rating: 4,
        comment: "Buena atención y el lugar está muy limpio. Recomendado.",
        isVerified: true
      },
      {
        businessId: businessWithReviewsAndFaqs.id,
        clientId: clientForReviews.id,
        rating: 5,
        comment: "El mejor corte que me han hecho en años. Definitivamente regresaré.",
        isVerified: true
      }
    ]
  });

  // Reseñas para Elite Barbershop (business1)
  await prisma.review.createMany({
    data: [
      {
        businessId: business1.id,
        clientId: clients[0].id,
        rating: 5,
        comment: "¡Excelente servicio! Me encantó el corte.",
        isVerified: true
      },
      {
        businessId: business1.id,
        clientId: clients[1].id,
        rating: 4,
        comment: "Muy buenos barberos, aunque la espera fue un poco larga.",
        isVerified: true
      },
      {
        businessId: business1.id,
        clientId: clients[2].id,
        rating: 5,
        comment: "El mejor lugar de la ciudad, sin duda.",
        isVerified: true
      }
    ]
  });

  const business2 = await prisma.business.create({
    data: {
      ownerId: businessOwners[1].id,
      name: 'Bella Vista Salón',
      slug: 'bella-vista-salon',
      category: 'SALON',
      description: 'Salón de belleza integral. Cortes, color, tratamientos y más.',
      logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      coverImage: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200',
      address: 'Calle Reforma 456',
      city: 'Guadalajara',
      state: 'Jalisco',
      postalCode: '44100',
      phone: '5552222222',
      email: 'contacto@bellavista.com',
      whatsapp: '5552222222',
      socialMedia: {
        instagram: '@bellavistasalon',
        facebook: 'bellavistasalon',
      },
      workingHours: [
        { day: 'monday', open: '10:00', close: '19:00', isOpen: true },
        { day: 'tuesday', open: '10:00', close: '19:00', isOpen: true },
        { day: 'wednesday', open: '10:00', close: '19:00', isOpen: true },
        { day: 'thursday', open: '10:00', close: '19:00', isOpen: true },
        { day: 'friday', open: '10:00', close: '20:00', isOpen: true },
        { day: 'saturday', open: '09:00', close: '18:00', isOpen: true },
        { day: 'sunday', open: '00:00', close: '00:00', isOpen: false },
      ],
      settings: {
        allowOnlineBooking: true,
        requiresDeposit: true,
        depositAmount: 100,
        cancellationPolicy: '48 horas de anticipación',
        currency: 'MXN',
      },
      rating: 4.9,
      totalReviews: 234,
      isVerified: true,
    },
  });

  const business3 = await prisma.business.create({
    data: {
      ownerId: businessOwners[2].id,
      name: 'Zen Spa & Wellness',
      slug: 'zen-spa-wellness',
      category: 'SPA',
      description: 'Centro de relajación y bienestar. Masajes, faciales y tratamientos corporales.',
      logo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
      coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200',
      address: 'Blvd. Juárez 789',
      city: 'Monterrey',
      state: 'Nuevo León',
      postalCode: '64000',
      phone: '5553333333',
      email: 'info@zenspa.com',
      whatsapp: '5553333333',
      website: 'https://zenspa.com',
      socialMedia: {
        instagram: '@zenspa',
        facebook: 'zenspawellness',
      },
      workingHours: [
        { day: 'monday', open: '09:00', close: '21:00', isOpen: true },
        { day: 'tuesday', open: '09:00', close: '21:00', isOpen: true },
        { day: 'wednesday', open: '09:00', close: '21:00', isOpen: true },
        { day: 'thursday', open: '09:00', close: '21:00', isOpen: true },
        { day: 'friday', open: '09:00', close: '22:00', isOpen: true },
        { day: 'saturday', open: '10:00', close: '22:00', isOpen: true },
        { day: 'sunday', open: '10:00', close: '20:00', isOpen: true },
      ],
      settings: {
        allowOnlineBooking: true,
        requiresDeposit: true,
        depositAmount: 200,
        cancellationPolicy: '24 horas de anticipación',
        currency: 'MXN',
      },
      rating: 5.0,
      totalReviews: 98,
      isVerified: true,
    },
  });

  console.log('✅ 3 negocios creados');

  // ============================================
  // CREAR GALERÍA
  // ============================================
  console.log('🖼️ Creando galería de imágenes...');

  const galleryImages = {
    barbershop: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80',
      'https://images.unsplash.com/photo-1593702295094-aea8c5cadd32?w=800&q=80',
    ],
    salon: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80',
      'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80',
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80',
    ],
    spa: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
      'https://images.unsplash.com/photo-1519823551278-64ac927acdbc?w=800&q=80',
      'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80',
      'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=800&q=80',
    ]
  };

  await Promise.all([
    // Elite Barbershop Gallery
    ...galleryImages.barbershop.map((url, i) =>
      prisma.gallery.create({
        data: {
          businessId: business1.id,
          url,
          order: i,
          isFeatured: i < 4,
          title: `Trabajo de barbería ${i + 1}`,
        }
      })
    ),
    // Bella Vista Salon Gallery
    ...galleryImages.salon.map((url, i) =>
      prisma.gallery.create({
        data: {
          businessId: business2.id,
          url,
          order: i,
          isFeatured: i < 4,
          title: `Estilo de salón ${i + 1}`,
        }
      })
    ),
    // Zen Spa Gallery
    ...galleryImages.spa.map((url, i) =>
      prisma.gallery.create({
        data: {
          businessId: business3.id,
          url,
          order: i,
          isFeatured: i < 4,
          title: `Ambiente spa ${i + 1}`,
        }
      })
    )
  ]);

  console.log('✅ Galería creada');

  // ============================================
  // CREAR SUSCRIPCIONES
  // ============================================
  console.log('💳 Creando suscripciones...');

  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.create({
    data: {
      businessId: business1.id,
      tier: 'BASIC',
      status: 'ACTIVE',
      price: 299,
      currency: 'MXN',
      billingCycle: 'MONTHLY',
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthLater,
      limits: {
        employees: 3,
        services: 20,
        appointmentsPerMonth: 200,
      },
    },
  });

  await prisma.subscription.create({
    data: {
      businessId: business2.id,
      tier: 'PREMIUM',
      status: 'ACTIVE',
      price: 599,
      currency: 'MXN',
      billingCycle: 'MONTHLY',
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthLater,
      limits: {
        employees: 10,
        services: 50,
        appointmentsPerMonth: 1000,
      },
    },
  });

  await prisma.subscription.create({
    data: {
      businessId: business3.id,
      tier: 'PREMIUM',
      status: 'ACTIVE',
      price: 599,
      currency: 'MXN',
      billingCycle: 'MONTHLY',
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthLater,
      limits: {
        employees: 10,
        services: 50,
        appointmentsPerMonth: 1000,
      },
    },
  });

  console.log('✅ 3 suscripciones creadas');

  // ============================================
  // CREAR SERVICIOS
  // ============================================
  console.log('✂️ Creando servicios...');

  // Servicios para Elite Barbershop
  const services1 = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: 'Corte Clásico',
        description: 'Corte de cabello tradicional con tijeras y máquina',
        category: 'Corte',
        duration: 30,
        price: 200,
        image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
        order: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: 'Corte + Barba',
        description: 'Corte de cabello y arreglo de barba completo',
        category: 'Corte',
        duration: 45,
        price: 300,
        image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400',
        order: 2,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: 'Afeitado Clásico',
        description: 'Afeitado tradicional con navaja y toallas calientes',
        category: 'Afeitado',
        duration: 30,
        price: 180,
        order: 3,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: 'Tinte de Barba',
        description: 'Aplicación de tinte profesional para barba',
        category: 'Color',
        duration: 30,
        price: 250,
        order: 4,
      },
    }),
  ]);

  // Servicios para Bella Vista Salón
  const services2 = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: 'Corte de Dama',
        description: 'Corte de cabello estilizado para mujer',
        category: 'Corte',
        duration: 60,
        price: 350,
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
        order: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: 'Tinte Completo',
        description: 'Coloración completa del cabello',
        category: 'Color',
        duration: 120,
        price: 800,
        image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400',
        order: 2,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: 'Keratina',
        description: 'Tratamiento de keratina para alisar y nutrir',
        category: 'Tratamiento',
        duration: 180,
        price: 1200,
        order: 3,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: 'Peinado de Novia',
        description: 'Peinado profesional para tu día especial',
        category: 'Peinado',
        duration: 90,
        price: 600,
        order: 4,
      },
    }),
  ]);

  // Servicios para Zen Spa
  const services3 = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business3.id,
        name: 'Masaje Relajante',
        description: 'Masaje corporal completo de 60 minutos',
        category: 'Masaje',
        duration: 60,
        price: 500,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
        order: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business3.id,
        name: 'Facial Hidratante',
        description: 'Limpieza facial profunda con hidratación',
        category: 'Facial',
        duration: 60,
        price: 450,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
        order: 2,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business3.id,
        name: 'Masaje de Piedras',
        description: 'Masaje terapéutico con piedras calientes',
        category: 'Masaje',
        duration: 90,
        price: 700,
        order: 3,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business3.id,
        name: 'Paquete Spa Día',
        description: 'Experiencia completa: masaje, facial y aromaterapia',
        category: 'Paquete',
        duration: 180,
        price: 1500,
        order: 4,
      },
    }),
  ]);

  console.log('✅ 12 servicios creados');

  // ============================================
  // CREAR EMPLEADOS
  // ============================================
  console.log('👨‍💼 Creando empleados...');

  const employee1 = await prisma.employee.create({
    data: {
      userId: employeeUsers[0].id,
      businessId: business1.id,
      position: 'Barbero Master',
      bio: 'Más de 10 años de experiencia en cortes clásicos y modernos.',
      specialties: JSON.stringify(['Cortes', 'Barba', 'Fade']),
      rating: 4.9,
      totalAppointments: 450,
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      userId: employeeUsers[1].id,
      businessId: business2.id,
      position: 'Estilista Senior',
      bio: 'Especialista en colorimetría y tratamientos capilares.',
      specialties: JSON.stringify(['Color', 'Tratamientos', 'Peinados']),
      rating: 5.0,
      totalAppointments: 380,
    },
  });

  const employee3 = await prisma.employee.create({
    data: {
      userId: employeeUsers[2].id,
      businessId: business3.id,
      position: 'Terapeuta Certificado',
      bio: 'Especializado en masajes terapéuticos y relajación.',
      specialties: JSON.stringify(['Masajes', 'Aromaterapia', 'Reflexología']),
      rating: 4.8,
      totalAppointments: 320,
    },
  });

  // Vincular servicios a empleados
  await prisma.employee.update({
    where: { id: employee1.id },
    data: {
      services: {
        connect: services1.map(s => ({ id: s.id })),
      },
    },
  });

  await prisma.employee.update({
    where: { id: employee2.id },
    data: {
      services: {
        connect: services2.map(s => ({ id: s.id })),
      },
    },
  });

  await prisma.employee.update({
    where: { id: employee3.id },
    data: {
      services: {
        connect: services3.map(s => ({ id: s.id })),
      },
    },
  });

  console.log('✅ 3 empleados creados y vinculados a servicios');

  // ============================================
  // CREAR CITAS
  // ============================================
  console.log('📅 Creando citas...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Fechas pasadas para citas completadas
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  await Promise.all([
    // Citas FUTURAS para business1
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[0].id,
        employeeId: employee1.id,
        serviceId: services1[0].id,
        date: tomorrow,
        startTime: '10:00',
        endTime: '10:30',
        duration: 30,
        status: 'CONFIRMED',
        price: 200,
        isPaid: false,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[1].id,
        employeeId: employee1.id,
        serviceId: services1[1].id,
        date: tomorrow,
        startTime: '14:00',
        endTime: '14:45',
        duration: 45,
        status: 'PENDING',
        price: 300,
        isPaid: false,
      },
    }),

    // Citas COMPLETADAS para business1 (Elite Barbershop - para analytics)
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[0].id,
        employeeId: employee1.id,
        serviceId: services1[0].id,
        date: yesterday,
        startTime: '10:00',
        endTime: '10:30',
        duration: 30,
        status: 'COMPLETED',
        price: 200,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[1].id,
        employeeId: employee1.id,
        serviceId: services1[1].id,
        date: yesterday,
        startTime: '11:00',
        endTime: '11:45',
        duration: 45,
        status: 'COMPLETED',
        price: 300,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[2].id,
        employeeId: employee1.id,
        serviceId: services1[2].id,
        date: yesterday,
        startTime: '15:00',
        endTime: '15:30',
        duration: 30,
        status: 'COMPLETED',
        price: 180,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[0].id,
        employeeId: employee1.id,
        serviceId: services1[0].id,
        date: lastWeek,
        startTime: '10:00',
        endTime: '10:30',
        duration: 30,
        status: 'COMPLETED',
        price: 200,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[1].id,
        employeeId: employee1.id,
        serviceId: services1[1].id,
        date: lastWeek,
        startTime: '14:00',
        endTime: '14:45',
        duration: 45,
        status: 'COMPLETED',
        price: 300,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[2].id,
        employeeId: employee1.id,
        serviceId: services1[3].id,
        date: lastWeek,
        startTime: '16:00',
        endTime: '16:30',
        duration: 30,
        status: 'COMPLETED',
        price: 250,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[0].id,
        employeeId: employee1.id,
        serviceId: services1[1].id,
        date: lastMonth,
        startTime: '11:00',
        endTime: '11:45',
        duration: 45,
        status: 'COMPLETED',
        price: 300,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[1].id,
        employeeId: employee1.id,
        serviceId: services1[0].id,
        date: lastMonth,
        startTime: '13:00',
        endTime: '13:30',
        duration: 30,
        status: 'COMPLETED',
        price: 200,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[2].id,
        employeeId: employee1.id,
        serviceId: services1[1].id,
        date: lastMonth,
        startTime: '15:00',
        endTime: '15:45',
        duration: 45,
        status: 'COMPLETED',
        price: 300,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[0].id,
        employeeId: employee1.id,
        serviceId: services1[2].id,
        date: twoMonthsAgo,
        startTime: '10:00',
        endTime: '10:30',
        duration: 30,
        status: 'COMPLETED',
        price: 180,
        isPaid: true,
      },
    }),

    // Algunas citas canceladas y no show para business1
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[1].id,
        employeeId: employee1.id,
        serviceId: services1[0].id,
        date: yesterday,
        startTime: '12:00',
        endTime: '12:30',
        duration: 30,
        status: 'CANCELLED',
        price: 200,
        isPaid: false,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business1.id,
        clientId: clients[2].id,
        employeeId: employee1.id,
        serviceId: services1[1].id,
        date: lastWeek,
        startTime: '17:00',
        endTime: '17:45',
        duration: 45,
        status: 'NO_SHOW',
        price: 300,
        isPaid: false,
      },
    }),

    // Citas para business2
    prisma.appointment.create({
      data: {
        businessId: business2.id,
        clientId: clients[2].id,
        employeeId: employee2.id,
        serviceId: services2[0].id,
        date: nextWeek,
        startTime: '11:00',
        endTime: '12:00',
        duration: 60,
        status: 'CONFIRMED',
        price: 350,
        isPaid: true,
      },
    }),
    prisma.appointment.create({
      data: {
        businessId: business2.id,
        clientId: clients[0].id,
        employeeId: employee2.id,
        serviceId: services2[1].id,
        date: nextWeek,
        startTime: '15:00',
        endTime: '17:00',
        duration: 120,
        status: 'PENDING',
        price: 800,
        isPaid: false,
      },
    }),

    // Citas para business3
    prisma.appointment.create({
      data: {
        businessId: business3.id,
        clientId: clients[1].id,
        employeeId: employee3.id,
        serviceId: services3[0].id,
        date: tomorrow,
        startTime: '16:00',
        endTime: '17:00',
        duration: 60,
        status: 'CONFIRMED',
        price: 500,
        isPaid: true,
      },
    }),
  ]);

  console.log('✅ 18 citas creadas (10 completadas, 5 futuras, 2 canceladas, 1 no show)');

  // ============================================
  // DATASET AGENDA VISUAL (LOFTWARE)
  // ============================================
  console.log('🗓️ Creando dataset Agenda Visual para Barbería Loftware...');

  const loftwareOwner = await prisma.user.create({
    data: {
      email: 'owner.loftware@barberia.com',
      password: defaultPassword,
      firstName: 'Lorenzo',
      lastName: 'Mendoza',
      phone: '5557771111',
      role: 'BUSINESS_OWNER',
      emailVerified: true,
    },
  });

  const loftwareBusiness = await prisma.business.create({
    data: {
      ownerId: loftwareOwner.id,
      name: 'Barbería Loftware',
      slug: 'barberia-loftware',
      category: 'BARBERSHOP',
      description: 'Barbería de pruebas para agenda visual multi-tenant.',
      address: 'Calle Circuito Digital 101',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '01010',
      phone: '5557772222',
      email: 'contacto@barberialoftware.com',
      whatsapp: '5557772222',
      workingHours: [
        { day: 'monday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'tuesday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'wednesday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'thursday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'friday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'saturday', open: '09:00', close: '20:00', isOpen: true },
        { day: 'sunday', open: '09:00', close: '20:00', isOpen: true },
      ],
      settings: {
        allowOnlineBooking: true,
        requiresDeposit: false,
        cancellationPolicy: '12 horas de anticipación',
        currency: 'MXN',
      },
      rating: 4.7,
      totalReviews: 0,
      isVerified: true,
    },
  });

  const loftwareServices = await Promise.all([
    prisma.service.create({
      data: {
        businessId: loftwareBusiness.id,
        name: 'Corte Express',
        description: 'Corte rápido con máquina y acabado.',
        category: 'Corte',
        duration: 30,
        price: 180,
        order: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId: loftwareBusiness.id,
        name: 'Corte Premium',
        description: 'Corte detallado con asesoría de estilo.',
        category: 'Corte',
        duration: 60,
        price: 320,
        order: 2,
      },
    }),
    prisma.service.create({
      data: {
        businessId: loftwareBusiness.id,
        name: 'Barba Tradicional',
        description: 'Alineado y perfilado de barba.',
        category: 'Barba',
        duration: 30,
        price: 160,
        order: 3,
      },
    }),
    prisma.service.create({
      data: {
        businessId: loftwareBusiness.id,
        name: 'Paquete Loftware',
        description: 'Corte + barba + acabado premium.',
        category: 'Paquete',
        duration: 60,
        price: 420,
        order: 4,
      },
    }),
  ]);

  const loftwareEmployeeUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'mateo.loftware@barberia.com',
        password: defaultPassword,
        firstName: 'Mateo',
        lastName: 'Reyes',
        phone: '5557773001',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ivan.loftware@barberia.com',
        password: defaultPassword,
        firstName: 'Iván',
        lastName: 'Salas',
        phone: '5557773002',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'diego.loftware@barberia.com',
        password: defaultPassword,
        firstName: 'Diego',
        lastName: 'Vega',
        phone: '5557773003',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    }),
  ]);

  const loftwareEmployees = await Promise.all([
    prisma.employee.create({
      data: {
        userId: loftwareEmployeeUsers[0].id,
        businessId: loftwareBusiness.id,
        position: 'Barbero Senior',
        bio: 'Especialista en fades y estilos clásicos.',
        specialties: JSON.stringify(['Fade', 'Corte clásico']),
      },
    }),
    prisma.employee.create({
      data: {
        userId: loftwareEmployeeUsers[1].id,
        businessId: loftwareBusiness.id,
        position: 'Barbero Stylist',
        bio: 'Especialista en diseño y perfilado.',
        specialties: JSON.stringify(['Diseño', 'Perfilado']),
      },
    }),
    prisma.employee.create({
      data: {
        userId: loftwareEmployeeUsers[2].id,
        businessId: loftwareBusiness.id,
        position: 'Barbero Técnico',
        bio: 'Atención express y acabados limpios.',
        specialties: JSON.stringify(['Express', 'Acabados']),
      },
    }),
  ]);

  await Promise.all(
    loftwareEmployees.map((employee) =>
      prisma.employee.update({
        where: { id: employee.id },
        data: {
          services: {
            connect: loftwareServices.map((service) => ({ id: service.id })),
          },
        },
      })
    )
  );

  const weekStart = getCurrentWeekMonday(new Date());

  const slotTemplates: Array<{ dayOffset: number; startTime: string; duration: 30 | 60; serviceIndex: number }> = [
    { dayOffset: 0, startTime: '09:00', duration: 30, serviceIndex: 0 },
    { dayOffset: 0, startTime: '10:00', duration: 60, serviceIndex: 1 },
    { dayOffset: 0, startTime: '12:00', duration: 30, serviceIndex: 2 },
    { dayOffset: 0, startTime: '14:00', duration: 60, serviceIndex: 3 },
    { dayOffset: 1, startTime: '09:30', duration: 30, serviceIndex: 0 },
    { dayOffset: 1, startTime: '11:00', duration: 60, serviceIndex: 1 },
    { dayOffset: 1, startTime: '13:30', duration: 30, serviceIndex: 2 },
    { dayOffset: 1, startTime: '15:00', duration: 60, serviceIndex: 3 },
    { dayOffset: 2, startTime: '09:00', duration: 30, serviceIndex: 0 },
    { dayOffset: 2, startTime: '10:30', duration: 60, serviceIndex: 1 },
    { dayOffset: 2, startTime: '12:30', duration: 30, serviceIndex: 2 },
    { dayOffset: 2, startTime: '16:00', duration: 60, serviceIndex: 3 },
    { dayOffset: 3, startTime: '09:00', duration: 30, serviceIndex: 0 },
    { dayOffset: 3, startTime: '11:30', duration: 60, serviceIndex: 1 },
    { dayOffset: 3, startTime: '14:30', duration: 30, serviceIndex: 2 },
    { dayOffset: 3, startTime: '17:00', duration: 60, serviceIndex: 3 },
    { dayOffset: 4, startTime: '09:30', duration: 30, serviceIndex: 0 },
    { dayOffset: 4, startTime: '10:30', duration: 60, serviceIndex: 1 },
    { dayOffset: 4, startTime: '13:00', duration: 30, serviceIndex: 2 },
    { dayOffset: 4, startTime: '15:30', duration: 60, serviceIndex: 3 },
    { dayOffset: 5, startTime: '10:00', duration: 30, serviceIndex: 0 },
    { dayOffset: 5, startTime: '11:00', duration: 60, serviceIndex: 1 },
    { dayOffset: 5, startTime: '14:00', duration: 30, serviceIndex: 2 },
    { dayOffset: 6, startTime: '09:30', duration: 60, serviceIndex: 3 },
    { dayOffset: 6, startTime: '18:30', duration: 30, serviceIndex: 0 },
  ];

  const statusPlan = [
    ...Array(15).fill('COMPLETED'),
    ...Array(5).fill('CONFIRMED'),
    ...Array(3).fill('PENDING'),
    ...Array(2).fill('CANCELLED'),
  ] as const;

  await Promise.all(
    slotTemplates.map((slot, index) => {
      const status = statusPlan[index];
      const employee = loftwareEmployees[index % loftwareEmployees.length];
      const service = loftwareServices[slot.serviceIndex];
      const startMinutes = toMinutes(slot.startTime);
      const endTime = toHHMM(startMinutes + slot.duration);

      const appointmentDate = new Date(weekStart);
      appointmentDate.setDate(weekStart.getDate() + slot.dayOffset);
      appointmentDate.setHours(12, 0, 0, 0);

      const useRegisteredClient = index % 3 !== 0;
      const registeredClient = clients[index % clients.length];

      return prisma.appointment.create({
        data: {
          businessId: loftwareBusiness.id,
          clientId: useRegisteredClient ? registeredClient.id : null,
          guestName: useRegisteredClient ? null : `Invitado ${index + 1}`,
          guestEmail: useRegisteredClient ? null : `invitado${index + 1}@demo.com`,
          guestPhone: useRegisteredClient ? null : `55588${String(index).padStart(5, '0')}`,
          employeeId: employee.id,
          serviceId: service.id,
          date: appointmentDate,
          startTime: slot.startTime,
          endTime,
          duration: slot.duration,
          status,
          price: service.price,
          isPaid: status === 'COMPLETED',
          confirmedAt: status === 'COMPLETED' || status === 'CONFIRMED' ? new Date(appointmentDate) : null,
          completedAt: status === 'COMPLETED' ? new Date(appointmentDate) : null,
          cancelledAt: status === 'CANCELLED' ? new Date(appointmentDate) : null,
        },
      });
    })
  );

  console.log('✅ Dataset Loftware creado: 1 negocio, 4 servicios, 3 empleados y 25 citas de la semana actual');

  // ============================================
  // CREAR IMÁGENES DE GALERÍA
  // ============================================
  console.log('🖼️  Creando imágenes de galería...');

  await Promise.all([
    // Galería de Elite Barbershop
    prisma.gallery.create({
      data: {
        businessId: business1.id,
        url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
        title: 'Corte Clásico',
        description: 'Corte tradicional con acabado perfecto',
        isFeatured: true,
        order: 1,
      },
    }),
    prisma.gallery.create({
      data: {
        businessId: business1.id,
        url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800',
        title: 'Fade Moderno',
        description: 'Degradado de alta precisión',
        isFeatured: true,
        order: 2,
      },
    }),
    prisma.gallery.create({
      data: {
        businessId: business1.id,
        url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800',
        title: 'Barba Perfecta',
        description: 'Perfilado y arreglo de barba',
        isFeatured: false,
        order: 3,
      },
    }),
    prisma.gallery.create({
      data: {
        businessId: business1.id,
        url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800',
        title: 'Estilo Contemporáneo',
        description: 'Corte moderno con diseño',
        isFeatured: false,
        order: 4,
      },
    }),
    prisma.gallery.create({
      data: {
        businessId: business1.id,
        url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
        title: 'Nuestro Local',
        description: 'Ambiente cómodo y profesional',
        isFeatured: false,
        order: 5,
      },
    }),
    prisma.gallery.create({
      data: {
        businessId: business1.id,
        url: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800',
        title: 'Herramientas Profesionales',
        description: 'Equipamiento de primera calidad',
        isFeatured: false,
        order: 6,
      },
    }),

    // Galería de Bella Vista Salón
    prisma.gallery.create({
      data: {
        businessId: business2.id,
        url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
        title: 'Color Vibrante',
        description: 'Tintes de última generación',
        isFeatured: true,
        order: 1,
      },
    }),
    prisma.gallery.create({
      data: {
        businessId: business2.id,
        url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
        title: 'Peinado Elegante',
        description: 'Estilismo para eventos',
        isFeatured: true,
        order: 2,
      },
    }),
  ]);

  console.log('✅ Imágenes de galería creadas');

  // ============================================
  // CREAR RESEÑAS
  // ============================================
  console.log('⭐ Creando reseñas...');

  await Promise.all([
    prisma.review.create({
      data: {
        businessId: business1.id,
        clientId: clients[0].id,
        rating: 5,
        comment: 'Excelente servicio, muy profesional. Volveré sin duda.',
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        businessId: business1.id,
        clientId: clients[1].id,
        rating: 4,
        comment: 'Buen corte, aunque tuve que esperar un poco.',
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        businessId: business2.id,
        clientId: clients[2].id,
        rating: 5,
        comment: 'El mejor salón de la ciudad. Lucía es increíble!',
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        businessId: business3.id,
        clientId: clients[0].id,
        rating: 5,
        comment: 'Una experiencia totalmente relajante. Recomendado 100%.',
        isVerified: true,
      },
    }),
  ]);

  console.log('✅ 4 reseñas creadas');

  console.log('\n✨ Seed completado exitosamente!\n');
  console.log('📋 Resumen:');
  console.log(`   - ${1 + clients.length + businessOwners.length + employeeUsers.length} usuarios`);
  console.log('   - 3 negocios');
  console.log('   - 3 suscripciones');
  console.log('   - 12 servicios');
  console.log('   - 3 empleados');
  console.log('   - 18 citas (10 completadas, 5 futuras, 2 canceladas, 1 no show)');
  console.log('   - 8 imágenes de galería');
  console.log('   - 4 reseñas');
  console.log('\n🔑 Credenciales de prueba:');
  console.log('   Admin: admin@serviconnect.com / password123');
  console.log('   Cliente: maria.garcia@example.com / password123');
  console.log('   Negocio: carlos@barbershop.com / password123');
  console.log('   Empleado: pedro@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
