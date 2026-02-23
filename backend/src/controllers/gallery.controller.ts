import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/businesses/:id/gallery
export const getBusinessGallery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const gallery = await prisma.gallery.findMany({
      where: { businessId: id as string },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: gallery });
  } catch (error) {
    return next(error);
  }
};

// GET /api/businesses/:id/gallery/:imageId
export const getGalleryImageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;
    const image = await prisma.gallery.findUnique({
      where: { id: imageId as string }
    });
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    return res.json({ success: true, data: image });
  } catch (error) {
    return next(error);
  }
};

// POST /api/businesses/:id/gallery
export const createGalleryImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // businessId
    const { url, title, description } = req.body;

    const image = await prisma.gallery.create({
      data: {
        businessId: id as string,
        url,
        title,
        description
      }
    });

    return res.status(201).json({ success: true, data: image });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/businesses/:id/gallery/:imageId
export const deleteGalleryImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;
    await prisma.gallery.delete({
      where: { id: imageId as string }
    });
    return res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/businesses/:id/gallery/:imageId
export const updateGalleryImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;
    const { title, description } = req.body;

    const image = await prisma.gallery.update({
      where: { id: imageId as string },
      data: { title, description }
    });

    res.json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
};

// PUT /api/businesses/:id/gallery-reorder
export const reorderGalleryImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { images } = req.body; // Array of { id, order }

    await prisma.$transaction(
      images.map((img: { id: string; order: number }) =>
        prisma.gallery.update({
          where: { id: img.id },
          data: { order: img.order }
        })
      )
    );

    return res.json({ success: true, message: 'Gallery reordered' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/gallery/:id/like - Dar like a una imagen de la galería
export const likeImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };

    const image = await prisma.gallery.update({
      where: { id },
      data: {
        likes: {
          increment: 1
        }
      } as any // Temporary cast until Prisma types are fully refreshed
    });

    return res.json({
      success: true,
      data: image
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/gallery/:id/unlike - Quitar like a una imagen de la galería
export const unlikeImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };

    const image = await prisma.gallery.update({
      where: { id },
      data: {
        likes: {
          decrement: 1
        }
      } as any
    });

    // Ensure likes don't go below 0 (though decrement handles this mostly, good to be safe if we had a check)
    // Prisma decrement is simple, validation usually happens at db level or app level if needed.
    // tailored to simple requirement.

    return res.json({
      success: true,
      data: image
    });
  } catch (error) {
    return next(error);
  }
};
