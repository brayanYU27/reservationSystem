import express from 'express';
import { uploadImage, deleteImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Subir imagen
router.post('/', authenticate, upload.single('image'), uploadImage);

// Eliminar imagen
router.delete('/:filename', authenticate, deleteImage);

export default router;
