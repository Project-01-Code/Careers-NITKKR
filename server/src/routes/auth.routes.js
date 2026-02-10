import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.route('/register').post(validate(registerSchema), registerUser);

router.route('/login').post(validate(loginSchema), loginUser);

router.route('/logout').delete(verifyJWT, logoutUser);

router
  .route('/refresh-token')
  .post(validate(refreshTokenSchema), refreshAccessToken);

router
  .route('/profile')
  .get(verifyJWT, getProfile)
  .patch(verifyJWT, validate(updateProfileSchema), updateProfile);

export default router;
