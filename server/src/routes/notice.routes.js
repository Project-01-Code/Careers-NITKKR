import { Router } from 'express';
import {
  createNotice,
  getPublicNotices,
  archiveNotice,
} from '../controllers/notice.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { adminAuth } from '../middlewares/adminAuth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Public route - Get all active notices with pagination
router.get('/', getPublicNotices);

// Admin routes - Require authentication and admin privileges
router.post('/', verifyJWT, adminAuth, upload.single('file'), createNotice);
router.patch('/:id/archive', verifyJWT, adminAuth, archiveNotice);

export default router;
