import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../db/connectDB.js';
import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { Notice } from '../models/notice.model.js';
import { Department } from '../models/department.model.js';
import { Application } from '../models/application.model.js';
import { Review } from '../models/review.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { Payment } from '../models/payment.model.js';
import { VerificationToken } from '../models/verificationToken.model.js';
import {
  USER_ROLES,
  JOB_STATUS,
  JOB_DESIGNATION,
  JOB_PAY_LEVEL,
  JOB_RECRUITMENT_TYPE,
  JOB_CATEGORY,
  APPLICATION_STATUS,
  PAYMENT_STATUS,
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
  JOB_SECTION_TYPE,
} from '../constants.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const PLACEHOLDER_PDF   = 'https://res.cloudinary.com/demo/image/upload/sample_pdf.pdf';
const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const SEED_PASSWORD     = 'Password@123';

const SEED_EMAILS = [
  'superadmin@nitkkr.ac.in',
  'admin@nitkkr.ac.in',
  'rev.cs@nitkkr.ac.in',
  'rev.ec@nitkkr.ac.in',
  'applicant@gmail.com',
  'priya.research@gmail.com',
  'amit.sc@gmail.com',
];

const divider = (char = '─', len = 60) => console.log(char.repeat(len));

// ─── Fix Mode ────────────────────────────────────────────────────────────────
const runFixMode = async () => {
  divider('═');
  console.log('  🔧  FIX MODE — resetting seed user passwords');
  divider('═');

  const newHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const result = await User.updateMany(
    { email: { $in: SEED_EMAILS } },
    { $set: { password: newHash } }
  );

  console.log(`  ✅  Updated: ${result.modifiedCount} / ${SEED_EMAILS.length} users`);

  const user = await User.findOne({ email: 'superadmin@nitkkr.ac.in' }).select('+password');
  const ok   = await bcrypt.compare(SEED_PASSWORD, user.password);
  console.log(`  🔑  Verification: ${ok ? '✅ PASS — login will work now' : '❌ FAIL — check model hooks'}`);

  divider('═');
};

// ─── Main Seed ───────────────────────────────────────────────────────────────

