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
  'reviewer1@nitkkr.ac.in',
  'reviewer2@nitkkr.ac.in',
  'applicant1@nitkkr.ac.in',
  'applicant2@nitkkr.ac.in',
  'applicant3@nitkkr.ac.in',
  'applicant4@nitkkr.ac.in',
  'applicant5@nitkkr.ac.in',
];

const divider = (char = '─', len = 60) => console.log(char.repeat(len));

// ─── Reusable section configs (plain objects — NOT mongoose docs) ────────────

const facultySections = [
  { sectionType: JOB_SECTION_TYPE.PERSONAL, isMandatory: true },
  { sectionType: JOB_SECTION_TYPE.PHOTO, isMandatory: true },
  { sectionType: JOB_SECTION_TYPE.SIGNATURE, isMandatory: true },
  { sectionType: JOB_SECTION_TYPE.EDUCATION, isMandatory: true, requiresPDF: true, pdfLabel: 'Consolidated Degree Certificates' },
  { sectionType: JOB_SECTION_TYPE.EXPERIENCE, isMandatory: true, requiresPDF: true, pdfLabel: 'Experience Certificates' },
  { sectionType: JOB_SECTION_TYPE.PUBLICATIONS_JOURNAL, isMandatory: false },
  { sectionType: JOB_SECTION_TYPE.PUBLICATIONS_CONFERENCE, isMandatory: false },
  { sectionType: JOB_SECTION_TYPE.PHD_SUPERVISION, isMandatory: false },
  { sectionType: JOB_SECTION_TYPE.SUBJECTS_TAUGHT, isMandatory: false },
  { sectionType: JOB_SECTION_TYPE.CREDIT_POINTS, isMandatory: true, requiresPDF: true, pdfLabel: 'Credit Calculation Sheet' },
  { sectionType: JOB_SECTION_TYPE.REFEREES, isMandatory: true },
  { sectionType: JOB_SECTION_TYPE.DECLARATION, isMandatory: true },
];

const minimalSections = [
  { sectionType: JOB_SECTION_TYPE.PERSONAL, isMandatory: true },
  { sectionType: JOB_SECTION_TYPE.EDUCATION, isMandatory: true },
  { sectionType: JOB_SECTION_TYPE.EXPERIENCE, isMandatory: false },
  { sectionType: JOB_SECTION_TYPE.PHOTO, isMandatory: true },
  { sectionType: JOB_SECTION_TYPE.DECLARATION, isMandatory: true },
];

/**
 * Build a clean plain-object array for jobSnapshot.requiredSections.
 * This avoids passing Mongoose subdocuments which can break serialization.
 */
