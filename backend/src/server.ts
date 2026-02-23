import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import businessRoutes from './routes/business.routes.js';
import serviceRoutes from './routes/service.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import reviewRoutes from './routes/review.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// ============================================
// MIDDLEWARE GENERAL
// ============================================
// Configurar helmet con excepciones para contenido estático
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// Configurar CORS para desarrollo y producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  config.frontendUrl,
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    if (config.nodeEnv === 'development') {
      // En desarrollo, permitir localhost con cualquier puerto
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const isProduction = config.nodeEnv === 'production';
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  // En desarrollo, subir el límite para evitar 429 por ráfagas (p. ej. React StrictMode)
  max: isProduction ? config.rateLimitMaxRequests : Math.max(config.rateLimitMaxRequests, 10_000),
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
});
app.use('/api/', limiter);

// ============================================
// RUTAS
// ============================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
🚀 Servidor corriendo en puerto ${PORT}
📍 Ambiente: ${config.nodeEnv}
🌐 URL: ${config.apiUrl}
  `);
});

export default app;
