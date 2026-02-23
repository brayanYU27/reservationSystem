# Arquitectura del Sistema Multi-Tenant

## Frontend (React + TypeScript + Vite)

### Estructura de Carpetas
```
src/
├── types/                 # Tipos TypeScript compartidos
├── lib/                   # Configuración y utilidades
│   └── api-client.ts     # Cliente HTTP con interceptores
├── services/             # Capa de servicios (API calls)
│   ├── auth.service.ts
│   ├── business.service.ts
│   ├── appointment.service.ts
│   └── ...
├── contexts/             # Context API para estado global
│   ├── AuthContext.tsx
│   └── BusinessContext.tsx
├── hooks/                # Custom hooks
├── app/
│   ├── components/       # Componentes de la aplicación
│   └── App.tsx
└── main.tsx
```

### Características Implementadas
- ✅ Sistema de tipos TypeScript completo
- ✅ Cliente API con manejo de tokens
- ✅ Servicios para todas las entidades
- ✅ Context de autenticación
- ✅ Context de negocio (multi-tenant)

### Próximos Pasos Frontend
- [ ] Instalar React Router para navegación
- [ ] Crear páginas para cada vista
- [ ] Implementar formularios con react-hook-form
- [ ] Añadir gestión de estado avanzado (Zustand/Jotai opcional)
- [ ] Implementar componentes de búsqueda y filtrado

## Backend (Node.js + Express + Prisma + PostgreSQL)

### Estructura de Carpetas
```
backend/
├── prisma/
│   └── schema.prisma     # Esquema de base de datos
├── src/
│   ├── config/           # Configuración
│   ├── middleware/       # Middlewares (auth, tenant, error)
│   ├── routes/           # Definición de rutas
│   ├── controllers/      # Lógica de negocio
│   ├── services/         # Servicios auxiliares
│   └── server.ts         # Entrada principal
└── package.json
```

### Características Implementadas
- ✅ Esquema Prisma completo con multi-tenancy
- ✅ Servidor Express configurado
- ✅ Middleware de autenticación JWT
- ✅ Middleware de errores
- ✅ Rutas base para todas las entidades
- ✅ Variables de entorno

### Próximos Pasos Backend
- [ ] Implementar controllers con lógica de negocio
- [ ] Añadir validación con Zod
- [ ] Configurar Cloudinary para imágenes
- [ ] Integrar Stripe para pagos
- [ ] Implementar sistema de notificaciones (email/SMS)
- [ ] Crear seed para datos de prueba
- [ ] Implementar cálculo de disponibilidad de citas

## Base de Datos (PostgreSQL)

### Modelos Principales
- **User**: Usuarios del sistema (clientes, owners, empleados)
- **Business**: Negocios (tenants)
- **Service**: Servicios ofrecidos
- **Employee**: Empleados de los negocios
- **Appointment**: Reservas/citas
- **Subscription**: Suscripciones SaaS
- **Review**: Reseñas de clientes
- **Notification**: Sistema de notificaciones

### Configuración Multi-Tenant
Cada negocio tiene un `tenantId` único que aísla sus datos. El middleware inyecta el contexto del tenant en cada petición.

## Sistema de Autenticación

### JWT + Refresh Tokens
- Access Token: 15 minutos
- Refresh Token: 7 días
- Almacenamiento: localStorage (frontend)
- Invalidación: Tabla RefreshToken (backend)

### Roles
- `CLIENT`: Usuario que reserva citas
- `BUSINESS_OWNER`: Dueño del negocio
- `EMPLOYEE`: Empleado del negocio
- `ADMIN`: Administrador de la plataforma

## Sistema de Suscripciones

### Planes
1. **Free**: Básico con limitaciones
2. **Basic**: Funciones estándar
3. **Premium**: Funciones avanzadas
4. **Enterprise**: Sin límites + soporte

### Límites por Plan
- Número de empleados
- Número de servicios
- Citas por mes
- Analytics avanzados
- API access
- White label

## Flujos Principales

### 1. Onboarding de Negocio
1. Usuario se registra como `BUSINESS_OWNER`
2. Completa formulario de onboarding (BusinessOnboarding.tsx)
3. Sistema crea Business con plan Free
4. Redirige a panel de administración

### 2. Reserva de Cita
1. Cliente busca negocio en ExploreView
2. Selecciona servicio y empleado (opcional)
3. Elige fecha y hora disponible
4. Confirma reserva
5. Sistema valida disponibilidad
6. Envía confirmación por email/SMS

### 3. Gestión de Negocio
1. Owner accede a AdminView
2. Gestiona servicios, empleados, horarios
3. Ve citas del día/semana
4. Responde reseñas
5. Ve analytics y métricas

## Instalación Rápida

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run db:generate
npm run db:migrate
npm run dev
```

### Variables de Entorno Frontend
Crear `.env` en la raíz:
```
VITE_API_URL=http://localhost:3000/api
```

## Tecnologías

### Frontend
- React 18
- TypeScript
- Vite
- Radix UI (componentes)
- Tailwind CSS
- React Hook Form
- Zod (validación)

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Stripe
- Cloudinary
- Twilio/SendGrid

## Seguridad

- ✅ Helmet para headers HTTP
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ JWT con expiración
- ✅ Passwords hasheados con bcrypt
- ✅ Validación de entrada con Zod
- ✅ SQL injection protection (Prisma)
- ⏳ HTTPS en producción
- ⏳ Variables de entorno seguras
