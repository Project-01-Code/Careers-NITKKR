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
  requireRole('admin', 'super_admin'),
  validate(createJobSchema),
  createJob
);

router.get(
  '/',
  verifyJWT,
  requireRole('admin', 'super_admin'),
  validate(jobFilterSchema),
  getAllJobs
);

router.get('/:id', verifyJWT, requireRole('admin'), getJobById);

router.patch(
  '/:id',
  verifyJWT,
  requireRole('admin', 'super_admin'),
  validate(updateJobSchema),
  updateJob
);

router.delete('/:id', verifyJWT, requireRole('admin'), deleteJob);

router.post('/:id/publish', verifyJWT, requireRole('admin'), publishJob);

router.post('/:id/close', verifyJWT, requireRole('admin'), closeJob);

export default router;
