/**
 * DEV ONLY — Payment Gateway Test Seeder
 *
 * Creates one test Job (with full fee config) and one Application per
 * category so you can jump straight to the payment step without filling
 * the entire form.
 *
 * Usage:
 *   node src/scripts/seedPaymentTest.js
 *   node src/scripts/seedPaymentTest.js --clean   # wipe previous seed data first
 *
 * Output:
 *   A ready-to-use table with applicationId + Bearer token for each category.
 *   Paste any row straight into Postman or your browser's dev-tools fetch call.
 *
 * ⚠️  NEVER run this in production.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectDB } from '../db/connectDB.js';
import { Application } from '../models/application.model.js';
import { Payment } from '../models/payment.model.js';
import { calculateApplicationFee } from '../services/payment.service.js';

// ─── Import your real models so validation uses the actual schemas ────────────
// Using inline minimal schemas caused the missing-field errors.
// Replace these paths if your models live elsewhere.
const userSchema = new mongoose.Schema({
  email:    { type: String, unique: true },
  role:     String,
  name:     String,
  password: { type: String, default: 'seed-no-password' },
});
const TestUser = mongoose.models.User ?? mongoose.model('User', userSchema);

const jobSchema = new mongoose.Schema({
  title:      String,
  jobCode:    String,
  department: String,
  applicationFee: {
    isRequired: { type: Boolean, default: false },
    general:    { type: Number,  default: 0 },
    sc_st:      { type: Number,  default: 0 },
    obc:        { type: Number,  default: 0 },
    ews:        { type: Number,  default: 0 },
    pwd:        { type: Number,  default: 0 },
  },
  requiredSections: { type: Array, default: [] },
  customFields:     { type: Array, default: [] },
});
const Job = mongoose.models.Job ?? mongoose.model('Job', jobSchema);

// ─── Seed config ─────────────────────────────────────────────────────────────

const SEED_TAG = '[PAYMENT_SEED]'; // prefix on all seeded docs for easy cleanup

/**
 * Fee config for the test job — mirrors a realistic government recruitment fee
 * structure so every category produces a different (or zero) fee.
 */
const TEST_FEE_CONFIG = {
  isRequired: true,
  general: 1000, // GEN    → ₹1000 + ₹50 txn = ₹1050
  obc:       800, // OBC    → ₹800  + ₹50 txn = ₹850
  ews:       800, // EWS    → ₹800  + ₹50 txn = ₹850
  sc_st:       0, // SC/ST  → ₹0    (exempt)
  pwd:         0, // PWD    → ₹0    (exempt)
};

/**
 * One entry per test case. Each produces one Application in the DB.
 * Add / remove rows freely.
 */
