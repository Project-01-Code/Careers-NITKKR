import Razorpay from 'razorpay';
import crypto from 'crypto';
import util from 'util';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

class RazorpayService {
  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
    }

    this.instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Public key sent to frontend so it can open the modal. NEVER expose key_secret.
    this.keyId = process.env.RAZORPAY_KEY_ID;

    // §15: Prevent accidental leakage of the Razorpay instance (and its key_secret) in console logs
    this.instance[util.inspect.custom] = () => '[Razorpay SDK Instance - SECRETS REDACTED]';
  }

  // §15: Protect the service container itself from leaking secrets if logged
  [util.inspect.custom]() {
    return `RazorpayService { keyId: '${this.keyId}', instance: [REDACTED] }`;
  }

  /**
   * Create a Razorpay order.
   * Amount is in INR rupees; Razorpay requires it in paise (rupees × 100).
   *
   * @param {number} amountInRupees
   * @param {string} applicationId - Used as receipt identifier for traceability
   * @returns {Promise<{ id: string, amount: number, currency: string }>}
   */
  async createOrder(amountInRupees, applicationId) {
    try {
      const order = await this.instance.orders.create({
        amount: Math.round(amountInRupees * 100), // paise
        currency: 'INR',
        receipt: `app_${applicationId.toString().slice(-12)}`, // max 40 chars
        notes: {
          applicationId: applicationId.toString(),
        },
      });

      return order; // { id, amount, currency, receipt, status, ... }
    } catch (error) {
      console.error('[RazorpayService] createOrder error:', error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to create payment order. Please try again.'
      );
    }
  }

  /**
   * Verify the HMAC-SHA256 signature sent by Razorpay after a successful payment.
   *
   * Signature = HMAC_SHA256(orderId + "|" + paymentId, key_secret)
   * This is the ONLY reliable way to confirm payment authenticity on the backend.
   *
   * @param {string} orderId       - Razorpay order ID (razorpay_order_id from frontend)
   * @param {string} paymentId     - Razorpay payment ID (razorpay_payment_id from frontend)
   * @param {string} signature     - Razorpay signature (razorpay_signature from frontend)
   * @returns {boolean}            - true if valid, false otherwise
   */
  verifySignature(orderId, paymentId, signature) {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }
}

// Singleton — instantiated once at startup so env validation runs early
export const razorpayService = new RazorpayService();
