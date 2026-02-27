import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getProfile,
  updateProfile,
  sendEmailVerificationOTPHandler,
  verifyEmailOTPHandler,
  sendPasswordResetOTPHandler,
  resetPasswordHandler,
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

// Email verification
router.route('/verify-email/send').post(sendEmailVerificationOTPHandler);
router.route('/verify-email/confirm').post(verifyEmailOTPHandler);

// Password reset
router.route('/reset-password/send').post(sendPasswordResetOTPHandler);
router.route('/reset-password/confirm').post(resetPasswordHandler);

export default router;
