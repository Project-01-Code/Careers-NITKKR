import { Router } from 'express';
import { getAllDepartments } from '../controllers/department.controller.js';

const router = Router();

router.get('/', getAllDepartments);

export default router;
