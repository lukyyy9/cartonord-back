import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', authenticateJWT, AuthController.getProfile);
router.put('/profile', authenticateJWT, AuthController.updateProfile);

export default router;