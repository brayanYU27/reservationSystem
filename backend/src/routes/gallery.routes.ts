import { Router } from 'express';
import { likeImage, unlikeImage } from '../controllers/gallery.controller';

const router = Router();

router.post('/:id/like', likeImage);
router.post('/:id/unlike', unlikeImage);

export default router;
