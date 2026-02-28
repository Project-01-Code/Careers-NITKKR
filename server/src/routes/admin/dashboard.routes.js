import { Router } from 'express';
import {
  getDashboardStats,
  getJobStats,
} from '../../controllers/admin/dashboard.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../../constants.js';

const router = Router();

// Base path: /api/v1/admin/dashboard

router.get(
  '/stats',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  getDashboardStats
);

router.get(
  '/stats/job/:jobId',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.REVIEWER),
  getJobStats
);

export default router;
