import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema
} from '../utils/validators.js';
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee
} from '../controllers/employee.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Routes
router.get('/', getEmployees);
router.post('/', validate(createEmployeeSchema), createEmployee);
router.put('/:id', validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
