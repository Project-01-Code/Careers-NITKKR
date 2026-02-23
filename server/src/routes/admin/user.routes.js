import { Router } from 'express';
import {
  createUser,
  promoteUser,
} from '../../controllers/admin/user.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../../constants.js';

const router = Router();

// Base Path: /api/v1/admin/users

// Create new Admin or Reviewer
// Super Admin can create Admin
// Admin can create Reviewer (enforced in controller)
router.post(
  '/',
  verifyJWT,
  requireRole(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  createUser
);

// Promote existing user to Admin
// Only Super Admin
router.patch(
  '/:userId/promote',
  verifyJWT,
  requireRole(USER_ROLES.SUPER_ADMIN),
  promoteUser
);

export default router;
