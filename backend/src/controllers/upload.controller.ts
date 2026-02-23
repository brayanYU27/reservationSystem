import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Subir una imagen
 * @route   POST /api/upload
 * @access  Private (requiere autenticación)
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo',
      });
    }

    // Construir URL de la imagen
    const imageUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      message: 'Imagen subida correctamente',
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
    });
  }
};

/**
 * @desc    Eliminar una imagen del servidor
 * @route   DELETE /api/upload/:filename
 * @access  Private (requiere autenticación)
 */
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename as string);

    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({
        success: true,
        message: 'Imagen eliminada correctamente',
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
      });
    }
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la imagen',
    });
  }
};
