import Stripe from 'stripe';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Create a Stripe Checkout Session.
   *
   * @param {number}   amount        - Total amount in INR (whole rupees)
   * @param {string}   applicationId - MongoDB application _id (used for metadata)
   * @param {string}   successUrl    - Redirect URL on successful payment
   * @param {string}   cancelUrl     - Redirect URL on cancellation
   * @returns {Promise<Stripe.Checkout.Session>}
   */
  async createCheckoutSession(amount, applicationId, successUrl, cancelUrl) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: 'Application Fee',
                description: `Payment for Application ${applicationId}`,
              },
              // Stripe requires amount in smallest currency unit (paise for INR)
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        // Lets us look up the application directly from the session object
        client_reference_id: applicationId.toString(),
        metadata: {
          applicationId: applicationId.toString(),
        },
        payment_intent_data: {
          metadata: {
            applicationId: applicationId.toString(),
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Stripe createCheckoutSession error:', error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to create payment session'
      );
    }
  }

  /**
   * Retrieve a Checkout Session by ID.
   * Used by the payment-success route to confirm status without relying solely
   * on webhooks (handles cases where webhook delivery is delayed).
   *
   * @param {string} sessionId - Stripe Checkout Session ID (cs_...)
   * @returns {Promise<Stripe.Checkout.Session>}
   */
  async retrieveCheckoutSession(sessionId) {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      console.error('Stripe retrieveCheckoutSession error:', error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve payment session'
      );
    }
  }

  /**
   * Verify and construct a Stripe webhook event from the raw request body.
   *
   * @param {Buffer} rawBody    - Raw request body (must NOT be JSON-parsed)
   * @param {string} signature  - Value of the Stripe-Signature header
   * @returns {Stripe.Event}
   */
  verifyWebhookSignature(rawBody, signature) {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error.message);
      // Re-throw as a plain Error so the controller can send a 400
      throw new Error(`Webhook signature error: ${error.message}`);
    }
  }
}

export const stripeService = new StripeService();