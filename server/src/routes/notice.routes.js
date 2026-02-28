import { Router } from 'express';
import {
  createNotice,
  getPublicNotices,
  archiveNotice,
  updateNotice,
} from '../controllers/notice.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../constants.js';
import { upload } from '../middlewares/pdfUpload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createNoticeSchema,
  getNoticesQuerySchema,
  noticeIdParamSchema,
  updateNoticeSchema,
} from '../validators/notice.validator.js';

const router = Router();

// Public route - Get all active notices with pagination
router.get('/', validate(getNoticesQuerySchema), getPublicNotices);

// Admin routes - Require authentication and admin privileges
router.post(
  '/',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  upload.single('file'),
  validate(createNoticeSchema),
  createNotice
);

router.patch(
  '/:id',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  upload.single('file'),
  validate(updateNoticeSchema),
  validate(noticeIdParamSchema),
  updateNotice
);

router.patch(
  '/:id/archive',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(noticeIdParamSchema),
  archiveNotice
);

export default router;
