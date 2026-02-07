import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.route('/register').post(validate(registerSchema), registerUser);

router.route('/login').post(validate(loginSchema), loginUser);

router.route('/logout').post(verifyJWT, logoutUser);

router
  .route('/refresh-token')
  .post(validate(refreshTokenSchema), refreshAccessToken);

export default router;
