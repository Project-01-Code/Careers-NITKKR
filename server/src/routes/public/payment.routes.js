import { Router } from 'express';
import express from 'express';
import {
  createCheckoutSession,
  handleStripeWebhook,
  getPaymentStatus,
} from '../../controllers/payment.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

// ── Authenticated routes ────────────────────────────────────────────────────

// Create a Stripe Checkout Session — returns { sessionId, url } for redirect
router.post('/create-checkout-session', verifyJWT, createCheckoutSession);

// Poll for payment/application status
router.get('/status/:applicationId', verifyJWT, getPaymentStatus);

// ── Stripe Webhook ──────────────────────────────────────────────────────────
// IMPORTANT: Stripe webhooks require the RAW request body (not parsed JSON)
// for signature verification. The express.raw() middleware is applied here
// specifically, BEFORE the global express.json() parser runs.
// This route does NOT require verifyJWT — Stripe authenticates via HMAC signature.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;
