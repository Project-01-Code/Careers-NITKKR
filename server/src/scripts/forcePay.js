/**
 * DEV ONLY: Force-mark a payment as paid for a given application.
 *
 * Usage:
 *   node src/scripts/forcePay.js <applicationNumber>
 *   node src/scripts/forcePay.js APP-2026-12345678
 *
 * This script skips Stripe entirely. Use it to test the
 * validate → submit → receipt flow without going through the payment UI.
 *
 * ⚠️  NEVER run this in production.
 */

import 'dotenv/config';
import { connectDB } from '../db/connectDB.js';
import { Application } from '../models/application.model.js';
import { Payment } from '../models/payment.model.js';
import { PAYMENT_STATUS } from '../constants.js';

const forcePay = async () => {
  const applicationNumber = process.argv[2];

  if (!applicationNumber) {
    console.error('❌  Usage: node src/scripts/forcePay.js APP-2026-XXXXX');
    process.exit(1);
  }

  try {
    await connectDB();

    // 1. Find the application
    const application = await Application.findOne({ applicationNumber });
    if (!application) {
      console.error(`❌  Application "${applicationNumber}" not found.`);
      process.exit(1);
    }

    // 2. Update the application's payment status
    application.paymentStatus = PAYMENT_STATUS.PAID;
    await application.save();

    // 3. Update the associated Payment record (if it exists)
    const paymentResult = await Payment.updateOne(
      { applicationId: application._id },
      { $set: { status: PAYMENT_STATUS.PAID } }
    );

    // 4. Report results
    console.log('\n✅  Payment force-marked as PAID');
    console.log(`   Application  : ${applicationNumber}`);
    console.log(`   Application ID: ${application._id}`);
    if (paymentResult.matchedCount > 0) {
      console.log('   Payment record: Updated ✅');
    } else {
      console.log('   Payment record: Not found (no Payment doc created yet)');
    }
    console.log('\n   You can now run validate-all → submit in Postman.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Error:', err.message);
    process.exit(1);
  }
};

forcePay();
