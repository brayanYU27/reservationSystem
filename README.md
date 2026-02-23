
  # Barber Shop Reservation System

  Sistema de reservas para barberías (frontend + backend) basado en el diseño original de Figma: https://www.figma.com/design/gOnpojmZUvyeOfT8gJVKBE/Barber-Shop-Reservation-System.

  Para una guía más detallada, consulta [SETUP.md](SETUP.md) y [ARCHITECTURE.md](ARCHITECTURE.md).

  ---

  ## Requisitos previos

  - Node.js y npm instalados (versión reciente recomendada).
  - PostgreSQL (local o vía Docker) para el backend.

  ---

  ## Instalación rápida

  ```bash
  # Clonar el repositorio
  git clone https://github.com/brayanYU27/reservationSystem.git
  cd "Barber Shop Reservation System"

  # Frontend (en la raíz)
  cp .env.example .env
  npm install

  # Backend
  cd backend
  cp .env.example .env
  npm install
  ```

  Edita los archivos `.env` (raíz y backend) con tus valores:

  - En la raíz: `VITE_API_URL=http://localhost:3000/api`
  - En backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL=http://localhost:5173`, etc. (ver [backend/.env.example](backend/.env.example)).

  ---

  ## Configurar base de datos (backend)

  Ejemplo con Docker:

  ```bash
  docker run --name barber-shop-db \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=barber_shop \
    -p 5432:5432 \
    -d postgres:16
  ```

  Luego, aplicar el esquema de Prisma:

  ```bash
  cd backend
  npm run db:generate
  npm run db:migrate

  # Opcional: datos de ejemplo
  npm run db:seed
  ```

  ---

  ## Ejecutar el proyecto

  ### Backend

  En otra terminal:

  ```bash
  cd backend
  npm run dev
  ```

  El backend quedará disponible en `http://localhost:3000`.

  ### Frontend

  En la raíz del proyecto:

  ```bash
  npm run dev
  ```

  El frontend quedará disponible en `http://localhost:5173`.

  ---

  ## Comandos útiles

  ### Frontend (raíz)

  - `npm run dev` – servidor de desarrollo.
  - `npm run build` – build de producción.

  ### Backend (carpeta backend)

  - `npm run dev` – desarrollo con recarga.
  - `npm run build` – compilar TypeScript.
  - `npm start` – ejecutar build en producción.
  - `npm run db:generate` – generar cliente Prisma.
  - `npm run db:migrate` – ejecutar migraciones.
  - `npm run db:seed` – poblar la BD con datos de ejemplo.
  - `npm run db:studio` – abrir Prisma Studio.

  ---

  ## Más información

  - Detalles de instalación paso a paso: [SETUP.md](SETUP.md)
  - Documentación del backend: [backend/README.md](backend/README.md)
  - Guía de componentes de UI: [docs/ui-components-guide.md](docs/ui-components-guide.md)
  