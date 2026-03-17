import { Router } from 'express';
import {
  createNotice,
  getPublicNotices,
  archiveNotice,
  unarchiveNotice,
  updateNotice,
  getAdminNotices,
} from '../controllers/notice.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../constants.js';
import { uploadPDFToMemory } from '../middlewares/pdfUpload.middleware.js';
import { malwareScan } from '../middlewares/malwareScan.middleware.js';
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

// Admin route - Get all notices (active + archived) with optional filters
// MUST be defined before /:id routes to avoid 'admin' being treated as an ID
router.get(
  '/admin',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  getAdminNotices
);

// Admin routes - Require authentication and admin privileges
router.post(
  '/',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  uploadPDFToMemory.single('file'),
  malwareScan,
  validate(createNoticeSchema),
  createNotice
);

router.patch(
  '/:id',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  uploadPDFToMemory.single('file'),
  malwareScan,
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

router.patch(
  '/:id/unarchive',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(noticeIdParamSchema),
  unarchiveNotice
);

export default router;
