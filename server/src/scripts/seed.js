import 'dotenv/config';
import { connectDB } from '../db/connectDB.js';
import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { Notice } from '../models/notice.model.js';
import { Department } from '../models/department.model.js';
import { Application } from '../models/application.model.js';
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

const PLACEHOLDER_PDF =
  'https://res.cloudinary.com/demo/image/upload/sample_pdf.pdf';
const PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const MOCK_CLOUDINARY_ID = 'demo_placeholder_id';

const divider = (char = '─', len = 70) => console.log(char.repeat(len));
const row = (label, value) => console.log(`  ${label.padEnd(24)} ${value}`);

const megaSeed = async () => {
  try {
    await connectDB();

    // ── Wipe ─────────────────────────────────────────────────────
    await Promise.all([
      AuditLog.deleteMany({}),
      Application.deleteMany({}),
      Job.deleteMany({}),
      Notice.deleteMany({}),
      Department.deleteMany({}),
      User.deleteMany({}),
    ]);

    // ── Users ────────────────────────────────────────────────────
    const [
      superAdmin,
      ,
      ,
      standardApplicant,
      submittedApplicant,
      applicant2,
      applicant3,
    ] = await Promise.all([
      User.create({
        email: 'superadmin@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.SUPER_ADMIN,
        profile: { firstName: 'Super', lastName: 'Admin', phone: '9000000001' },
      }),
      User.create({
        email: 'admin@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.ADMIN,
        profile: {
          firstName: 'System',
          lastName: 'Admin',
          phone: '9000000002',
        },
      }),
      User.create({
        email: 'reviewer@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.REVIEWER,
        profile: {
          firstName: 'Faculty',
          lastName: 'Reviewer',
          phone: '9000000003',
        },
      }),
      User.create({
        email: 'applicant@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.APPLICANT,
        profile: {
          firstName: 'Internal',
          lastName: 'Applicant',
          phone: '9000000004',
        },
      }),
      User.create({
        email: 'submitted@gmail.com',
        password: 'Password@123',
        role: USER_ROLES.APPLICANT,
        profile: {
          firstName: 'Submitted',
          lastName: 'User',
          phone: '9000000005',
        },
      }),
      User.create({
        email: 'applicant2@gmail.com',
        password: 'Password@123',
        role: USER_ROLES.APPLICANT,
        profile: {
          firstName: 'Applicant',
          lastName: 'Two',
          phone: '9000000006',
        },
      }),
      User.create({
        email: 'applicant3@gmail.com',
        password: 'Password@123',
        role: USER_ROLES.APPLICANT,
        profile: {
          firstName: 'Applicant',
          lastName: 'Three',
          phone: '9000000007',
        },
      }),
      User.create({
        email: 'reviewer2@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.REVIEWER,
        profile: {
          firstName: 'Faculty',
          lastName: 'Reviewer Two',
          phone: '9000000008',
        },
      }),
      User.create({
        email: 'reviewer3@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.REVIEWER,
        profile: {
          firstName: 'Faculty',
          lastName: 'Reviewer Three',
          phone: '9000000009',
        },
      }),
      // Additional Admins
      User.create({
        email: 'admin2@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.ADMIN,
        profile: {
          firstName: 'Registrar',
          lastName: 'Admin',
          phone: '9000000010',
        },
      }),
      User.create({
        email: 'admin3@nitkkr.ac.in',
        password: 'Password@123',
        role: USER_ROLES.ADMIN,
        profile: {
          firstName: 'Dean',
          lastName: 'Admin',
          phone: '9000000011',
        },
      }),
    ]);

    // ── Departments ───────────────────────────────────────────────
    const departments = await Department.insertMany([
      { name: 'Computer Engineering', code: 'CO' },
      { name: 'Electronics & Communication Engineering', code: 'EC' },
      { name: 'Mechanical Engineering', code: 'ME' },
      { name: 'Civil Engineering', code: 'CE' },
      { name: 'Electrical Engineering', code: 'EE' },
      { name: 'Physics', code: 'PH' },
      { name: 'Mathematics', code: 'MA' },
    ]);
    const coDept = departments.find((d) => d.code === 'CO');

    // ── Notices ───────────────────────────────────────────────────
    await Notice.insertMany([
      {
        heading: 'Faculty Recruitment Drive 2026 - Phase 1',
        advtNo: 'NITKKR/FAC/2026/01',
        category: 'Faculty Recruitment',
        pdfUrl: PLACEHOLDER_PDF,
        cloudinaryId: MOCK_CLOUDINARY_ID,
        isActive: true,
      },
      {
        heading: 'Format for OBC/EWS Certificates',
        category: 'Important Notifications',
        pdfUrl: PLACEHOLDER_PDF,
        cloudinaryId: MOCK_CLOUDINARY_ID,
        isActive: true,
      },
      {
        heading: 'Syllabus and Pattern for Written Test',
        category: 'Important Notifications',
        isActive: false,
      },
      {
        heading: 'Shortlisted Candidates for Interview (Phase 1)',
        category: 'Results & Shortlisting',
        pdfUrl: PLACEHOLDER_PDF,
        cloudinaryId: MOCK_CLOUDINARY_ID,
        isActive: true,
      },
      {
        heading: 'Corrigendum to Advertisement No. NITKKR/FAC/2026/01',
        category: 'Important Notifications',
        pdfUrl: PLACEHOLDER_PDF,
        cloudinaryId: MOCK_CLOUDINARY_ID,
        isActive: true,
      },
      {
        heading: 'Walk-in Interview for Adhoc Faculty',
        category: 'Guest & Adjunct Faculty',
        pdfUrl: PLACEHOLDER_PDF,
        cloudinaryId: MOCK_CLOUDINARY_ID,
        isActive: true,
      },
    ]);

    // ── Jobs ──────────────────────────────────────────────────────
    const standardJobRequiredSections = Object.values(JOB_SECTION_TYPE).map(
      (type) => ({
        sectionType: type,
        isMandatory: [
          JOB_SECTION_TYPE.PERSONAL,
          JOB_SECTION_TYPE.PHOTO,
          JOB_SECTION_TYPE.SIGNATURE,
          JOB_SECTION_TYPE.EDUCATION,
          JOB_SECTION_TYPE.DECLARATION,
        ].includes(type),
        requiresPDF: [
          JOB_SECTION_TYPE.EDUCATION,
          JOB_SECTION_TYPE.EXPERIENCE,
        ].includes(type),
        pdfLabel: [
          JOB_SECTION_TYPE.EDUCATION,
          JOB_SECTION_TYPE.EXPERIENCE,
        ].includes(type)
          ? `Upload ${type} Proofs`
          : undefined,
      })
    );

    const jobsData = [];
    for (let i = 1; i <= 15; i++) {
      const dept = departments[i % departments.length];
      const isGradeI = i % 3 === 0;
      const designation = isGradeI
        ? JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_I
        : JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II;
      const payLevel = isGradeI
        ? JOB_PAY_LEVEL.LEVEL_12
        : JOB_PAY_LEVEL.LEVEL_10;
      let status = JOB_STATUS.PUBLISHED;
      if (i % 5 === 0) status = JOB_STATUS.CLOSED;
      if (i % 9 === 0) status = JOB_STATUS.DRAFT;

      jobsData.push({
        title: `${designation} (${dept.name})`,
        advertisementNo: `NITKKR/FAC/2026/${String(i).padStart(2, '0')}/${dept.code}`,
        department: dept._id,
        designation,
        payLevel,
        positions: (i % 4) + 1,
        recruitmentType:
          i % 4 === 0
            ? JOB_RECRUITMENT_TYPE.INTERNAL
            : JOB_RECRUITMENT_TYPE.EXTERNAL,
        categories: [JOB_CATEGORY.GEN, JOB_CATEGORY.OBC, JOB_CATEGORY.SC],
        applicationFee: {
          general: 1500,
          obc: 1500,
          sc_st: 750,
          ews: 1500,
          pwd: 0,
          isRequired: true,
        },
        eligibilityCriteria: {
          minAge: 21,
          maxAge: 45,
          minExperience: isGradeI ? 3 : 0,
          requiredDegrees: [
            {
              level: 'PhD',
              field: 'Relevant Specialization',
              isMandatory: true,
            },
          ],
        },
        description: `Excellent opportunity for researchers with a passion for teaching in ${dept.name}.`,
        requiredSections: standardJobRequiredSections,
        applicationStartDate: new Date(
          Date.now() - (15 - i) * 24 * 60 * 60 * 1000
        ),
        applicationEndDate:
          status === JOB_STATUS.CLOSED
            ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + (20 + i) * 24 * 60 * 60 * 1000),
        status,
        publishDate:
          status !== JOB_STATUS.DRAFT
            ? new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000)
            : undefined,
        createdBy: superAdmin._id,
      });
    }

    const jobs = await Job.insertMany(jobsData);
    const publishedJobs = jobs.filter((j) => j.status === JOB_STATUS.PUBLISHED);
    const activeJob =
      publishedJobs.find(
        (j) => j.department.toString() === coDept._id.toString()
      ) || publishedJobs[0];
    const activeJob2 = publishedJobs.length > 1 ? publishedJobs[1] : activeJob;
    const activeJob3 = publishedJobs.length > 2 ? publishedJobs[2] : activeJob;

    // ── Applications ──────────────────────────────────────────────
    const getDeptName = (deptId) =>
      departments.find((d) => d._id.toString() === deptId.toString())?.name ||
      'Department';

    // APP-2026-00001 — DRAFT (partial)
    await Application.create({
      applicationNumber: 'APP-2026-00001',
      userId: standardApplicant._id,
      jobId: activeJob._id,
      jobSnapshot: {
        title: activeJob.title,
        jobCode: activeJob.advertisementNo,
        department: coDept.name,
        requiredSections: activeJob.requiredSections,
      },
      status: APPLICATION_STATUS.DRAFT,
      sections: {
        [JOB_SECTION_TYPE.PERSONAL]: {
          data: {
            postAppliedFor: activeJob.title,
            departmentDiscipline: coDept.name,
            category: JOB_CATEGORY.GEN,
            disability: false,
            name: 'Standard Applicant',
            dob: '1994-05-14',
            fatherName: 'Mr. Applicant Father',
            nationality: 'Indian',
            gender: 'Male',
            maritalStatus: 'Single',
            corrAddress: '123 Fake Street, Apartment 4',
            corrCity: 'Kurukshetra',
            corrDistrict: 'Kurukshetra',
            corrState: 'Haryana',
            corrPincode: '136119',
            mobile: '9876543210',
            permAddress: '123 Fake Street, Apartment 4',
            permCity: 'Kurukshetra',
            permDistrict: 'Kurukshetra',
            permState: 'Haryana',
            permPincode: '136119',
            specialization: ['Machine Learning', 'AI'],
            phdTitle: 'Deep Learning in Vision',
            phdUniversity: 'NIT Kurukshetra',
            phdDate: '2023-08-01',
            degreeFromTopInstitute: ['PhD Degree'],
          },
          savedAt: new Date(),
          isComplete: true,
        },
        [JOB_SECTION_TYPE.PHOTO]: {
          imageUrl: PLACEHOLDER_IMAGE,
          cloudinaryId: MOCK_CLOUDINARY_ID,
          savedAt: new Date(),
          isComplete: true,
        },
        [JOB_SECTION_TYPE.SIGNATURE]: {
          imageUrl: PLACEHOLDER_IMAGE,
          cloudinaryId: MOCK_CLOUDINARY_ID,
          savedAt: new Date(),
          isComplete: true,
        },
      },
    });

    // APP-2026-00002 — SUBMITTED + PAID (all sections)
    await Application.create({
      applicationNumber: 'APP-2026-00002',
      userId: submittedApplicant._id,
      jobId: activeJob._id,
      jobSnapshot: {
        title: activeJob.title,
        jobCode: activeJob.advertisementNo,
        department: coDept.name,
        requiredSections: activeJob.requiredSections,
      },
      status: APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentRef: 'pi_test_32187319283712',
      submittedAt: new Date(),
      sections: {
        [JOB_SECTION_TYPE.PERSONAL]: {
          data: {
            postAppliedFor: activeJob.title,
            departmentDiscipline: coDept.name,
            category: JOB_CATEGORY.OBC,
            disability: false,
            name: 'Submitted User',
            dob: '1990-01-01',
            fatherName: 'Mr. Sub',
            nationality: 'Indian',
            gender: 'Female',
            maritalStatus: 'Married',
            corrAddress: '456 Verified Avenue',
            corrCity: 'Delhi',
            corrDistrict: 'New Delhi',
            corrState: 'Delhi',
            corrPincode: '110001',
            mobile: '9998887776',
            permAddress: '456 Verified Avenue',
            permCity: 'Delhi',
            permDistrict: 'New Delhi',
            permState: 'Delhi',
            permPincode: '110001',
            specialization: ['Software Engineering'],
            phdTitle: 'Microservice Architectures',
            phdUniversity: 'IIT Delhi',
            phdDate: '2020-05-15',
            degreeFromTopInstitute: ['PhD Degree', 'PG Degree'],
          },
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.EDUCATION]: {
          data: {
            items: [
              {
                examPassed: 'B.Tech/BE/B.Sc',
                discipline: 'Computer Science',
                boardUniversity: 'NIT Kurukshetra',
                marks: '8.5',
                classDivision: 'First',
                yearOfPassing: '2012',
              },
              {
                examPassed: 'M.Tech/ME/M.Sc',
                discipline: 'Computer Science',
                boardUniversity: 'IIT Delhi',
                marks: '9.0',
                classDivision: 'First',
                yearOfPassing: '2015',
              },
              {
                examPassed: 'PhD',
                discipline: 'Computer Science',
                boardUniversity: 'IIT Delhi',
                marks: 'Awarded',
                classDivision: 'Completed',
                yearOfPassing: '2020',
              },
            ],
          },
          pdfUrl: PLACEHOLDER_PDF,
          cloudinaryId: MOCK_CLOUDINARY_ID,
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.EXPERIENCE]: {
          data: {
            items: [
              {
                experienceType: ['Teaching'],
                employerNameAddress: 'NIT Jalandhar',
                isPresentEmployer: true,
                designation: 'Assistant Professor',
                appointmentType: 'Regular',
                payScale: 'Level 10',
                fromDate: '2021-01-01',
                organizationType:
                  'Fully Funded Central Educational Institutions',
              },
            ],
          },
          pdfUrl: PLACEHOLDER_PDF,
          cloudinaryId: MOCK_CLOUDINARY_ID,
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.PUBLICATIONS_JOURNAL]: {
          data: {
            items: [
              {
                journalType: 'SCI / Scopus Journals',
                paperTitle: 'A Study on APIs',
                authors: 'Sub User, Jane Doe',
                isFirstAuthor: true,
                coAuthorCount: 1,
                journalName: 'IEEE Transactions',
                isPaidJournal: false,
                volume: '12',
                year: '2022',
                pages: '45-56',
              },
            ],
          },
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.REFEREES]: {
          data: {
            items: [
              {
                name: 'Prof. Alpha',
                designation: 'Professor',
                departmentAddress: 'IIT Delhi CS Dept',
                city: 'Delhi',
                pincode: '110001',
                phone: '0112345678',
                officialEmail: 'alpha@iitd.ac.in',
                personalEmail: 'alpha@gmail.com',
              },
              {
                name: 'Prof. Beta',
                designation: 'HOD',
                departmentAddress: 'NIT Jalandhar CS',
                city: 'Jalandhar',
                pincode: '144008',
                phone: '018156789',
                officialEmail: 'beta@nitj.ac.in',
                personalEmail: 'beta@gmail.com',
              },
            ],
          },
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.CREDIT_POINTS]: {
          data: {
            manualActivities: [],
            totalCreditsClaimed: 25,
            totalCreditsAllowed: 0,
          },
          autoCredits: {
            total: 25,
            breakdown: { publications: 15, experience: 10 },
          },
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.PHOTO]: {
          imageUrl: PLACEHOLDER_IMAGE,
          cloudinaryId: MOCK_CLOUDINARY_ID,
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.SIGNATURE]: {
          imageUrl: PLACEHOLDER_IMAGE,
          cloudinaryId: MOCK_CLOUDINARY_ID,
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.FINAL_DOCUMENTS]: {
          pdfUrl: PLACEHOLDER_PDF,
          cloudinaryId: MOCK_CLOUDINARY_ID,
          isComplete: true,
          savedAt: new Date(),
        },
        [JOB_SECTION_TYPE.DECLARATION]: {
          data: {
            declareInfoTrue: true,
            agreeToTerms: true,
            photoUploaded: true,
            detailsVerified: true,
          },
          isComplete: true,
          savedAt: new Date(),
        },
      },
    });

    // APP-2026-00003 — SUBMITTED + PAID (sparse, SC)
    await Application.create({
      applicationNumber: 'APP-2026-00003',
      userId: applicant2._id,
      jobId: activeJob2._id,
      jobSnapshot: {
        title: activeJob2.title,
        jobCode: activeJob2.advertisementNo,
        department: getDeptName(activeJob2.department),
        requiredSections: activeJob2.requiredSections,
      },
      status: APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentRef: 'pi_test_999888777666',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      sections: {
        [JOB_SECTION_TYPE.PERSONAL]: {
          data: {
            postAppliedFor: activeJob2.title,
            departmentDiscipline: getDeptName(activeJob2.department),
            category: JOB_CATEGORY.SC,
            name: 'Applicant Two',
            dob: '1992-02-20',
            gender: 'Male',
            nationality: 'Indian',
            corrAddress: '789 Real Street',
            mobile: '7778889990',
            degreeFromTopInstitute: [],
          },
          savedAt: new Date(),
          isComplete: true,
        },
        [JOB_SECTION_TYPE.DECLARATION]: {
          data: { declareInfoTrue: true, agreeToTerms: true },
          isComplete: true,
        },
      },
    });

    // APP-2026-00004 — SUBMITTED + PAYMENT PENDING
    await Application.create({
      applicationNumber: 'APP-2026-00004',
      userId: applicant3._id,
      jobId: activeJob3._id,
      jobSnapshot: {
        title: activeJob3.title,
        jobCode: activeJob3.advertisementNo,
        department: getDeptName(activeJob3.department),
        requiredSections: activeJob3.requiredSections,
      },
      status: APPLICATION_STATUS.SUBMITTED,
      paymentStatus: PAYMENT_STATUS.PENDING,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sections: {
        [JOB_SECTION_TYPE.PERSONAL]: {
          data: {
            postAppliedFor: activeJob3.title,
            departmentDiscipline: getDeptName(activeJob3.department),
            category: JOB_CATEGORY.GEN,
            name: 'Applicant Three',
            dob: '1995-10-10',
            gender: 'Female',
          },
          savedAt: new Date(),
          isComplete: true,
        },
      },
    });

    // APP-2026-00005 — DRAFT (same user as 00001, different job, section incomplete)
    await Application.create({
      applicationNumber: 'APP-2026-00005',
      userId: standardApplicant._id,
      jobId: activeJob2._id,
      jobSnapshot: {
        title: activeJob2.title,
        jobCode: activeJob2.advertisementNo,
        department: getDeptName(activeJob2.department),
        requiredSections: activeJob2.requiredSections,
      },
      status: APPLICATION_STATUS.DRAFT,
      sections: {
        [JOB_SECTION_TYPE.PERSONAL]: {
          data: {
            postAppliedFor: activeJob2.title,
            departmentDiscipline: getDeptName(activeJob2.department),
            category: JOB_CATEGORY.OBC,
            name: 'Standard Applicant - Second Try',
          },
          savedAt: new Date(),
          isComplete: false,
        },
      },
    });

    // APP-2026-00006 — REJECTED (same user as 00002, different job)
    await Application.create({
      applicationNumber: 'APP-2026-00006',
      userId: submittedApplicant._id,
      jobId: activeJob3._id,
      jobSnapshot: {
        title: activeJob3.title,
        jobCode: activeJob3.advertisementNo,
        department: getDeptName(activeJob3.department),
        requiredSections: activeJob3.requiredSections,
      },
      status: APPLICATION_STATUS.REJECTED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentRef: 'pi_test_old_000001',
      submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      sections: {
        [JOB_SECTION_TYPE.PERSONAL]: {
          data: {
            postAppliedFor: activeJob3.title,
            departmentDiscipline: getDeptName(activeJob3.department),
            category: JOB_CATEGORY.OBC,
            name: 'Submitted User',
          },
          savedAt: new Date(),
          isComplete: true,
        },
      },
    });

    // ── Final Summary ─────────────────────────────────────────────
    const [jobsByStatus, allApps] = await Promise.all([
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.find().populate('userId', 'email').lean(),
    ]);

    const jobStatusMap = Object.fromEntries(
      jobsByStatus.map((s) => [s._id, s.count])
    );

    divider('═');
    console.log('  🌱  MEGA SEED — NIT KKR Recruitment Portal');
    divider('═');

    console.log('\n  COLLECTIONS\n');
    row('Users', '11');
    row('Departments', '7');
    row('Notices', '6  (5 active, 1 archived)');
    row(
      'Jobs',
      `15  ·  published: ${jobStatusMap[JOB_STATUS.PUBLISHED] ?? 0}  closed: ${jobStatusMap[JOB_STATUS.CLOSED] ?? 0}  draft: ${jobStatusMap[JOB_STATUS.DRAFT] ?? 0}`
    );
    row('Applications', '6');

    console.log('\n  APPLICATIONS\n');
    console.log(
      `  ${'APP NO'.padEnd(18)} ${'USER'.padEnd(32)} ${'STATUS'.padEnd(12)} ${'PAYMENT'.padEnd(10)} JOB CODE`
    );
    divider('-', 90);
    allApps.forEach((app) =>
      console.log(
        `  ${app.applicationNumber.padEnd(18)} ${(app.userId?.email || 'Unknown').padEnd(32)} ${app.status.padEnd(12)} ${(app.paymentStatus || 'N/A').padEnd(10)} ${app.jobSnapshot?.jobCode || 'N/A'}`
      )
    );

    console.log('\n  TEST ACCOUNTS  (password: Password@123)\n');
    console.log(`  ${'ROLE'.padEnd(14)} EMAIL`);
    divider('-', 50);
    [
      ['SUPER_ADMIN', 'superadmin@nitkkr.ac.in'],
      ['ADMIN', 'admin@nitkkr.ac.in'],
      ['ADMIN', 'admin2@nitkkr.ac.in'],
      ['ADMIN', 'admin3@nitkkr.ac.in'],
      ['REVIEWER', 'reviewer@nitkkr.ac.in'],
      ['REVIEWER', 'reviewer2@nitkkr.ac.in'],
      ['REVIEWER', 'reviewer3@nitkkr.ac.in'],
      ['APPLICANT', 'applicant@nitkkr.ac.in'],
      ['APPLICANT', 'submitted@gmail.com'],
      ['APPLICANT', 'applicant2@gmail.com'],
      ['APPLICANT', 'applicant3@gmail.com'],
    ].forEach(([role, email]) => console.log(`  ${role.padEnd(14)} ${email}`));

    divider('═');
    console.log('  ✅  Seed complete.');
    divider('═');
    process.exit(0);
  } catch (error) {
    divider('═');
    console.error('  ❌  Seed failed:', error);
    divider('═');
    process.exit(1);
  }
};

megaSeed();