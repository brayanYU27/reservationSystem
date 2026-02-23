# Backend - Barber Shop Reservation System

## Stack Tecnológico

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod
- **File uploads**: Multer + Cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer / SendGrid
- **SMS/WhatsApp**: Twilio

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/              # Configuración de la app
│   │   ├── database.ts
│   │   ├── cloudinary.ts
│   │   ├── stripe.ts
│   │   └── env.ts
│   ├── middleware/          # Middlewares personalizados
│   │   ├── auth.ts
│   │   ├── tenant.ts
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   ├── routes/              # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── business.routes.ts
│   │   ├── service.routes.ts
│   │   ├── appointment.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── review.routes.ts
│   │   └── subscription.routes.ts
│   ├── controllers/         # Lógica de negocio
│   │   ├── auth.controller.ts
│   │   ├── business.controller.ts
│   │   ├── service.controller.ts
│   │   ├── appointment.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── review.controller.ts
│   │   └── subscription.controller.ts
│   ├── services/            # Servicios auxiliares
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   ├── storage.service.ts
│   │   ├── payment.service.ts
│   │   └── notification.service.ts
│   ├── utils/               # Utilidades
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── types/               # Tipos TypeScript (compartidos con frontend)
│   │   └── index.ts
│   └── server.ts            # Punto de entrada
├── prisma/
│   ├── schema.prisma        # Esquema de base de datos
│   ├── migrations/
│   └── seed.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Instalación

```bash
cd backend
npm install
```

## Variables de Entorno

Ver `.env.example` para la configuración requerida.

## Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Compilar
npm start            # Producción
npm run migrate      # Ejecutar migraciones
npm run seed         # Poblar BD con datos de ejemplo
```

## Características Clave

### Multi-tenancy
Cada negocio es un tenant aislado con:
- Datos separados por `businessId`
- Middleware que inyecta contexto del tenant
- Validación de permisos por tenant

### Autenticación
- JWT con refresh tokens
- Roles: client, business_owner, employee, admin
- Protección de rutas por rol

### Sistema de Reservas
- Validación de disponibilidad en tiempo real
- Prevención de doble-booking
- Confirmaciones automáticas
- Recordatorios por email/SMS

### Suscripciones
- Planes: Free, Basic, Premium, Enterprise
- Facturación mensual/anual
- Límites por plan
- Integración con Stripe