const toPlainSections = (sections) =>
  sections.map(({ sectionType, isMandatory = true, requiresPDF = false, pdfLabel = null, maxPDFSize = 5, instructions = null }) => ({
    sectionType,
    isMandatory,
    requiresPDF,
    pdfLabel,
    maxPDFSize,
    instructions,
  }));

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
    console.log('  🚀  SEED V4 — NIT KKR Recruitment Ecosystem');
    divider('═');

    if (process.env.NODE_ENV === 'production') {
      console.error('  ⚠️  FATAL: Attempting to seed in PRODUCTION environment. Aborting.');
      process.exit(1);
    }

    console.log('  🧹  purging legacy data...');
    await AuditLog.deleteMany({});
    await Review.deleteMany({});
    await Payment.deleteMany({});
    await Application.deleteMany({});
    await Job.deleteMany({});
    await Notice.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await VerificationToken.deleteMany({});

    // ──────────────────────────── USERS ──────────────────────────────────────
    console.log('  👥  creating users...');
    const users = await User.create([
      {
        email: 'superadmin@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.SUPER_ADMIN,
        profile: { firstName: 'Director', lastName: 'NIT KKR', phone: '9000000001', nationality: 'Indian', dateOfBirth: new Date('1965-03-15') },
      },
      {
        email: 'admin@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.ADMIN,
        profile: { firstName: 'Recruitment', lastName: 'Cell', phone: '9000000002', nationality: 'Indian', dateOfBirth: new Date('1975-07-20') },
      },
      {
        email: 'reviewer1@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.REVIEWER,
        profile: { firstName: 'Dr. Ramesh', lastName: 'Kaur', phone: '9000000003', nationality: 'Indian', dateOfBirth: new Date('1970-01-10') },
      },
      {
        email: 'reviewer2@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.REVIEWER,
        profile: { firstName: 'Dr. Sunita', lastName: 'Gupta', phone: '9000000004', nationality: 'Indian', dateOfBirth: new Date('1972-04-25') },
      },
      {
        email: 'applicant1@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Vikram', lastName: 'Aditya', phone: '9876543210', nationality: 'Indian', dateOfBirth: new Date('1990-05-15') },
      },
      {
        email: 'applicant2@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Priya', lastName: 'Sharma', phone: '8876543211', nationality: 'Indian', dateOfBirth: new Date('1988-11-22') },
      },
      {
        email: 'applicant3@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Amit', lastName: 'Das', phone: '7876543212', nationality: 'Indian', dateOfBirth: new Date('1992-08-05') },
      },
      {
        email: 'applicant4@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Neha', lastName: 'Verma', phone: '7776543213', nationality: 'Indian', dateOfBirth: new Date('1991-02-18') },
      },
      {
        email: 'applicant5@nitkkr.ac.in',
        password: SEED_PASSWORD,
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Ravi', lastName: 'Kumar', phone: '7676543214', nationality: 'Indian', dateOfBirth: new Date('1993-09-30') },
      },
    ]);

    const checkUser = await User.findOne({ email: 'superadmin@nitkkr.ac.in' }).select('+password');
    const hashOk    = await bcrypt.compare(SEED_PASSWORD, checkUser.password);
    if (!hashOk) throw new Error('Password hash verification failed — check pre-save hook.');
    console.log('  🔑  Password hash verified ✅');

    const admin  = users.find(u => u.role === USER_ROLES.ADMIN);
    const revCS  = users.find(u => u.email === 'reviewer1@nitkkr.ac.in');
    const revEC  = users.find(u => u.email === 'reviewer2@nitkkr.ac.in');
    const vikram = users.find(u => u.email === 'applicant1@nitkkr.ac.in');
    const priya  = users.find(u => u.email === 'applicant2@nitkkr.ac.in');
    const amit   = users.find(u => u.email === 'applicant3@nitkkr.ac.in');
    const neha   = users.find(u => u.email === 'applicant4@nitkkr.ac.in');
    const ravi   = users.find(u => u.email === 'applicant5@nitkkr.ac.in');

    // ──────────────────────────── DEPARTMENTS ────────────────────────────────
    console.log('  🏛️   creating departments...');
    const departments = await Department.insertMany([
      { name: 'Computer Engineering',          code: 'CS' },
      { name: 'Electronics & Communication',   code: 'EC' },
      { name: 'Mechanical Engineering',        code: 'ME' },
      { name: 'Civil Engineering',             code: 'CE' },
      { name: 'Electrical Engineering',        code: 'EE' },
      { name: 'Physics',                       code: 'PH' },
      { name: 'Mathematics',                   code: 'MA' },
    ]);

    const csDept = departments.find(d => d.code === 'CS');
    const ecDept = departments.find(d => d.code === 'EC');
    const meDept = departments.find(d => d.code === 'ME');
    const phDept = departments.find(d => d.code === 'PH');

    // ──────────────────────────── NOTICES ─────────────────────────────────────
    console.log('  📢  creating notices...');
    await Notice.create([
      {
        heading:  'Recruitment for Faculty Positions — Computer Engineering (ADVT/CS/2026)',
        category: 'Faculty Recruitment',
        advtNo:   'ADVT/CS/2026',
        pdfUrl:   PLACEHOLDER_PDF,
      },
      {
        heading:      'Extension of Last Date — Guest Faculty Walk-In (EC)',
        category:     'Guest & Adjunct Faculty',
        advtNo:       'WALK-IN/EC/2026',
        externalLink: 'https://nitkkr.ac.in/walk-in-updates',
      },
      {
        heading:  'Recruitment for Assistant Professor Grade-I — Mechanical Engineering',
        category: 'Faculty Recruitment',
        advtNo:   'ADVT/ME/2026',
        pdfUrl:   PLACEHOLDER_PDF,
      },
      {
        heading:  'Results: Shortlisted Candidates for CS Faculty Positions',
        category: 'Results & Shortlisting',
        advtNo:   'RESULT/CS/2026',
      },
      {
        heading:  'Important: Revised Application Fee Structure Effective April 2026',
        category: 'Important Notifications',
      },
      {
        // Archived notice — demonstrates the archive feature
        heading:  'EXPIRED — Walk-In Interview for Lab Technician Posts',
        category: 'Non-Teaching Positions',
        advtNo:   'NT/LAB/2025',
        isActive: false,
      },
    ]);

    // ──────────────────────────── JOBS ────────────────────────────────────────
    console.log('  💼  creating job postings...');
    const jobs = await Job.create([
      // Job 0: Published — CS Grade-II (main job with faculty sections)
      {
        title:             'Assistant Professor Grade-II — Computer Engineering',
        advertisementNo:   'ADVT/CS/2026',
        department:        csDept._id,
        designation:       JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II,
        payLevel:          JOB_PAY_LEVEL.LEVEL_11,
        vacancies:         { UR: 4, OBC: 2, SC: 1, EWS: 1, total: 8 },
        recruitmentType:   JOB_RECRUITMENT_TYPE.EXTERNAL,
        categories:        [JOB_CATEGORY.GEN, JOB_CATEGORY.OBC, JOB_CATEGORY.SC, JOB_CATEGORY.EWS],
        applicationFee:    { general: 1500, sc_st: 750, obc: 1500, ews: 1000, pwd: 0, isRequired: true },
        description:       'Applications are invited for the post of Assistant Professor (Grade-II) in the Department of Computer Engineering, NIT Kurukshetra.',
        eligibilityCriteria: {
          minAge: 25, maxAge: 45, nationality: ['Indian'], minExperience: 0,
          requiredDegrees: [{ level: 'PhD', field: 'Computer Science/Engineering', isMandatory: true }],
        },
        requiredSections:  facultySections,
        assignedReviewers: [revCS._id],
        status:            JOB_STATUS.PUBLISHED,
        applicationStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        applicationEndDate:   new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        createdBy:         admin._id,
      },
      // Job 1: Published — EC Grade-II (minimal sections)
      {
        title:             'Assistant Professor Grade-II — Electronics & Communication',
        advertisementNo:   'WALK-IN/EC/2026',
        department:        ecDept._id,
        designation:       JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II,
        payLevel:          JOB_PAY_LEVEL.LEVEL_10,
        vacancies:         { UR: 4, total: 4 },
        recruitmentType:   JOB_RECRUITMENT_TYPE.INTERNAL,
        categories:        [JOB_CATEGORY.GEN],
        applicationFee:    { general: 0, sc_st: 0, obc: 0, ews: 0, pwd: 0, isRequired: false },
        description:       'Walk-in interview for Assistant Professor (Grade-II) in Electronics & Communication Engineering.',
        eligibilityCriteria: {
          minAge: 22, maxAge: 65, nationality: ['Indian'], minExperience: 0,
          requiredDegrees: [{ level: 'Masters', field: 'Electronics/ECE', isMandatory: true }],
        },
        requiredSections:  minimalSections,
        assignedReviewers: [revEC._id],
        status:            JOB_STATUS.PUBLISHED,
        applicationStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        applicationEndDate:   new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdBy:         admin._id,
      },
      // Job 2: Closed — ME Grade-I
      {
        title:             'Assistant Professor Grade-I — Mechanical Engineering',
        advertisementNo:   'ADVT/ME/2026',
        department:        meDept._id,
        designation:       JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_I,
        payLevel:          JOB_PAY_LEVEL.LEVEL_12,
        vacancies:         { UR: 2, OBC: 1, SC: 1, total: 4 },
        recruitmentType:   JOB_RECRUITMENT_TYPE.EXTERNAL,
        categories:        [JOB_CATEGORY.GEN, JOB_CATEGORY.OBC, JOB_CATEGORY.SC],
        applicationFee:    { general: 2000, sc_st: 1000, obc: 2000, ews: 1500, pwd: 0, isRequired: true },
        description:       'Applications are invited for the post of Assistant Professor (Grade-I) in Mechanical Engineering.',
        eligibilityCriteria: {
          minAge: 30, maxAge: 50, nationality: ['Indian'], minExperience: 3,
          requiredDegrees: [{ level: 'PhD', field: 'Mechanical Engineering', isMandatory: true }],
        },
        requiredSections:  facultySections,
        assignedReviewers: [revCS._id],
        status:            JOB_STATUS.CLOSED,
        closedAt:          new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        applicationStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        applicationEndDate:   new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdBy:         admin._id,
      },
      // Job 3: Draft — PH Grade-II
      {
        title:             'Assistant Professor Grade-II — Physics',
        advertisementNo:   'DRAFT/PH/2026',
        department:        phDept._id,
        designation:       JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II,
        payLevel:          JOB_PAY_LEVEL.LEVEL_11,
        vacancies:         { UR: 3, OBC: 1, total: 4 },
        recruitmentType:   JOB_RECRUITMENT_TYPE.EXTERNAL,
        categories:        [JOB_CATEGORY.GEN, JOB_CATEGORY.OBC],
        applicationFee:    { general: 1500, sc_st: 750, obc: 1500, ews: 1000, pwd: 0, isRequired: true },
        description:       'Draft: Applications for Assistant Professor in Physics department.',
        eligibilityCriteria: {
          minAge: 25, maxAge: 45, nationality: ['Indian'], minExperience: 0,
          requiredDegrees: [{ level: 'PhD', field: 'Physics', isMandatory: true }],
        },
        requiredSections:  facultySections,
        status:            JOB_STATUS.DRAFT,
        applicationStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        applicationEndDate:   new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy:         admin._id,
      },
    ]);

    // ──────────────────────────── APPLICATIONS ───────────────────────────────
    console.log('  📑  creating applications...');

    const plainFaculty  = toPlainSections(facultySections);
    const plainMinimal  = toPlainSections(minimalSections);

    // App 1: Vikram → CS Job — SUBMITTED (fully filled, paid)
    const appVikram = await Application.create({
      applicationNumber: 'APP-CS-1001',
      userId:            vikram._id,
      jobId:             jobs[0]._id,
      jobSnapshot: {
        title:            jobs[0].title,
        jobCode:          jobs[0].advertisementNo,
        department:       csDept.name,
        requiredSections: plainFaculty,
      },
      status:        APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      submittedAt:   new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isLocked:      true,
      lockedAt:      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      statusHistory: [
        { status: APPLICATION_STATUS.DRAFT, changedBy: vikram._id, remarks: 'Started application' },
        { status: APPLICATION_STATUS.SUBMITTED, changedBy: vikram._id, remarks: 'Submitted with fee paid' },
      ],
      sections: {
        personal: {
          data: {
            name: 'Vikram Aditya', dob: '1990-05-15', gender: 'Male',
            category: 'GEN', mobile: '9876543210', nationality: 'Indian',
            corrAddress: 'Flat 402, Green Valley Apartments, Sector 17, Kurukshetra, Haryana - 136119',
            phdTitle: 'Optimization Techniques in Distributed Computing Systems',
            phdUniversity: 'IIT Bombay', phdDate: '2019-08-12',
          },
          isComplete: true,
        },
        education: {
          data: {
            items: [
              { examPassed: 'PhD',    discipline: 'Computer Science', boardUniversity: 'IIT Bombay', yearOfPassing: '2019', marks: '9.5 CGPA' },
              { examPassed: 'M.Tech', discipline: 'Computer Science', boardUniversity: 'NIT Kurukshetra', yearOfPassing: '2014', marks: '88%' },
              { examPassed: 'B.Tech', discipline: 'Computer Science', boardUniversity: 'NIT Kurukshetra', yearOfPassing: '2012', marks: '85%' },
            ],
          },
          isComplete: true,
        },
        experience: {
          data: {
            items: [
              { organization: 'NIT Kurukshetra', designation: 'Ad-hoc Faculty', fromDate: '2019-09-01', toDate: '2022-12-31', experienceType: 'teaching' },
              { organization: 'IIT Bombay', designation: 'Research Associate', fromDate: '2017-01-15', toDate: '2019-07-30', experienceType: 'research' },
            ],
          },
          isComplete: true,
        },
        publications_journal: {
          data: {
            items: [
              { title: 'Efficient Load Balancing in Fog Computing Networks', journalName: 'IEEE Trans. on Cloud Computing', year: '2021', impactFactor: '6.5', authors: 'V. Aditya, R. Kaur' },
              { title: 'Machine Learning Approaches for Task Scheduling in Edge Environments', journalName: 'ACM Computing Surveys', year: '2022', impactFactor: '14.3', authors: 'V. Aditya' },
            ],
          },
          isComplete: true,
        },
        publications_conference: {
          data: {
            items: [
              { title: 'Deep Reinforcement Learning for Resource Allocation', conferenceName: 'IEEE INFOCOM 2020', year: '2020', authors: 'V. Aditya, S. Gupta' },
            ],
          },
          isComplete: true,
        },
        phd_supervision: {
          data: { items: [] },
          isComplete: true,
        },
        subjects_taught: {
          data: {
            items: [
              { subject: 'Data Structures', level: 'UG', semesters: 4 },
              { subject: 'Cloud Computing', level: 'PG', semesters: 2 },
              { subject: 'Operating Systems', level: 'UG', semesters: 3 },
            ],
          },
          isComplete: true,
        },
        credit_points: {
          data: {
            totalCreditsClaimed: 55,
            manualActivities: [{ activityId: 'J1', description: 'Journal Publications', claimedPoints: 40 }],
          },
          isComplete: true,
        },
        referees: {
          data: {
            items: [
              { name: 'Prof. A.K. Sharma', designation: 'Professor', organization: 'IIT Delhi', email: 'ak.sharma@iitd.ac.in', phone: '9999900001' },
              { name: 'Prof. B. Reddy', designation: 'Professor', organization: 'NIT Warangal', email: 'b.reddy@nitw.ac.in', phone: '9999900002' },
            ],
          },
          isComplete: true,
        },
        photo:     { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        signature: { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        declaration: {
          data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true },
          isComplete: true,
        },
      },
    });

    // App 2: Priya → CS Job — SUBMITTED (fee exempted)
    const appPriya = await Application.create({
      applicationNumber: 'APP-CS-1002',
      userId:            priya._id,
      jobId:             jobs[0]._id,
      jobSnapshot: {
        title:            jobs[0].title,
        jobCode:          jobs[0].advertisementNo,
        department:       csDept.name,
        requiredSections: plainFaculty,
      },
      status:        APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.EXEMPTED,
      submittedAt:   new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isLocked:      true,
      lockedAt:      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      statusHistory: [
        { status: APPLICATION_STATUS.DRAFT, changedBy: priya._id, remarks: 'Started application' },
        { status: APPLICATION_STATUS.SUBMITTED, changedBy: priya._id, remarks: 'Submitted (fee exempted)' },
      ],
      sections: {
        personal: {
          data: { name: 'Priya Sharma', dob: '1988-11-22', gender: 'Female', category: 'OBC', mobile: '8876543211', nationality: 'Indian', corrAddress: 'H.No 12, Sector 8, Faridabad, Haryana' },
          isComplete: true,
        },
        education: {
          data: { items: [
            { examPassed: 'PhD', discipline: 'CSE', boardUniversity: 'Delhi University', yearOfPassing: '2021', marks: '9.2 CGPA' },
            { examPassed: 'M.Tech', discipline: 'CSE', boardUniversity: 'IIIT Hyderabad', yearOfPassing: '2015', marks: '86%' },
            { examPassed: 'B.Tech', discipline: 'IT', boardUniversity: 'GGSIPU Delhi', yearOfPassing: '2013', marks: '82%' },
          ] },
          isComplete: true,
        },
        experience: {
          data: { items: [{ organization: 'Delhi University', designation: 'Assistant Professor (Contractual)', fromDate: '2021-08-01', toDate: '2025-06-30', experienceType: 'teaching' }] },
          isComplete: true,
        },
        publications_journal: { data: { items: [] }, isComplete: true },
        publications_conference: { data: { items: [] }, isComplete: true },
        phd_supervision: { data: { items: [] }, isComplete: true },
        subjects_taught: { data: { items: [{ subject: 'Algorithms', level: 'UG', semesters: 6 }] }, isComplete: true },
        credit_points: {
          data: { totalCreditsClaimed: 35, manualActivities: [] },
          isComplete: true,
        },
        referees: {
          data: { items: [
            { name: 'Dr. M. Singh', designation: 'Professor', organization: 'Delhi University', email: 'm.singh@du.ac.in', phone: '9999800001' },
            { name: 'Dr. K. Rao', designation: 'Professor', organization: 'IIIT Hyderabad', email: 'k.rao@iiith.ac.in', phone: '9999800002' },
          ] },
          isComplete: true,
        },
        photo:       { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        signature:   { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        declaration: { data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true }, isComplete: true },
      },
    });

    // App 3: Amit → EC Job — DRAFT (partial fill)
    await Application.create({
      applicationNumber: 'APP-EC-2001',
      userId:            amit._id,
      jobId:             jobs[1]._id,
      jobSnapshot: {
        title:            jobs[1].title,
        jobCode:          jobs[1].advertisementNo,
        department:       ecDept.name,
        requiredSections: plainMinimal,
      },
      status:        APPLICATION_STATUS.DRAFT,
      paymentStatus: PAYMENT_STATUS.PENDING,
      sections: {
        personal: {
          data: { name: 'Amit Das', dob: '1992-08-05', gender: 'Male', category: 'SC', mobile: '7876543212', nationality: 'Indian' },
          isComplete: false,
        },
      },
    });

    // App 4: Neha → CS Job — SHORTLISTED
    await Application.create({
      applicationNumber: 'APP-CS-1003',
      userId:            neha._id,
      jobId:             jobs[0]._id,
      jobSnapshot: {
        title:            jobs[0].title,
        jobCode:          jobs[0].advertisementNo,
        department:       csDept.name,
        requiredSections: plainFaculty,
      },
      status:        APPLICATION_STATUS.SHORTLISTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      submittedAt:   new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isLocked:      true,
      lockedAt:      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      statusHistory: [
        { status: APPLICATION_STATUS.DRAFT, changedBy: neha._id, remarks: 'Started application' },
        { status: APPLICATION_STATUS.SUBMITTED, changedBy: neha._id, remarks: 'Submitted' },
        { status: APPLICATION_STATUS.SHORTLISTED, changedBy: admin._id, remarks: 'Shortlisted based on review' },
      ],
      sections: {
        personal: { data: { name: 'Neha Verma', dob: '1991-02-18', gender: 'Female', category: 'EWS', mobile: '7776543213' }, isComplete: true },
        education: { data: { items: [
          { examPassed: 'PhD', discipline: 'CSE', boardUniversity: 'IIT Kanpur', yearOfPassing: '2020', marks: '9.4 CGPA' },
          { examPassed: 'M.Tech', discipline: 'CSE', boardUniversity: 'IIT Kanpur', yearOfPassing: '2016', marks: '91%' },
          { examPassed: 'B.Tech', discipline: 'CSE', boardUniversity: 'MNIT Jaipur', yearOfPassing: '2014', marks: '87%' },
        ] }, isComplete: true },
        experience: { data: { items: [] }, isComplete: true },
        publications_journal: { data: { items: [] }, isComplete: true },
        publications_conference: { data: { items: [] }, isComplete: true },
        phd_supervision: { data: { items: [] }, isComplete: true },
        subjects_taught: { data: { items: [] }, isComplete: true },
        credit_points: { data: { totalCreditsClaimed: 42 }, isComplete: true },
        referees: { data: { items: [
          { name: 'Prof. C. Mishra', designation: 'Professor', organization: 'IIT Kanpur', email: 'c.mishra@iitk.ac.in' },
          { name: 'Prof. D. Jain', designation: 'Professor', organization: 'MNIT Jaipur', email: 'd.jain@mnit.ac.in' },
        ] }, isComplete: true },
        photo:       { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        signature:   { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        declaration: { data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true }, isComplete: true },
      },
    });

    // App 5: Ravi → CS Job — REJECTED
    await Application.create({
      applicationNumber: 'APP-CS-1004',
      userId:            ravi._id,
      jobId:             jobs[0]._id,
      jobSnapshot: {
        title:            jobs[0].title,
        jobCode:          jobs[0].advertisementNo,
        department:       csDept.name,
        requiredSections: plainFaculty,
      },
      status:        APPLICATION_STATUS.REJECTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      submittedAt:   new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      isLocked:      true,
      lockedAt:      new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      statusHistory: [
        { status: APPLICATION_STATUS.DRAFT, changedBy: ravi._id, remarks: 'Started application' },
        { status: APPLICATION_STATUS.SUBMITTED, changedBy: ravi._id, remarks: 'Submitted' },
        { status: APPLICATION_STATUS.REJECTED, changedBy: admin._id, remarks: 'Does not meet minimum qualification criteria' },
      ],
      sections: {
        personal: { data: { name: 'Ravi Kumar', dob: '1993-09-30', gender: 'Male', category: 'OBC', mobile: '7676543214' }, isComplete: true },
        education: { data: { items: [
          { examPassed: 'M.Tech', discipline: 'CSE', boardUniversity: 'Kurukshetra University', yearOfPassing: '2018', marks: '72%' },
          { examPassed: 'B.Tech', discipline: 'CSE', boardUniversity: 'MDU Rohtak', yearOfPassing: '2016', marks: '68%' },
        ] }, isComplete: true },
        experience: { data: { items: [] }, isComplete: true },
        publications_journal: { data: { items: [] }, isComplete: true },
        publications_conference: { data: { items: [] }, isComplete: true },
        phd_supervision: { data: { items: [] }, isComplete: true },
        subjects_taught: { data: { items: [] }, isComplete: true },
        credit_points: { data: { totalCreditsClaimed: 10 }, isComplete: true },
        referees: { data: { items: [{ name: 'Prof. E. Gupta', designation: 'Professor', organization: 'KU', email: 'e.gupta@kuk.ac.in' }] }, isComplete: true },
        photo:       { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        signature:   { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        declaration: { data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true }, isComplete: true },
      },
    });

    // App 6: Neha → EC Job — WITHDRAWN
    await Application.create({
      applicationNumber: 'APP-EC-2002',
      userId:            neha._id,
      jobId:             jobs[1]._id,
      jobSnapshot: {
        title:            jobs[1].title,
        jobCode:          jobs[1].advertisementNo,
        department:       ecDept.name,
        requiredSections: plainMinimal,
      },
      status:        APPLICATION_STATUS.WITHDRAWN,
      paymentStatus: PAYMENT_STATUS.PENDING,
      submittedAt:   new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isLocked:      true,
      statusHistory: [
        { status: APPLICATION_STATUS.DRAFT, changedBy: neha._id, remarks: 'Started' },
        { status: APPLICATION_STATUS.SUBMITTED, changedBy: neha._id, remarks: 'Submitted' },
        { status: APPLICATION_STATUS.WITHDRAWN, changedBy: neha._id, remarks: 'Withdrew due to personal reasons' },
      ],
      sections: {
        personal: { data: { name: 'Neha Verma', category: 'EWS' }, isComplete: true },
        education: { data: { items: [{ examPassed: 'M.Tech', discipline: 'ECE', boardUniversity: 'NIT KKR', yearOfPassing: '2017' }] }, isComplete: true },
        photo:       { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        declaration: { data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true }, isComplete: true },
      },
    });

    // ──────────────────────────── PAYMENTS ────────────────────────────────────
    console.log('  💳  creating payment records...');
    await Payment.create([
      {
        applicationId:    appVikram._id,
        userId:           vikram._id,
        amount:           1500,
        currency:         'INR',
        status:           PAYMENT_STATUS.PAID,
        orderId:          'order_test_vikram_001',
        razorpayPaymentId: 'pay_test_vikram_001',
        createdAt:        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        applicationId:    appPriya._id,
        userId:           priya._id,
        amount:           0,
        currency:         'INR',
        status:           PAYMENT_STATUS.EXEMPTED,
        orderId:          'order_exempt_priya_001',
      },
    ]);

    // ──────────────────────────── REVIEWS ─────────────────────────────────────
    console.log('  ⚖️   creating reviews...');
    await Review.create([
      {
        reviewerId:    revCS._id,
        applicationId: appVikram._id,
        status:        'SUBMITTED',
        scorecard: {
          academicScore:    49,
          researchScore:    30,
          experienceScore:  15,
          recommendation:   'RECOMMENDED',
          comments:         'Strong candidate. High-impact journal publications and PhD from IIT Bombay. Well suited for the position.',
        },
      },
      {
        reviewerId:    revCS._id,
        applicationId: appPriya._id,
        status:        'PENDING',
      },
    ]);

    // ──────────────────────────── AUDIT LOGS ─────────────────────────────────
    console.log('  📝  creating audit logs...');
    await AuditLog.create([
      {
        userId:       admin._id,
        action:       AUDIT_ACTIONS.JOB_CREATED,
        resourceType: RESOURCE_TYPES.JOB,
        resourceId:   jobs[0]._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/4.0',
      },
      {
        userId:       admin._id,
        action:       AUDIT_ACTIONS.JOB_CREATED,
        resourceType: RESOURCE_TYPES.JOB,
        resourceId:   jobs[1]._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/4.0',
      },
      {
        userId:       vikram._id,
        action:       AUDIT_ACTIONS.APPLICATION_SUBMITTED,
        resourceType: RESOURCE_TYPES.APPLICATION,
        resourceId:   appVikram._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/4.0',
      },
      {
        userId:       revCS._id,
        action:       AUDIT_ACTIONS.REVIEW_SUBMITTED,
        resourceType: RESOURCE_TYPES.APPLICATION,
        resourceId:   appVikram._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/4.0',
      },
      {
        userId:       admin._id,
        action:       AUDIT_ACTIONS.APPLICATION_STATUS_CHANGED,
        resourceType: RESOURCE_TYPES.APPLICATION,
        resourceId:   appVikram._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/4.0',
        changes:      { before: { status: 'submitted' }, after: { status: 'shortlisted' } },
      },
      {
        userId:       admin._id,
        action:       AUDIT_ACTIONS.JOB_CLOSED,
        resourceType: RESOURCE_TYPES.JOB,
        resourceId:   jobs[2]._id,
        ipAddress:    '127.0.0.1',
        userAgent:    'SeedScript/4.0',
      },
    ]);

    // ──────────────────────────── DONE ────────────────────────────────────────
    divider('═');
    console.log('  ✅  SEED V4 COMPLETE');
    console.log('  📊  Stats:');
    console.log(`       Users        : ${users.length}`);
    console.log(`       Departments  : ${departments.length}`);
    console.log(`       Notices      : 6  (5 active + 1 archived)`);
    console.log(`       Jobs         : ${jobs.length}  (2 published + 1 closed + 1 draft)`);
    console.log('       Applications : 6  (2 submitted + 1 draft + 1 shortlisted + 1 rejected + 1 withdrawn)');
    console.log('       Payments     : 2');
    console.log('       Reviews      : 2  (1 SUBMITTED + 1 PENDING)');
    console.log('       Audit Logs   : 6');
    console.log('  🔑  Login with any seed email + Password@123');
    divider('═');

    process.exit(0);
  } catch (error) {
    console.error('  ❌  SEED FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
};

megaSeed();