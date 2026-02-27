import Stripe from 'stripe';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

class StripeService {
    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16', // Always good practice to set API version
        });
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }

    /**
     * Create a new Checkout Session
     * @param {number} amount in INR
     * @param {string} applicationId - Unique application ID to link
     * @param {string} successUrl - URL to redirect upon success
     * @param {string} cancelUrl - URL to redirect upon cancellation
     * @returns {Promise<Object>} Stripe session object
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
                            unit_amount: Math.round(amount * 100), // amount in paise
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                client_reference_id: applicationId.toString(),
                metadata: {
                    applicationId: applicationId.toString(),
                },
            });

            return session;
        } catch (error) {
            console.error('Stripe create session error:', error);
            throw new ApiError(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Failed to create payment session'
            );
        }
    }

    /**
     * Verify Stripe webhook signature
     * @param {Buffer} rawBody - Raw request body buffer
     * @param {string} signature - Stripe-Signature header
     * @returns {Object} Constructed Stripe event
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
            throw new Error(`Webhook Error: ${error.message}`);
        }
    }
}

export const stripeService = new StripeService();
