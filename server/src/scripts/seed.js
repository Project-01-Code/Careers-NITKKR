import 'dotenv/config';
import { connectDB } from '../db/connectDB.js';
import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { Notice } from '../models/notice.model.js';
import { Department } from '../models/department.model.js';
import { Application } from '../models/application.model.js';
import { Review } from '../models/review.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import {
  USER_ROLES,
  JOB_STATUS,
  JOB_DESIGNATION,
  JOB_PAY_LEVEL,
  JOB_RECRUITMENT_TYPE,
  JOB_CATEGORY,
  JOB_SECTION_TYPE,
  APPLICATION_STATUS,
  PAYMENT_STATUS,
} from '../constants.js';

const PLACEHOLDER_PDF = 'https://res.cloudinary.com/demo/image/upload/sample_pdf.pdf';
const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

const divider = (char = '─', len = 80) => console.log(char.repeat(len));

const megaSeed = async () => {
  try {
    await connectDB();

    divider('═');
    console.log('  🚀  ULTIMATE SEED V3 — NIT KKR Recruitment Ecosystem');
    divider('═');

    // ── Wipe Everything ──────────────────────────────────────────
    console.log('  🧹 purging legacy data...');
    await Promise.all([
      AuditLog.deleteMany({}),
      Review.deleteMany({}),
      Application.deleteMany({}),
      Job.deleteMany({}),
      Notice.deleteMany({}),
      Department.deleteMany({}),
      User.deleteMany({}),
    ]);

    // ── Users ────────────────────────────────────────────────────
    console.log('  👥 creating authenticated actors...');
    const users = await User.create([
      {
        email: 'superadmin@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.SUPER_ADMIN,
        profile: { firstName: 'Director', lastName: 'Office', phone: '9000000001' },
      },
      {
        email: 'admin@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.ADMIN,
        profile: { firstName: 'Recruitment', lastName: 'Coordinator', phone: '9000000002' },
      },
      // Reviewers for different departments
      {
        email: 'rev.cs@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.REVIEWER,
        profile: { firstName: 'Dr. Ramesh', lastName: 'Kaur', phone: '9000000003' },
      },
      {
        email: 'rev.ec@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.REVIEWER,
        profile: { firstName: 'Dr. Sunita', lastName: 'Gupta', phone: '9000000004' },
      },
      // Applicants
      {
        email: 'applicant@gmail.com',
        password: 'Password@123',
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Vikram', lastName: 'Aditya', phone: '9876543210' },
      },
      {
        email: 'priya.research@gmail.com',
        password: 'Password@123',
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Priya', lastName: 'Sharma', phone: '8876543211' },
      },
      {
        email: 'amit.sc@gmail.com',
        password: 'Password@123',
        role: USER_ROLES.APPLICANT,
        profile: { firstName: 'Amit', lastName: 'Das', phone: '7876543212' },
      }
    ]);

    const admin = users.find(u => u.role === USER_ROLES.ADMIN);
    const revCS = users.find(u => u.email === 'rev.cs@nitkkr.ac.in');
    const revEC = users.find(u => u.email === 'rev.ec@nitkkr.ac.in');
    
    // ── Departments ───────────────────────────────────────────────
    console.log('  🏛️  founding institutions...');
    const departments = await Department.insertMany([
      { name: 'Computer Engineering', code: 'CS' },
      { name: 'Electronics & Communication', code: 'EC' },
      { name: 'Mechanical Engineering', code: 'ME' },
      { name: 'Physics', code: 'PH' },
    ]);

    const csDept = departments.find(d => d.code === 'CS');
    const ecDept = departments.find(d => d.code === 'EC');

    // ── Notices ───────────────────────────────────────────────────
    console.log('  📢 blasting notification board...');
    await Notice.create([
      {
        heading: 'Recruitment for Faculty Positions (ADVT/CS/2026)',
        category: 'Faculty Recruitment',
        advtNo: 'ADVT/CS/2026',
        pdfUrl: 'https://example.com/notices/cs-faculty.pdf'
      },
      {
        heading: 'Extension of last date for Guest Faculty walk-in',
        category: 'Guest & Adjunct Faculty',
        advtNo: 'WALK-IN/EC/2026',
        externalLink: 'https://nitkkr.ac.in/walk-in-updates'
      }
    ]);

    // 💼 ──────────────────────────────────────────────
    console.log('  💼 launching job postings with dynamic constraints...');
    
    // Complex Faculty Job (Most sections required)
    const facultySections = [
      { sectionType: 'personal', isMandatory: true },
      { sectionType: 'photo', isMandatory: true },
      { sectionType: 'signature', isMandatory: true },
      { sectionType: 'education', isMandatory: true, minItems: 3 },
      { sectionType: 'experience', isMandatory: true },
      { sectionType: 'publications_journal', isMandatory: false },
      { sectionType: 'publications_conference', isMandatory: false },
      { sectionType: 'phd_supervision', isMandatory: false },
      { sectionType: 'subjects_taught', isMandatory: false },
      { sectionType: 'credit_points', isMandatory: true },
      { sectionType: 'referees', isMandatory: true, minItems: 2 },
      { sectionType: 'declaration', isMandatory: true },
    ];

    // Minimal Profile Job (e.g. for Ad-hoc/Temp positions)
    const minimalSections = [
      { sectionType: 'personal', isMandatory: true },
      { sectionType: 'education', isMandatory: true, minItems: 2 },
      { sectionType: 'experience', isMandatory: false },
      { sectionType: 'photo', isMandatory: true },
      { sectionType: 'declaration', isMandatory: true },
    ];

    const jobs = await Job.create([
      {
        title: 'Assistant Professor (Grade-II) - CS',
        advertisementNo: 'ADVT/CS/2026',
        department: csDept._id,
        designation: JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II,
        payLevel: JOB_PAY_LEVEL.LEVEL_11,
        positions: 8,
        vacancies: { UR: 4, OBC: 2, SC: 1, EWS: 1, total: 8 },
        recruitmentType: JOB_RECRUITMENT_TYPE.EXTERNAL,
        categories: [JOB_CATEGORY.GEN, JOB_CATEGORY.OBC, JOB_CATEGORY.SC, JOB_CATEGORY.EWS],
        applicationFee: { general: 1500, sc_st: 750, obc: 1500, ews: 1000, pwd: 0, isRequired: true },
        description: 'Applications are invited for the post of Assistant Professor (Grade-II) in the Department of Computer Engineering. Candidates should have a strong academic record and research potential.',
        eligibilityCriteria: {
          minAge: 25,
          maxAge: 45,
          nationality: ['Indian'],
          minExperience: 0,
          requiredDegrees: [
            { level: 'PhD', field: 'Computer Science/Engineering', isMandatory: true }
          ]
        },
        requiredSections: facultySections,
        assignedReviewers: [revCS._id],
        status: JOB_STATUS.PUBLISHED,
        applicationStartDate: new Date(),
        applicationEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        createdBy: admin._id
      },
      {
        title: 'Guest Faculty - Electronics',
        advertisementNo: 'WALK-IN/EC/2026',
        department: ecDept._id,
        designation: JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II, // Using valid enum value
        payLevel: JOB_PAY_LEVEL.LEVEL_10,
        positions: 4,
        vacancies: { UR: 4, total: 4 },
        recruitmentType: JOB_RECRUITMENT_TYPE.INTERNAL, 
        categories: [JOB_CATEGORY.GEN],
        applicationFee: { general: 0, sc_st: 0, obc: 0, ews: 0, pwd: 0, isRequired: false },
        description: 'Walk-in interview for Guest Faculty in Electronics and Communication Engineering for the upcoming semester.',
        eligibilityCriteria: {
          minAge: 22,
          maxAge: 65,
          nationality: ['Indian'],
          minExperience: 0,
          requiredDegrees: [
            { level: 'Masters', field: 'Electronics/ECE', isMandatory: true }
          ]
        },
        requiredSections: minimalSections,
        assignedReviewers: [revEC._id],
        status: JOB_STATUS.PUBLISHED,
        applicationStartDate: new Date(),
        applicationEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdBy: admin._id
      }
    ]);

    // ── Applications ──────────────────────────────────────────────
    console.log('  📑 generating lifecycle applications...');

    // 1. Vikram Aditya - FULLY SUBMITTED & PAID
    const appVikram = await Application.create({
      applicationNumber: 'APP-2026-CS-001',
      userId: users.find(u => u.email === 'applicant@gmail.com')._id,
      jobId: jobs[0]._id,
      jobSnapshot: { 
        title: jobs[0].title, 
        jobCode: jobs[0].advertisementNo, 
        department: csDept.name, 
        requiredSections: jobs[0].requiredSections 
      },
      status: APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentRef: 'PI_MOCK_SUCCESS_101',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      sections: {
        personal: {
          data: { 
            name: 'Vikram Aditya', dob: '1990-05-15', gender: 'Male', category: 'GEN', 
            mobile: '9876543210', nationality: 'Indian', corrAddress: 'Flat 402, Green Valley, Kurukshetra',
            phdTitle: 'Optimization in Distributed Systems', phdUniversity: 'IIT Bombay', phdDate: '2019-08-12'
          },
          isComplete: true
        },
        education: {
          data: { 
            items: [
              { examPassed: 'PhD', discipline: 'CSE', boardUniversity: 'IIT B', yearOfPassing: '2019', marks: '9.5' },
              { examPassed: 'M.Tech', discipline: 'CSE', boardUniversity: 'NIT KKR', yearOfPassing: '2014', marks: '88%' }
            ]
          },
          isComplete: true
        },
        credit_points: {
          data: { totalCreditsClaimed: 55, manualActivities: [{ activityId: '1', description: 'Journal Papers', claimedPoints: 40 }] },
          isComplete: true
        },
        photo: { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        signature: { imageUrl: PLACEHOLDER_IMAGE, isComplete: true },
        documents: { pdfUrl: PLACEHOLDER_PDF, isComplete: true },
        declaration: { data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true }, isComplete: true }
      }
    });

    // 2. Priya Sharma - SUBMITTED & EXEMPTED (Female Category)
    await Application.create({
      applicationNumber: 'APP-2026-CS-002',
      userId: users.find(u => u.email === 'priya.research@gmail.com')._id,
      jobId: jobs[0]._id,
      jobSnapshot: { 
        title: jobs[0].title, 
        jobCode: jobs[0].advertisementNo, 
        department: csDept.name, 
        requiredSections: jobs[0].requiredSections 
      },
      status: APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.EXEMPTED,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assignedReviewers: [revCS._id],
      sections: {
        personal: {
          data: { name: 'Priya Sharma', gender: 'Female', category: 'OBC', mobile: '8876543211' },
          isComplete: true
        },
        education: {
            data: { items: [{ examPassed: 'PhD', boardUniversity: 'Delhi University', yearOfPassing: '2021' }] },
            isComplete: true
        },
        declaration: { data: { declareInfoTrue: true, agreeToTerms: true, photoUploaded: true, detailsVerified: true }, isComplete: true }
      }
    });

    // 3. Amit Das - DRAFT (Partial Data)
    await Application.create({
      applicationNumber: 'APP-2026-EC-003',
      userId: users.find(u => u.email === 'amit.sc@gmail.com')._id,
      jobId: jobs[1]._id,
      jobSnapshot: { 
        title: jobs[1].title, 
        jobCode: jobs[1].advertisementNo, 
        department: ecDept.name, 
        requiredSections: jobs[1].requiredSections 
      },
      status: APPLICATION_STATUS.DRAFT,
      paymentStatus: PAYMENT_STATUS.PENDING,
      sections: {
        personal: {
          data: { name: 'Amit Das', gender: 'Male', category: 'SC' },
          isComplete: false
        }
      }
    });

    // ── Reviews ───────────────────────────────────────────────────
    console.log('  ⚖️  performing peer evaluations...');
    await Review.create({
      reviewerId: revCS._id,
      applicationId: appVikram._id,
      status: 'SUBMITTED',
      scorecard: {
        academicScore: 49,
        researchScore: 30,
        experienceScore: 15,
        recommendation: 'RECOMMENDED',
        comments: 'Strong candidate. Research papers in high-impact journals. PhD from a Tier-1 institute.'
      }
    });

    // ── Audit Logs ───────────────────────────────────────────────
    console.log('  📝 initializing audit trails...');
    await AuditLog.create([
      {
        userId: admin._id,
        action: 'JOB_CREATED',
        resourceType: 'Job',
        resourceId: jobs[0]._id,
        ipAddress: '127.0.0.1',
        userAgent: 'SeedScript/3.0'
      },
      {
        userId: revCS._id,
        action: 'REVIEW_SUBMITTED',
        resourceType: 'Application',
        resourceId: appVikram._id,
        ipAddress: '127.0.0.1',
        userAgent: 'SeedScript/3.0'
      }
    ]);

    divider('═');
    console.log('  ✅  SENSATIONAL SEED COMPLETE');
    console.log(`  📊 Stats:`);
    console.log(`     - Actors: ${users.length}`);
    console.log(`     - Portals: ${jobs.length} (CS & EC)`);
    console.log(`     - Applications: 3 (lifecycle tested)`);
    console.log(`     - Review Data: Initialized`);
    divider('═');

    process.exit(0);
  } catch (error) {
    console.error('  ❌ SEED TERMINATED:', error);
    process.exit(1);
  }
};

megaSeed();