const TEST_CASES = [
  { label: 'GEN',          category: 'GEN',  disability: false },
  { label: 'OBC',          category: 'OBC',  disability: false },
  { label: 'OBC-NCL',      category: 'OBC-NCL', disability: false },
  { label: 'EWS',          category: 'EWS',  disability: false },
  { label: 'SC (exempt)',   category: 'SC',   disability: false },
  { label: 'ST (exempt)',   category: 'ST',   disability: false },
  { label: 'PWD (exempt)',  category: 'GEN',  disability: true  },
  { label: 'GEN+PWD',      category: 'GEN',  disability: true  }, // same as PWD — fee=0
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate an applicationNumber in the same format your real app uses.
 * Format: APP-<YEAR>-<8 random hex chars uppercase>
 * Adjust the format here if your app uses a different pattern.
 */
function generateApplicationNumber() {
  const year   = new Date().getFullYear();
  const suffix = Math.random().toString(16).substring(2, 10).toUpperCase();
  return `APP-${year}-${suffix}`;
}

/**
 * Build a jobSnapshot from a Job document — mirrors what your real
 * application-creation route should capture at the time of applying.
 */
function buildJobSnapshot(job) {
  return {
    title:            job.title       ?? 'Test Recruitment',
    jobCode:          job.jobCode     ?? 'TEST-001',
    department:       job.department  ?? 'Test Department',
    requiredSections: job.requiredSections ?? [],
    customFields:     job.customFields     ?? [],
    applicationFee: {
      general:    job.applicationFee?.general    ?? 0,
      sc_st:      job.applicationFee?.sc_st      ?? 0,
      obc:        job.applicationFee?.obc        ?? 0,
      ews:        job.applicationFee?.ews        ?? 0,
      pwd:        job.applicationFee?.pwd        ?? 0,
      isRequired: job.applicationFee?.isRequired ?? false,
    },
  };
}

function makeToken(userId) {
  return jwt.sign(
    { _id: userId, role: 'applicant' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Build a realistic application sections Map so downstream validators
 * don't choke if they inspect the sections.
 */
function buildSections(category, disability) {
  return new Map([
    [
      'personal',
      {
        data: {
          fullName:    `Test User (${category}${disability ? '+PWD' : ''})`,
          dateOfBirth: '1995-06-15',
          gender:      'male',
          category,
          disability,
          email:       `test.${category.toLowerCase()}@seed.dev`,
          phone:       '9999999999',
        },
        isComplete: true,
      },
    ],
    [
      'education',
      {
        data: {
          highestQualification: 'Graduate',
          passingYear:          2017,
          percentage:           72.5,
        },
        isComplete: true,
      },
    ],
  ]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const isClean = process.argv.includes('--clean');

  await connectDB();
  console.log('\n🔗  Connected to database');

  // ── Optional cleanup ──────────────────────────────────────────────────────
  if (isClean) {
    const deletedApps = await Application.deleteMany({ applicationNumber: /^APP-/ , 'jobSnapshot.jobCode': 'SEED-2026' });
    const deletedJobs = await Job.deleteMany({ title: new RegExp(SEED_TAG) });
    const deletedPmts = await Payment.deleteMany({ 'metadata.seed': true });
    const deletedUsers = await TestUser.deleteMany({ email: /@seed\.dev$/ });
    console.log(
      `🧹  Cleaned: ${deletedApps.deletedCount} applications, ` +
      `${deletedJobs.deletedCount} jobs, ${deletedPmts.deletedCount} payments, ` +
      `${deletedUsers.deletedCount} users`
    );
  }

  // ── 1. Ensure a test job exists ───────────────────────────────────────────
  let testJob = await Job.findOne({ title: new RegExp(SEED_TAG) });
  if (!testJob) {
    testJob = await Job.create({
      title:          `${SEED_TAG} Test Recruitment 2026`,
      jobCode:        'SEED-2026',
      department:     'Seed Department',
      applicationFee: TEST_FEE_CONFIG,
    });
    console.log('💼  Created test job');
  } else {
    console.log('💼  Reusing existing test job');
  }

  const jobSnapshot = buildJobSnapshot(testJob);

  // ── 2. Create one user + application per test case ────────────────────────
  // Each test case gets its OWN user because the schema enforces a unique
  // index on { userId, jobId } — one application per user per job.
  console.log('\n📋  Seeding applications...\n');

  const rows = [];

  for (const tc of TEST_CASES) {
    const email = `seed.${tc.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}@seed.dev`;

    // Upsert the per-case test user
    let caseUser = await TestUser.findOne({ email });
    if (!caseUser) {
      caseUser = await TestUser.create({ email, name: `Seed ${tc.label}`, role: 'applicant' });
    }

    const token = makeToken(caseUser._id);

    // Remove stale seed application for this user+job (safe re-run)
    await Application.deleteOne({ userId: caseUser._id, jobId: testJob._id });

    const app = await Application.create({
      applicationNumber: generateApplicationNumber(),
      userId:            caseUser._id,
      jobId:             testJob._id,
      jobSnapshot,
      status:            'draft',
      paymentStatus:     'pending',
      sections:          buildSections(tc.category, tc.disability),
    });

    const { baseFee, transactionFee, totalAmount } = calculateApplicationFee(
      TEST_FEE_CONFIG,
      tc.category,
      tc.disability
    );

    rows.push({
      label:             tc.label,
      applicationNumber: app.applicationNumber,
      applicationId:     app._id.toString(),
      token,
      baseFee,
      transactionFee,
      totalAmount,
      expectExempt:      totalAmount === 0,
    });
  }

  // ── 3. Print results ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(100));
  console.log(
    'CATEGORY'.padEnd(14),
    'APP NUMBER'.padEnd(22),
    'MONGO ID'.padEnd(26),
    'BASE'.padEnd(8),
    'TOTAL'.padEnd(8),
    'RESULT'
  );
  console.log('─'.repeat(100));

  for (const r of rows) {
    console.log(
      r.label.padEnd(14),
      r.applicationNumber.padEnd(22),
      r.applicationId.padEnd(26),
      `₹${r.baseFee}`.padEnd(8),
      `₹${r.totalAmount}`.padEnd(8),
      r.expectExempt ? '✅ EXEMPT' : '💳 Stripe checkout'
    );
  }

  console.log('═'.repeat(100));
  console.log('\n🔑  Each row has its own user — tokens below (all valid 2h):\n');

  for (const r of rows) {
    console.log(`  ${r.label.padEnd(14)} Bearer ${r.token}`);
  }

  console.log('\n─'.repeat(100));
  console.log('📮  HOW TO TEST\n');
  console.log('  Step 1 — Pick a row above. Use its MONGO ID as applicationId and its Bearer token.\n');
  console.log('  Step 2 — Create order:');
  console.log('    POST http://localhost:8000/api/v1/payments/create-order');
  console.log('    Authorization: Bearer <token for that row>');
  console.log('    Content-Type: application/json');
  console.log('    Body: { "applicationId": "<MONGO ID>" }\n');
  console.log('  Step 3 — Open the returned `url` in your browser → pay with a test card below.\n');
  console.log('  Step 4 — Poll status:');
  console.log('    GET http://localhost:8000/api/v1/payments/status/<MONGO ID>');
  console.log('    Authorization: Bearer <same token>\n');

  console.log('─'.repeat(100));
  console.log('💳  STRIPE TEST CARDS (INR)\n');
  console.log('  ✅  Payment succeeds       : 4000 0035 6000 0008');
  console.log('  ❌  Card declined          : 4000 0000 0000 0002');
  console.log('  💸  Insufficient funds     : 4000 0000 0000 9995');
  console.log('  🔐  3DS required           : 4000 0025 0000 3155');
  console.log('  🔐  3DS — fails auth       : 4000 0000 0000 9987');
  console.log('\n  Expiry: any future date  |  CVV: any 3 digits  |  Name: anything\n');

  console.log('─'.repeat(100));
  console.log('🪝   WEBHOOK (run in a separate terminal)\n');
  console.log('  stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook\n');
  console.log('  Copy the whsec_... it prints → set as STRIPE_WEBHOOK_SECRET in .env\n');
  console.log('═'.repeat(100));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seeder failed:', err.message);
  process.exit(1);
});