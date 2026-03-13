import { Router } from 'express';
import authRouter from './auth.routes.js';
import noticeRouter from './notice.routes.js';
import departmentRouter from './department.routes.js';
import applicationRouter from './application.routes.js';
import publicJobRouter from './public/job.routes.js';
import paymentRouter from './public/payment.routes.js';
import adminJobRouter from './admin/job.routes.js';
import adminUserRouter from './admin/user.routes.js';
import adminApplicationRouter from './admin/application.routes.js';
import adminReviewRouter from './admin/review.routes.js';
import adminDashboardRouter from './admin/dashboard.routes.js';

const router = Router();

/* ------------------- PUBLIC ------------------- */
router.use('/auth', authRouter);
router.use('/jobs', publicJobRouter);
router.use('/departments', departmentRouter);
router.use('/notices', noticeRouter);
router.use('/payments', paymentRouter);

/* ------------------- APPLICANT ------------------- */
router.use('/applications', applicationRouter);

/* ------------------- ADMIN ------------------- */
router.use('/admin/jobs', adminJobRouter);
router.use('/admin/users', adminUserRouter);
router.use('/admin/applications', adminApplicationRouter);
router.use('/admin/reviews', adminReviewRouter);
router.use('/admin/dashboard', adminDashboardRouter);

export default router;
