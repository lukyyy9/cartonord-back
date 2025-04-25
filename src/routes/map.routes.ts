import { Router } from 'express';
import { MapController } from '../controllers/map.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { batchUpload } from '../middlewares/upload.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', MapController.getAll);
router.get('/slug/:slug', MapController.getBySlug);
router.get('/by-slug/:slug', MapController.getBySlug);

// Protected routes
router.post('/', authenticateJWT, MapController.create);
router.get('/user', authenticateJWT, MapController.getByUser);
router.get('/:id', MapController.getById);
router.put('/:id', authenticateJWT, MapController.update);
router.delete('/:id', authenticateJWT, MapController.delete);
router.get('/slug/:slug/file/:fileType', MapController.getMapFile);

// New map editor routes
router.put('/:id/layers', authenticateJWT, MapController.saveGeojsonLayers);
router.get('/pictos', authenticateJWT, MapController.getPictograms);
router.post('/pictos/upload', authenticateJWT, upload.single('pictogram'), MapController.uploadPictogram);

// File upload routes
router.post('/upload-url', authenticateJWT, MapController.getUploadUrl);
router.put('/:id/file', authenticateJWT, MapController.updateFileUrl);
router.post('/:mapId/batch-upload', authenticateJWT, batchUpload, MapController.batchUpload);

// Add GeoJSON upload endpoint
router.post('/:mapId/upload-geojson', authenticateJWT, upload.single('file'), MapController.uploadGeojson);

// Admin routes
router.get('/admin/stats', authenticateJWT, MapController.getAdminStats);
router.get('/admin/maps', authenticateJWT, MapController.getAdminMaps);
router.post('/admin/maps', authenticateJWT, MapController.create);
router.get('/admin/maps/:id', authenticateJWT, MapController.getById);
router.put('/admin/maps/:id', authenticateJWT, MapController.update);
router.delete('/admin/maps/:id', authenticateJWT, MapController.delete);

export default router; 