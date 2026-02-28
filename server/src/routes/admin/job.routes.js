import { Router } from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  publishJob,
  closeJob,
} from '../../controllers/admin/job.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../../constants.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createJobSchema,
  updateJobSchema,
  jobFilterSchema,
} from '../../validators/job.validator.js';

const router = Router();

router.post(
  '/',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(createJobSchema),
  createJob
);

router.get(
  '/',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(jobFilterSchema),
  getAllJobs
);

router.get('/:id', verifyJWT, requireRole(USER_ROLES.ADMIN), getJobById);

router.patch(
  '/:id',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  validate(updateJobSchema),
  updateJob
);

router.delete('/:id', verifyJWT, requireRole(USER_ROLES.ADMIN), deleteJob);

router.post(
  '/:id/publish',
  verifyJWT,
  requireRole(USER_ROLES.ADMIN),
  publishJob
);

router.post('/:id/close', verifyJWT, requireRole(USER_ROLES.ADMIN), closeJob);

export default router;
