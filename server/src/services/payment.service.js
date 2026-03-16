import { PAYMENT_STATUS } from '../constants.js';

/**
 * Fixed transaction/processing fee added on top of the base application fee.
 * Centralised here so it's easy to update and appears in one place only.
 */
export const TRANSACTION_FEE = 50; // INR

/**
 * Derive the correct application fee for a candidate based on their category
 * and disability status, using the fee configuration stored on the Job document.
 *
 * Category precedence (highest → lowest):
 *   1. PWD (disability overrides category)
 *   2. SC / ST
 *   3. OBC / OBC-NCL
 *   4. EWS
 *   5. General (default)
 *
 * @param {Object} appFeeConfig  - job.applicationFee object from the DB
 * @param {string} rawCategory   - candidate's raw category string (e.g. 'obc', 'SC')
 * @param {boolean} isPwd        - whether the candidate has a disability
 * @returns {{ baseFee: number, transactionFee: number, totalAmount: number, isFeeRequired: boolean }}
 */
export function calculateApplicationFee(appFeeConfig = {}, rawCategory = '', isPwd = false) {
  const isFeeRequired = Boolean(appFeeConfig.isRequired);

  // If the job does not require a fee at all, short-circuit immediately
  if (!isFeeRequired) {
    return { baseFee: 0, transactionFee: 0, totalAmount: 0, isFeeRequired: false };
  }

  const category = rawCategory?.toUpperCase().trim() || 'GEN';

  let baseFee;

  if (isPwd) {
    baseFee = appFeeConfig.pwd ?? 0;
  } else if (['SC', 'ST'].includes(category)) {
    baseFee = appFeeConfig.sc_st ?? 0;
  } else if (['OBC', 'OBC-NCL'].includes(category)) {
    baseFee = appFeeConfig.obc ?? 0;
  } else if (category === 'EWS') {
    baseFee = appFeeConfig.ews ?? 0;
  } else {
    // GEN or any unrecognised category → general fee
    baseFee = appFeeConfig.general ?? 0;
  }

  // If the resolved base fee is 0 the candidate is still exempt even though
  // isRequired is true (e.g. SC/ST fee set to 0 by the organisation)
  if (baseFee === 0) {
    return { baseFee: 0, transactionFee: 0, totalAmount: 0, isFeeRequired: true };
  }

  const transactionFee = TRANSACTION_FEE;
  const totalAmount = baseFee + transactionFee;

  return { baseFee, transactionFee, totalAmount, isFeeRequired: true };
}

/**
 * Mark an application as fully submitted (payment complete or exempted).
 * Centralised so both the webhook handler and the exemption path use
 * identical logic.
 *
 * @param {import('../models/application.model.js').Application} application
 * @param {string} paymentStatus - PAYMENT_STATUS.PAID | PAYMENT_STATUS.EXEMPTED
 * @param {string} userId        - User ID of person triggering submission (optional)
 */
export function markApplicationSubmitted(application, paymentStatus, userId = null) {
  const targetStatus = 'submitted';
  
  // Already submitted? Don't duplicate history
  if (application.status === targetStatus && application.paymentStatus === paymentStatus) {
    return;
  }

  application.paymentStatus = paymentStatus;
  application.status = targetStatus;
  application.submittedAt = application.submittedAt ?? new Date();

  // Add to status history for audit trail
  application.statusHistory.push({
    status: targetStatus,
    changedBy: userId || application.userId,
    changedAt: new Date(),
    remarks: `Application submitted (${paymentStatus === PAYMENT_STATUS.EXEMPTED ? 'Fee Exempted' : 'Payment Verified'})`,
  });
}