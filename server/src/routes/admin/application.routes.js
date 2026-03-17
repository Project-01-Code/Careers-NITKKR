import { Router } from 'express';
import {
  getAllApplications,
  getApplicationById,
  getApplicationByNumber,
  updateApplicationStatus,
  addReviewNotes,
  bulkUpdateStatus,
  bulkAssignReviewers,
  exportApplications,
  getApplicationsByJob,
  verifySectionDocuments,
  exemptApplicationFee,
  exportApplicationReport,
} from '../../controllers/admin/application.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../../constants.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  listApplicationsSchema,
  exportApplicationsSchema,
  updateApplicationStatusSchema,
  addReviewNotesSchema,
  bulkUpdateStatusSchema,
  bulkAssignSchema,
  verifySectionSchema,
  exemptFeeSchema,
  applicationIdParamSchema,
  applicationsByJobSchema,
} from '../../validators/adminApplication.validator.js';

const router = Router();

// Base path: /api/v1/admin/applications

// ── Static routes MUST come before parameterized routes ───────────────────

// CSV export
router.get(
  '/export',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(exportApplicationsSchema),
  exportApplications
);

// Bulk assign reviewers
router.patch(
  '/bulk-assign',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(bulkAssignSchema),
  bulkAssignReviewers
);

// Bulk status update
router.post(
  '/bulk-status',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(bulkUpdateStatusSchema),
  bulkUpdateStatus
);

// Lookup application by application number (for fee exemption)
router.get(
  '/by-number/:applicationNumber',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getApplicationByNumber
);

// ── Collection-level routes ───────────────────────────────────────────────

// List all applications (admins + reviewers, query params validated)
router.get(
  '/',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(listApplicationsSchema),
  getAllApplications
);

// Get applications for a specific job
router.get(
  '/job/:jobId',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(applicationsByJobSchema),
  getApplicationsByJob
);

// ── Single-application routes ─────────────────────────────────────────────

// Get full application by ID
router.get(
  '/:id',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(applicationIdParamSchema),
  getApplicationById
);

// Update application status (admin only)
router.patch(
  '/:id/status',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);

// Add review notes (admins + reviewers)
router.patch(
  '/:id/review',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(addReviewNotesSchema),
  addReviewNotes
);

// Verify section documents (admins + reviewers)
router.patch(
  '/:id/verify-section',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(verifySectionSchema),
  verifySectionDocuments
);

// Exempt application fee
// Fix: SUPER_ADMIN added — JSDoc says "Admin, Super Admin" but previously only ADMIN was wired
router.post(
  '/:id/exempt-fee',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(exemptFeeSchema),
  exemptApplicationFee
);

// Export full application report PDF (admins + reviewers)
router.get(
  '/:id/docket',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  validate(applicationIdParamSchema),
  exportApplicationReport
);

export default router;
