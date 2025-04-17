import { Router } from 'express';
import { MapController } from '../controllers/map.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', MapController.getAll);
router.get('/slug/:slug', MapController.getBySlug);

// Protected routes
router.post('/', authenticateJWT, MapController.create);
router.get('/user', authenticateJWT, MapController.getByUser);
router.get('/:id', MapController.getById);
router.put('/:id', authenticateJWT, MapController.update);
router.delete('/:id', authenticateJWT, MapController.delete);
router.get('/slug/:slug/file/:fileType', MapController.getMapFile);

// File upload routes
router.post('/upload-url', authenticateJWT, MapController.getUploadUrl);
router.put('/:id/file', authenticateJWT, MapController.updateFileUrl);

// Admin routes
router.get('/admin/stats', authenticateJWT, MapController.getAdminStats);

export default router; 