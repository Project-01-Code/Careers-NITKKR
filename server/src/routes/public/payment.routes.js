import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
} from '../../controllers/payment.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

// All payment routes require authentication
router.post('/create-order', verifyJWT, createPaymentOrder);

// Called by frontend after Razorpay modal succeeds — verifies HMAC signature
router.post('/verify-payment', verifyJWT, verifyPayment);

// Poll for payment/application status
router.get('/status/:applicationId', verifyJWT, getPaymentStatus);

// ⚠️ ASSUMPTION: No webhook route is required for the current modal-based flow.
// If Razorpay webhook support is needed in the future (e.g., for server-to-server
// confirmation), add a route here WITHOUT verifyJWT and validate using razorpayService.verifySignature.

export default router;
