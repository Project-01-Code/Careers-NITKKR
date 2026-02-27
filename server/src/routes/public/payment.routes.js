import { Router } from 'express';
import {
    createPaymentOrder,
    verifyWebhook,
} from '../../controllers/payment.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

// Create order requires authentication
router.route('/create-order').post(verifyJWT, createPaymentOrder);

// Webhook requires NO authentication (Stripe signature validation is done in controller)
router.route('/webhook').post(verifyWebhook);

export default router;
