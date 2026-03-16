import { Router } from 'express';
import {
  getActiveJobs,
  getJobById,
  getJobByAdvertisementNo,
  getJobMeta,
} from '../../controllers/public/job.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  jobFilterSchema,
  jobIdParamSchema,
  jobByAdvertisementSchema,
} from '../../validators/job.validator.js';
import { optionalAuth } from '../../middlewares/optionalAuth.middleware.js';

const router = Router();

// Public routes (no authentication required)
// optionalAuth populates req.user silently so getActiveJobs can enrich with alreadyApplied
router.get('/', optionalAuth, validate(jobFilterSchema), getActiveJobs);
router.get(
  '/by-advertisement',
  validate(jobByAdvertisementSchema),
  getJobByAdvertisementNo
);
router.get('/meta', getJobMeta);
router.get('/:id', validate(jobIdParamSchema), getJobById);

export default router;
