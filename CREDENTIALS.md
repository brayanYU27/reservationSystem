# Credenciales de Prueba - ServiConnect

Este documento contiene las credenciales de los usuarios de prueba creados con el seed de la base de datos.

## 🔑 Usuarios de Prueba

### Admin
- **Email:** admin@serviconnect.com
- **Contraseña:** password123
- **Rol:** ADMIN
- **Descripción:** Usuario administrador del sistema

### Clientes

#### Cliente 1
- **Email:** maria.garcia@example.com
- **Contraseña:** password123
- **Rol:** CLIENT
- **Nombre:** María García
- **Teléfono:** 5551234567

#### Cliente 2
- **Email:** juan.perez@example.com
- **Contraseña:** password123
- **Rol:** CLIENT
- **Nombre:** Juan Pérez
- **Teléfono:** 5557654321

#### Cliente 3
- **Email:** ana.martinez@example.com
- **Contraseña:** password123
- **Rol:** CLIENT
- **Nombre:** Ana Martínez
- **Teléfono:** 5559876543

### Dueños de Negocios

#### Dueño 1 - Elite Barbershop
- **Email:** carlos@barbershop.com
- **Contraseña:** password123
- **Rol:** BUSINESS_OWNER
- **Nombre:** Carlos Rodríguez
- **Negocio:** Elite Barbershop (Barbería en CDMX)

#### Dueño 2 - Bella Vista Salón
- **Email:** lucia@salon.com
- **Contraseña:** password123
- **Rol:** BUSINESS_OWNER
- **Nombre:** Lucía Fernández
- **Negocio:** Bella Vista Salón (Salón de belleza en Guadalajara)

#### Dueño 3 - Zen Spa & Wellness
- **Email:** miguel@spa.com
- **Contraseña:** password123
- **Rol:** BUSINESS_OWNER
- **Nombre:** Miguel Torres
- **Negocio:** Zen Spa & Wellness (Spa en Monterrey)

### Empleados

#### Empleado 1
- **Email:** pedro@example.com
- **Contraseña:** password123
- **Rol:** EMPLOYEE
- **Nombre:** Pedro Sánchez
- **Trabaja en:** Elite Barbershop
- **Posición:** Barbero Master

#### Empleado 2
- **Email:** sofia@example.com
- **Contraseña:** password123
- **Rol:** EMPLOYEE
- **Nombre:** Sofía López
- **Trabaja en:** Bella Vista Salón
- **Posición:** Estilista Senior

#### Empleado 3
- **Email:** david@example.com
- **Contraseña:** password123
- **Rol:** EMPLOYEE
- **Nombre:** David Ramírez
- **Trabaja en:** Zen Spa & Wellness
- **Posición:** Terapeuta Certificado

## 🏢 Negocios Creados

### Elite Barbershop
- **Categoría:** BARBERSHOP
- **Ciudad:** Ciudad de México, CDMX
- **Servicios:** 4 (Corte Clásico, Corte + Barba, Afeitado Clásico, Tinte de Barba)
- **Rating:** 4.8 ⭐
- **Slug:** elite-barbershop

### Bella Vista Salón
- **Categoría:** SALON
- **Ciudad:** Guadalajara, Jalisco
- **Servicios:** 4 (Corte de Dama, Tinte Completo, Keratina, Peinado de Novia)
- **Rating:** 4.9 ⭐
- **Slug:** bella-vista-salon

### Zen Spa & Wellness
- **Categoría:** SPA
- **Ciudad:** Monterrey, Nuevo León
- **Servicios:** 4 (Masaje Relajante, Facial Hidratante, Masaje de Piedras, Paquete Spa Día)
- **Rating:** 5.0 ⭐
- **Slug:** zen-spa-wellness

## 📊 Datos Generados

- ✅ 10 usuarios (1 admin, 3 clientes, 3 dueños, 3 empleados)
- ✅ 3 negocios verificados
- ✅ 3 suscripciones activas (1 Basic, 2 Premium)
- ✅ 12 servicios distribuidos entre los negocios
- ✅ 3 empleados vinculados a servicios
- ✅ 5 citas programadas (algunas confirmadas, otras pendientes)
- ✅ 4 reseñas verificadas

## 🔄 Regenerar Datos

Si necesitas regenerar los datos de prueba:

```bash
cd backend
npm run db:seed
```

Esto eliminará todos los datos existentes y creará nuevos datos de prueba.

## ⚠️ Nota de Seguridad

**IMPORTANTE:** Estas credenciales son solo para desarrollo. Nunca uses "password123" en producción.
