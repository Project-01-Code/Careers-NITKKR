import { Router } from 'express';
import {
  getActiveJobs,
  getJobById,
  getJobByAdvertisementNo,
} from '../../controllers/public/job.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { jobFilterSchema } from '../../validators/job.validator.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', validate(jobFilterSchema), getActiveJobs);
router.get('/by-advertisement', getJobByAdvertisementNo);
router.get('/:id', getJobById);

export default router;
