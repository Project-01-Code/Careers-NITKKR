import { Router } from 'express';
import {
    getActiveJobs,
    getJobByCode,
    getJobCategories,
    getJobsByNotice,
} from '../../controllers/public/job.controller.js';

const router = Router();

router.get('/', getActiveJobs);
router.get('/categories', getJobCategories);
router.get('/notice/:noticeId', getJobsByNotice);
router.get('/:jobCode', getJobByCode);

export default router;
