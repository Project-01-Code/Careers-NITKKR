import Stripe from 'stripe';
import util from 'util';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
      throw new Error('STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must be set');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Public key sent to frontend for Stripe.js initialization. NEVER expose secret key.
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    // Webhook signing secret for verifying incoming Stripe webhook events
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // §15: Prevent accidental leakage of the Stripe instance (and its secret key) in console logs
    this.stripe[util.inspect.custom] = () => '[Stripe SDK Instance - SECRETS REDACTED]';
  }

  // §15: Protect the service container itself from leaking secrets if logged
  [util.inspect.custom]() {
    return `StripeService { publishableKey: '${this.publishableKey}', instance: [REDACTED] }`;
  }

  /**
   * Create a Stripe Checkout Session.
   * Amount is in INR rupees; Stripe requires it in paise (rupees × 100).
   *
   * @param {number} amountInRupees
   * @param {string} applicationId - Used as metadata for traceability
   * @param {string} userId - User creating the session
   * @param {string} successUrl - URL to redirect to on success
   * @param {string} cancelUrl - URL to redirect to on cancellation
   * @returns {Promise<{ id: string, url: string }>}
   */
  async createCheckoutSession(amountInRupees, applicationId, userId, successUrl, cancelUrl) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: 'Application Fee — NIT Kurukshetra',
                description: `Application ID: ${applicationId}`,
              },
              unit_amount: Math.round(amountInRupees * 100), // paise
            },
            quantity: 1,
          },
        ],
        metadata: {
          applicationId: applicationId.toString(),
          userId: userId.toString(),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return session; // { id, url, ... }
    } catch (error) {
      console.error('[StripeService] createCheckoutSession error:', error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to create payment session. Please try again.'
      );
    }
  }

  /**
   * Verify the signature on an incoming Stripe webhook event.
   * This is the ONLY reliable way to confirm event authenticity from Stripe.
   *
   * @param {Buffer|string} rawBody - The raw request body (NOT parsed JSON)
   * @param {string} signature - The Stripe-Signature header value
   * @returns {import('stripe').Stripe.Event} - The verified event object
   * @throws {Error} If signature verification fails
   */
  constructWebhookEvent(rawBody, signature) {
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret
    );
  }

  /**
   * Retrieve a Checkout Session by ID (for status polling).
   *
   * @param {string} sessionId
   * @returns {Promise<import('stripe').Stripe.Checkout.Session>}
   */
  async retrieveSession(sessionId) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
}

// Singleton — instantiated once at startup so env validation runs early
export const stripeService = new StripeService();
