# Guía de Configuración e Instalación

## Configurar Frontend

### 1. Instalar Dependencias Adicionales
```bash
# En la raíz del proyecto
npm install react-router-dom
```

### 2. Crear archivo .env
```bash
cp .env.example .env
```

Editar `.env` con:
```
VITE_API_URL=http://localhost:3000/api
```

### 3. Iniciar Frontend
```bash
npm run dev
```

El frontend estará en: http://localhost:5173

---

## Configurar Backend

### 1. Navegar a la carpeta backend
```bash
cd backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `backend/.env` con tus credenciales:
```env
# Base de datos - crear una BD PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/barber_shop?schema=public"

# JWT - cambiar a secretos seguros
JWT_SECRET=tu-secreto-super-seguro
JWT_REFRESH_SECRET=otro-secreto-para-refresh

# URLs
FRONTEND_URL=http://localhost:5173

# Opcional (para producción)
CLOUDINARY_CLOUD_NAME=...
STRIPE_SECRET_KEY=...
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
```

### 4. Configurar Base de Datos

#### Opción A: PostgreSQL Local
```bash
# macOS con Homebrew
brew install postgresql@16
brew services start postgresql@16

# Crear base de datos
createdb barber_shop
```

#### Opción B: PostgreSQL con Docker
```bash
docker run --name barber-shop-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=barber_shop \
  -p 5432:5432 \
  -d postgres:16
```

### 5. Ejecutar Migraciones
```bash
npm run db:generate
npm run db:migrate
```

### 6. (Opcional) Poblar con datos de ejemplo
```bash
npm run db:seed
```

### 7. Iniciar Backend
```bash
npm run dev
```

El backend estará en: http://localhost:3000

---

## Verificar Instalación

### Health Check
```bash
curl http://localhost:3000/health
```

Debe retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T..."
}
```

### Ver Base de Datos
```bash
cd backend
npm run db:studio
```

Abre Prisma Studio en: http://localhost:5555

---

## Estructura de Archivos Creados

### Frontend
```
src/
├── types/index.ts                    # Tipos TypeScript
├── lib/api-client.ts                 # Cliente HTTP
├── services/                         # Servicios API
│   ├── auth.service.ts
│   ├── business.service.ts
│   ├── appointment.service.ts
│   ├── service.service.ts
│   ├── employee.service.ts
│   ├── review.service.ts
│   ├── subscription.service.ts
│   ├── analytics.service.ts
│   └── index.ts
└── contexts/                         # Contextos React
    ├── AuthContext.tsx
    └── BusinessContext.tsx
```

### Backend
```
backend/
├── prisma/schema.prisma              # Esquema de BD
├── src/
│   ├── config/
│   │   ├── env.ts                    # Variables de entorno
│   │   └── database.ts               # Cliente Prisma
│   ├── middleware/
│   │   ├── auth.ts                   # Autenticación JWT
│   │   └── errorHandler.ts          # Manejo de errores
│   ├── routes/                       # Rutas API
│   │   ├── auth.routes.ts
│   │   ├── business.routes.ts
│   │   ├── service.routes.ts
│   │   ├── appointment.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── review.routes.ts
│   │   └── subscription.routes.ts
│   └── server.ts                     # Servidor Express
└── package.json
```

---

## Próximos Pasos Recomendados

### Backend (Prioritario)
1. **Implementar Controllers**: Crear la lógica de negocio en `controllers/`
2. **Validación**: Añadir validación con Zod en cada ruta
3. **Auth**: Completar el sistema de autenticación (registro, login, JWT)
4. **Reservas**: Implementar lógica de disponibilidad y creación de citas
5. **Testing**: Añadir tests con Jest o Vitest

### Frontend (Prioritario)
1. **React Router**: Implementar navegación entre páginas
2. **Login/Register**: Crear páginas de autenticación
3. **Dashboard**: Completar el panel de administración
4. **Búsqueda**: Mejorar componente de búsqueda de negocios
5. **Reservas**: Crear flujo completo de booking

### Integraciones (Opcional)
1. **Cloudinary**: Para subir imágenes de negocios/servicios
2. **Stripe**: Para procesar pagos de suscripciones
3. **SendGrid/Nodemailer**: Para enviar emails
4. **Twilio**: Para SMS y WhatsApp
5. **Google Maps**: Para geocoding y mapas

---

## Comandos Útiles

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview del build
```

### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Producción
npm run db:generate  # Generar cliente Prisma
npm run db:migrate   # Ejecutar migraciones
npm run db:push      # Push schema sin migración
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Poblar BD con datos
```

---

## Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```bash
cd backend
npm run db:generate
```

### Error: "Connection refused" en PostgreSQL
Verificar que PostgreSQL esté corriendo:
```bash
# macOS
brew services list

# Docker
docker ps
```

### Error de CORS
Verificar que `FRONTEND_URL` en backend/.env coincida con la URL del frontend.

### Error de JWT
Asegurarse de que `JWT_SECRET` esté configurado en backend/.env
