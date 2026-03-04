import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS, PAYMENT_STATUS } from '../constants.js';
import { Application } from '../models/application.model.js';
import { Payment } from '../models/payment.model.js';
import { stripeService } from '../services/stripe.service.js';

/**
 * Create a specialized Stripe checkout session and record a pending payment.
 *
 * @route   POST /api/v1/payments/create-order
 * @access  Private (Applicant only)
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  const userId = req.user._id;

  if (!applicationId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Application ID is required');
  }

  const application = await Application.findOne({
    _id: applicationId,
    userId: userId,
  });

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  if (
    application.paymentStatus === PAYMENT_STATUS.PAID ||
    application.paymentStatus === PAYMENT_STATUS.EXEMPTED
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Fee already paid or exempted for this application'
    );
  }

  // TODO: Get exact amount dynamically based on config/category
  const amountToCharge = 1000; // 1000 INR

  const origin = req.get('origin') || 'http://localhost:3000';
  const successUrl = `${origin}/applications/${applicationId}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/applications/${applicationId}/payment-cancel`;

  // Create Stripe Checkout Session
  const session = await stripeService.createCheckoutSession(
    amountToCharge,
    application._id,
    successUrl,
    cancelUrl
  );

  // Store payment record in DB with PENDING status
  await Payment.create({
    sessionId: session.id,
    amount: amountToCharge,
    currency: session.currency?.toLowerCase() || 'inr',
    status: PAYMENT_STATUS.PENDING,
    applicationId: application._id,
    userId: userId,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      {
        sessionId: session.id,
        url: session.url, // URL to redirect the user to Stripe Checkout
        amount: amountToCharge,
        currency: session.currency || 'inr',
      },
      'Payment session created successfully'
    )
  );
});

export const verifyWebhook = asyncHandler(async (req, res) => {
  // req.body is a raw Buffer set by express.raw() in app.js
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).send('Webhook signature missing');
  }

  let event;
  try {
    event = stripeService.verifyWebhookSignature(req.body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      const sessionId = session.id;
      const paymentIntentId = session.payment_intent;

      const paymentRecord = await Payment.findOne({ sessionId: sessionId });

      if (!paymentRecord) {
        console.error(`Payment record not found for session ${sessionId}`);
        return res.status(400).send('Payment record not found');
      }

      if (paymentRecord.status === PAYMENT_STATUS.PAID) {
        return res.status(200).send('Already processed');
      }

      paymentRecord.rawWebhookData = event;

      paymentRecord.status = PAYMENT_STATUS.PAID;
      paymentRecord.paymentIntentId = paymentIntentId;
      paymentRecord.paymentMethod = session.payment_method_types?.[0] || 'card';
      await paymentRecord.save();

      // Update application
      const application = await Application.findById(
        paymentRecord.applicationId
      );
      if (application) {
        application.paymentStatus = PAYMENT_STATUS.PAID;
        await application.save();
      }
      break;
    }

    case 'checkout.session.expired':
    case 'payment_intent.payment_failed': {
      const failedSession = event.data.object;
      const failedSessionId =
        failedSession.id || failedSession.metadata?.sessionId;

      if (failedSessionId) {
        const failedPayment = await Payment.findOne({
          sessionId: failedSessionId,
        });
        if (failedPayment && failedPayment.status !== PAYMENT_STATUS.PAID) {
          failedPayment.status = PAYMENT_STATUS.FAILED;
          failedPayment.rawWebhookData = event;
          await failedPayment.save();
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send('OK');
});
