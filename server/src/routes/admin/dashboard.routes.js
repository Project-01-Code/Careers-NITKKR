import { Router } from 'express';
import {
    getDashboardStats,
    getJobStats,
} from '../../controllers/admin/dashboard.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Base path: /api/v1/admin/dashboard

router.get(
    '/stats',
    verifyJWT,
    requireRole('admin', 'reviewer'),
    getDashboardStats
);

router.get(
    '/stats/job/:jobId',
    verifyJWT,
    requireRole('admin', 'reviewer'),
    getJobStats
);

export default router;
