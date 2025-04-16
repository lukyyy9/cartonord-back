import { Router } from 'express';
import authRoutes from './auth.routes';
import mapRoutes from './map.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/maps', mapRoutes);

export default router; 