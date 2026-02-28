import { Router } from 'express';
import {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  addReviewNotes,
  bulkUpdateStatus,
  exportApplications,
  getApplicationsByJob,
  verifySectionDocuments,
  exemptApplicationFee,
} from '../../controllers/admin/application.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../../constants.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateApplicationStatusSchema,
  addReviewNotesSchema,
  bulkUpdateStatusSchema,
  verifySectionSchema,
} from '../../validators/adminApplication.validator.js';

const router = Router();

// Base path: /api/v1/admin/applications

// Static routes MUST come before parameterized routes
router.get(
  '/export',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  exportApplications
);

router.post(
  '/bulk-status',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(bulkUpdateStatusSchema),
  bulkUpdateStatus
);

// List all applications
router.get(
  '/',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  getAllApplications
);

// Get applications for a specific job
router.get(
  '/job/:jobId',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  getApplicationsByJob
);

// Single application by ID
router.get(
  '/:id',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  getApplicationById
);

// Update application status
router.patch(
  '/:id/status',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);

// Add review notes
router.patch(
  '/:id/review',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(addReviewNotesSchema),
  addReviewNotes
);

// Verify section documents
router.patch(
  '/:id/verify-section',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(verifySectionSchema),
  verifySectionDocuments
);

// Exempt application fee
router.post(
  '/:id/exempt-fee',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  exemptApplicationFee
);

export default router;
