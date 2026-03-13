import { Router } from 'express';
import {
  getReviewerQueue,
  submitScorecard,
  getReviewDetails,
  getReviewers,
} from '../../controllers/admin/review.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../../constants.js';

const router = Router();

// Base path: /api/v1/admin/reviews

// Static routes MUST come before parameterized routes

// Get list of reviewers for assignment (Admin only)
router.get(
  '/reviewers',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getReviewers
);

// Get expert reviews (Admin: all, Reviewer: own only)
router.get(
  '/application/:id',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.REVIEWER),
  getReviewDetails
);

// Reviewer queue - applications assigned to current reviewer
router.get(
  '/queue',
  verifyJWT,
  requireRole(USER_ROLES.REVIEWER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getReviewerQueue
);

// Submit or update scorecard (Reviewer only - must be assigned)
router.post(
  '/:applicationId',
  verifyJWT,
  requireRole(USER_ROLES.REVIEWER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  submitScorecard
);

export default router;