const megaSeed = async () => {
  try {
    await connectDB();
    console.log(`  📦  DB: ${mongoose.connection.db?.databaseName}`);

    if (process.argv.includes('--fix')) {
      await runFixMode();
      process.exit(0);
    }

    divider('═');
    console.log('  🚀  SEED V3 — NIT KKR Recruitment Ecosystem');
    divider('═');

    if (process.env.NODE_ENV === 'production') {
      console.error('  ⚠️  FATAL: Attempting to seed in PRODUCTION environment. Aborting.');
      process.exit(1);
    }

    console.log('  🧹  purging legacy data...');
    await AuditLog.deleteMany({});
    await Review.deleteMany({});
    await Application.deleteMany({});
    await Job.deleteMany({});
    await Notice.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await Payment.deleteMany({});
    await VerificationToken.deleteMany({});

    console.log('  👥  creating users...');
    const users = await User.create([
      {
        email: 'superadmin@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.SUPER_ADMIN,
        profile: { firstName: 'Director', lastName: 'NIT KKR', phone: '9000000001', nationality: 'Indian' },
      },
      {
        email: 'admin@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.ADMIN,
        profile: { firstName: 'Recruitment', lastName: 'Cell', phone: '9000000002', nationality: 'Indian' },
      },
      {
        email: 'rev.cs@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.REVIEWER,
        profile: { firstName: 'Dr. Ramesh', lastName: 'Kaur', phone: '9000000003', nationality: 'Indian' },
      },
      {
        email: 'rev.ec@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.REVIEWER,
        profile: { firstName: 'Dr. Sunita', lastName: 'Gupta', phone: '9000000004', nationality: 'Indian' },
      },
      {
        email: 'applicant@gmail.com',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Vikram', lastName: 'Aditya', phone: '9876543210', nationality: 'Indian' },
      },
      {
        email: 'priya.research@gmail.com',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Priya', lastName: 'Sharma', phone: '8876543211', nationality: 'Indian' },
      },
      {
        email: 'amit.sc@gmail.com',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Amit', lastName: 'Das', phone: '7876543212', nationality: 'Indian' },
      },
    ]);

    const checkUser = await User.findOne({ email: 'superadmin@nitkkr.ac.in' }).select('+password');
    const hashOk    = await bcrypt.compare(SEED_PASSWORD, checkUser.password);
    if (!hashOk) {
      throw new Error('Password hash verification failed after User.create — check pre-save hook.');
    }
    console.log('  🔑  Password hash verified ✅');

    const admin  = users.find(u => u.role === USER_ROLES.ADMIN);
    const revCS  = users.find(u => u.email === 'rev.cs@nitkkr.ac.in');
    const revEC  = users.find(u => u.email === 'rev.ec@nitkkr.ac.in');
    const vikram = users.find(u => u.email === 'applicant@gmail.com');
    const priya  = users.find(u => u.email === 'priya.research@gmail.com');
    const amit   = users.find(u => u.email === 'amit.sc@gmail.com');

    console.log('  🏛️   creating departments...');
    const departments = await Department.insertMany([
      { name: 'Computer Engineering',        code: 'CS' },
      { name: 'Electronics & Communication', code: 'EC' },
      { name: 'Mechanical Engineering',      code: 'ME' },
      { name: 'Physics',                     code: 'PH' },
    ]);

    const csDept = departments.find(d => d.code === 'CS');
    const ecDept = departments.find(d => d.code === 'EC');

    console.log('  📢  creating notices...');
    await Notice.create([
      {
        heading:  'Recruitment for Faculty Positions (ADVT/CS/2026)',
        category: 'Faculty Recruitment',
        advtNo:   'ADVT/CS/2026',
        pdfUrl:   'https://example.com/notices/cs-faculty.pdf',
      },
      {
        heading:      'Extension of last date for Guest Faculty walk-in',
        category:     'Guest & Adjunct Faculty',
        advtNo:       'WALK-IN/EC/2026',
        externalLink: 'https://nitkkr.ac.in/walk-in-updates',
      },
    ]);

    console.log('  💼  creating job postings...');
    const facultySections = [
      { sectionType: JOB_SECTION_TYPE.PERSONAL, isMandatory: true },
      { sectionType: JOB_SECTION_TYPE.PHOTO, isMandatory: true },
      { sectionType: JOB_SECTION_TYPE.SIGNATURE, isMandatory: true },
      { sectionType: JOB_SECTION_TYPE.EDUCATION, isMandatory: true, minItems: 3, requiresPDF: true, pdfLabel: 'Consolidated Degree' },
      { sectionType: JOB_SECTION_TYPE.EXPERIENCE, isMandatory: true, requiresPDF: true, pdfLabel: 'Experience Certificates' },
      { sectionType: JOB_SECTION_TYPE.PUBLICATIONS_JOURNAL, isMandatory: false },
      { sectionType: JOB_SECTION_TYPE.PUBLICATIONS_CONFERENCE, isMandatory: false },
      { sectionType: JOB_SECTION_TYPE.PHD_SUPERVISION, isMandatory: false },
      { sectionType: JOB_SECTION_TYPE.SUBJECTS_TAUGHT, isMandatory: false },
      { sectionType: JOB_SECTION_TYPE.CREDIT_POINTS, isMandatory: true, requiresPDF: true, pdfLabel: 'Credit Calculation Sheet' },
      { sectionType: JOB_SECTION_TYPE.REFEREES, isMandatory: true, minItems: 2 },
      { sectionType: JOB_SECTION_TYPE.DECLARATION, isMandatory: true },
    ];

    const minimalSections = [
      { sectionType: JOB_SECTION_TYPE.PERSONAL, isMandatory: true },
      { sectionType: JOB_SECTION_TYPE.EDUCATION, isMandatory: true, minItems: 2 },
      { sectionType: JOB_SECTION_TYPE.EXPERIENCE, isMandatory: false },
      { sectionType: JOB_SECTION_TYPE.PHOTO, isMandatory: true },
      { sectionType: JOB_SECTION_TYPE.DECLARATION, isMandatory: true },
    ];

    const jobs = await Job.create([
      {
        title:             'Assistant Professor (Grade-II) - CS',
        advertisementNo:   'ADVT/CS/2026',
        department:        csDept._id,
        designation:       JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II,
        payLevel:          JOB_PAY_LEVEL.LEVEL_11,
        positions:         8,
        vacancies:         { UR: 4, OBC: 2, SC: 1, EWS: 1, total: 8 },
        recruitmentType:   JOB_RECRUITMENT_TYPE.EXTERNAL,
        categories:        [JOB_CATEGORY.GEN, JOB_CATEGORY.OBC, JOB_CATEGORY.SC, JOB_CATEGORY.EWS],
        applicationFee:    { general: 1500, sc_st: 750, obc: 1500, ews: 1000, pwd: 0, isRequired: true },
        description:       'Applications are invited for the post of Assistant Professor (Grade-II) in the Department of Computer Engineering.',
        eligibilityCriteria: {
          minAge:          25,
          maxAge:          45,
          nationality:     ['Indian'],
          minExperience:   0,
          requiredDegrees: [{ level: 'PhD', field: 'Computer Science/Engineering', isMandatory: true }],
        },
        requiredSections:  facultySections,
        assignedReviewers: [revCS._id],
        status:            JOB_STATUS.PUBLISHED,
        applicationStartDate: new Date(),
        applicationEndDate:   new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        createdBy:         admin._id,
      },
      {
        title:             'Guest Faculty - Electronics',
        advertisementNo:   'WALK-IN/EC/2026',
        department:        ecDept._id,
        designation:       JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II,
        payLevel:          JOB_PAY_LEVEL.LEVEL_10,
        positions:         4,
        vacancies:         { UR: 4, total: 4 },
        recruitmentType:   JOB_RECRUITMENT_TYPE.INTERNAL,
        categories:        [JOB_CATEGORY.GEN],
        applicationFee:    { general: 0, sc_st: 0, obc: 0, ews: 0, pwd: 0, isRequired: false },
        description:       'Walk-in interview for Guest Faculty in Electronics and Communication Engineering.',
        eligibilityCriteria: {
          minAge:          22,
          maxAge:          65,
          nationality:     ['Indian'],
          minExperience:   0,
          requiredDegrees: [{ level: 'Masters', field: 'Electronics/ECE', isMandatory: true }],
        },
        requiredSections:  minimalSections,
        assignedReviewers: [revEC._id],
        status:            JOB_STATUS.PUBLISHED,
        applicationStartDate: new Date(),
        applicationEndDate:   new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdBy:         admin._id,
      },
    ]);

    console.log('  📑  creating applications...');
    const appVikram = await Application.create({
      applicationNumber: 'APP-2026-CS-001',
      userId:            vikram._id,
      jobId:             jobs[0]._id,
      jobSnapshot: {
        title:            jobs[0].title,
        jobCode:          jobs[0].advertisementNo,
        department:       csDept.name,
        requiredSections: jobs[0].requiredSections,
      },
      status:        APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      submittedAt:   new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      statusHistory: [
        { status: APPLICATION_STATUS.DRAFT, changedBy: vikram._id, remarks: 'Started application' },
        { status: APPLICATION_STATUS.SUBMITTED, changedBy: vikram._id, remarks: 'Submitted and fee paid' }
      ],
      sections: {
        personal: {
          data: {
            name: 'Vikram Aditya', dob: '1990-05-15', gender: 'Male',
            category: 'GEN', mobile: '9876543210', nationality: 'Indian',
            corrAddress: 'Flat 402, Green Valley, Kurukshetra',
            phdTitle: 'Optimization in Distributed Systems',
            phdUniversity: 'IIT Bombay', phdDate: '2019-08-12',
          },
          isComplete: true,
        },
        education: {
          data: {
            items: [
              { examPassed: 'PhD',    discipline: 'CSE', boardUniversity: 'IIT Bombay', yearOfPassing: '2019', marks: '9.5' },
              { examPassed: 'M.Tech', discipline: 'CSE', boardUniversity: 'NIT KKR',    yearOfPassing: '2014', marks: '88%' },
              { examPassed: 'B.Tech', discipline: 'CSE', boardUniversity: 'NIT KKR',    yearOfPassing: '2012', marks: '85%' },
            ],
          },
          isComplete: true,
        },
        credit_points: {
          data: {
            totalCreditsClaimed: 55,
            manualActivities: [{ activityId: '1', description: 'Journal Papers', claimedPoints: 40 }],
          },
          isComplete: true,
        },
        photo:     { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        signature: { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        final_documents: { pdfUrl: PLACEHOLDER_PDF, isComplete: true },
        declaration: {
          data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true },
          isComplete: true,
        },
      },
    });

    await Application.create({
      applicationNumber: 'APP-2026-CS-002',
      userId:            priya._id,
      jobId:             jobs[0]._id,
      jobSnapshot: {
        title:            jobs[0].title,
        jobCode:          jobs[0].advertisementNo,
        department:       csDept.name,
        requiredSections: jobs[0].requiredSections,
      },
      status:        APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.EXEMPTED,
      submittedAt:   new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      sections: {
        personal: {
          data: { name: 'Priya Sharma', gender: 'Female', category: 'OBC', mobile: '8876543211' },
          isComplete: true,
        },
        education: {
          data: { items: [{ examPassed: 'PhD', boardUniversity: 'Delhi University', yearOfPassing: '2021' }] },
          isComplete: true,
        },
        declaration: {
          data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true },
          isComplete: true,
        },
      },
    });

    await Application.create({
      applicationNumber: 'APP-2026-EC-003',
      userId:            amit._id,
      jobId:             jobs[1]._id,
      jobSnapshot: {
        title:            jobs[1].title,
        jobCode:          jobs[1].advertisementNo,
        department:       ecDept.name,
        requiredSections: jobs[1].requiredSections,
      },
      status:        APPLICATION_STATUS.DRAFT,
      paymentStatus: PAYMENT_STATUS.PENDING,
      sections: {
        personal: {
          data: { name: 'Amit Das', gender: 'Male', category: 'SC' },
          isComplete: false,
        },
      },
    });

    console.log('  ⚖️   creating reviews...');
    await Review.create({
      reviewerId:    revCS._id,
      applicationId: appVikram._id,
      status:        'SUBMITTED',
      scorecard: {
        academicScore:    49,
        researchScore:    30,
        experienceScore:  15,
        recommendation:   'RECOMMENDED',
        comments:         'Strong candidate. Research papers in high-impact journals. PhD from a Tier-1 institute.',
      },
    });

    console.log('  📝  creating audit logs...');
    await AuditLog.create([
      {
        userId:       admin._id,
        action:       AUDIT_ACTIONS.JOB_CREATED,
        resourceType: RESOURCE_TYPES.JOB,
        resourceId:   jobs[0]._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/3.0',
      },
      {
        userId:       revCS._id,
        action:       AUDIT_ACTIONS.REVIEW_SUBMITTED,
        resourceType: RESOURCE_TYPES.APPLICATION,
        resourceId:   appVikram._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/3.0',
      },
    ]);

    divider('═');
    console.log('  ✅  SEED COMPLETE');
    console.log(`  📊  Stats:`);
    console.log(`       Users        : ${users.length}`);
    console.log(`       Departments  : ${departments.length}`);
    console.log(`       Jobs         : ${jobs.length}`);
    console.log(`       Applications : 3`);
    console.log(`       Reviews      : 1`);
    console.log(`  🔑  Login with any seed email + Password@123`);
    divider('═');

    process.exit(0);
  } catch (error) {
    console.error('  ❌  SEED FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
};

megaSeed();