import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './connectDB.js';
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
    JOB_FIELD_TYPE,
    JOB_DOCUMENT_TYPE,
    APPLICATION_STATUS,
} from '../constants.js';

// Placeholder Media URLs (Cloudinary Demo Assets)
const PLACEHOLDER_PDF = 'https://res.cloudinary.com/demo/image/upload/sample_pdf.pdf';
const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const MOCK_CLOUDINARY_ID = 'demo_placeholder_id';

const seed = async () => {
    try {
        await connectDB();

        console.log('🧹 Clearing existing data...');
        await AuditLog.deleteMany({});
        await Application.deleteMany({});
        await Job.deleteMany({});
        await Notice.deleteMany({});
        await Department.deleteMany({});
        await User.deleteMany({});
        console.log('✨ Database cleared.');

        // 1. Create Users
        console.log('👤 Creating Users (Super Admin, Admin, Reviewer, Applicant)...');

        const superAdmin = await User.create({
            email: 'superadmin@nitkkr.ac.in',
            password: 'SuperPassword123',
            role: USER_ROLES.SUPER_ADMIN,
            profile: {
                firstName: 'Super',
                lastName: 'Admin',
                phone: '9876543210',
            },
        });

        const admin = await User.create({
            email: 'admin@nitkkr.ac.in',
            password: 'AdminPassword123',
            role: USER_ROLES.ADMIN,
            profile: {
                firstName: 'Standard',
                lastName: 'Admin',
                phone: '9876543211',
            },
        });

        const reviewer = await User.create({
            email: 'reviewer@nitkkr.ac.in',
            password: 'ReviewerPassword123',
            role: USER_ROLES.REVIEWER,
            profile: {
                firstName: 'John',
                lastName: 'Reviewer',
                phone: '9876543212',
            },
        });

        const applicant = await User.create({
            email: 'applicant@gmail.com',
            password: 'ApplicantPassword123',
            role: USER_ROLES.APPLICANT,
            profile: {
                firstName: 'Test',
                lastName: 'Applicant',
                phone: '9876543213',
                nationality: 'Indian',
            },
        });

        // 2. Create Departments
        console.log('🏢 Creating Departments...');
        const deptsData = [
            { name: 'Computer Engineering', code: 'CO' },
            { name: 'Electronics & Communication Engineering', code: 'EC' },
            { name: 'Mechanical Engineering', code: 'ME' },
            { name: 'Civil Engineering', code: 'CE' },
            { name: 'Electrical Engineering', code: 'EE' },
            { name: 'Humanities & Social Sciences', code: 'HS' },
        ];
        const departments = await Department.insertMany(deptsData);
        const coDept = departments[0];

        // 3. Create Notices
        console.log('📝 Creating Notices...');
        const noticesData = [
            {
                heading: 'Recruitment for Faculty Positions - 2026',
                advtNo: '01/2026',
                category: 'Faculty Recruitment',
                pdfUrl: PLACEHOLDER_PDF,
                cloudinaryId: MOCK_CLOUDINARY_ID,
            },
            {
                heading: 'Instructions for Interview Call Letters',
                category: 'Important Notifications',
                externalLink: 'https://nitkkr.ac.in/notifications',
            },
        ];
        await Notice.insertMany(noticesData);

        // 4. Create Jobs
        console.log('💼 Creating Jobs...');
        const jobsData = [
            {
                title: 'Assistant Professor Grade-II',
                advertisementNo: 'CO/01/2026',
                department: coDept._id,
                designation: JOB_DESIGNATION.ASSISTANT_PROFESSOR_GRADE_II,
                payLevel: JOB_PAY_LEVEL.LEVEL_10,
                positions: 5,
                recruitmentType: JOB_RECRUITMENT_TYPE.EXTERNAL,
                categories: [JOB_CATEGORY.GEN, JOB_CATEGORY.SC, JOB_CATEGORY.ST, JOB_CATEGORY.OBC, JOB_CATEGORY.EWS],
                applicationFee: {
                    general: 1000,
                    sc_st: 500,
                    obc: 1000,
                    ews: 1000,
                    pwd: 0,
                },
                eligibilityCriteria: {
                    minAge: 18,
                    maxAge: 35,
                    minExperience: 0,
                    requiredDegrees: [
                        { level: 'Bachelors', field: 'Computer Science & Engineering', isMandatory: true },
                        { level: 'Masters', field: 'Computer Science & Engineering', isMandatory: true },
                        { level: 'PhD', field: 'Relevant Specialization', isMandatory: true },
                    ],
                },
                description: 'Applications are invited for the post of Assistant Professor (Grade-II) in the Department of Computer Engineering.',
                documents: [
                    {
                        type: JOB_DOCUMENT_TYPE.ADVERTISEMENT,
                        label: 'Full Advertisement',
                        url: PLACEHOLDER_PDF,
                        publicId: MOCK_CLOUDINARY_ID,
                    },
                ],
                requiredSections: [
                    { sectionType: JOB_SECTION_TYPE.PERSONAL, isMandatory: true },
                    { sectionType: JOB_SECTION_TYPE.PHOTO, isMandatory: true },
                    { sectionType: JOB_SECTION_TYPE.SIGNATURE, isMandatory: true },
                    { sectionType: JOB_SECTION_TYPE.EDUCATION, isMandatory: true },
                    { sectionType: JOB_SECTION_TYPE.EXPERIENCE, isMandatory: false },
                    { sectionType: JOB_SECTION_TYPE.PUBLICATIONS_JOURNAL, isMandatory: false },
                    { sectionType: JOB_SECTION_TYPE.DECLARATION, isMandatory: true },
                    { sectionType: JOB_SECTION_TYPE.FINAL_DOCUMENTS, isMandatory: true },
                ],
                customFields: [
                    {
                        fieldName: 'preferredSpecialization',
                        fieldType: JOB_FIELD_TYPE.DROPDOWN,
                        options: ['Artificial Intelligence', 'Data Science', 'Security', 'Networks'],
                        isMandatory: true,
                    },
                ],
                applicationStartDate: new Date(),
                applicationEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: JOB_STATUS.PUBLISHED,
                publishDate: new Date(),
                createdBy: superAdmin._id,
            },
        ];
        const insertedJobs = await Job.insertMany(jobsData);
        const sampleJob = insertedJobs[0];

        // 5. Create Sample Application
        console.log('📄 Creating Sample Application...');
        const application = await Application.create({
            applicationNumber: `APP-2026-00001`,
            userId: applicant._id,
            jobId: sampleJob._id,
            jobSnapshot: {
                title: sampleJob.title,
                jobCode: sampleJob.advertisementNo,
                department: coDept.name,
                requiredSections: sampleJob.requiredSections,
                customFields: sampleJob.customFields
            },
            status: APPLICATION_STATUS.DRAFT,
            sections: {
                [JOB_SECTION_TYPE.PERSONAL]: {
                    data: {
                        fatherName: 'Father Name',
                        motherName: 'Mother Name',
                        gender: 'Male',
                        category: 'GEN',
                        maritalStatus: 'Single'
                    },
                    savedAt: new Date(),
                    isComplete: true
                },
                [JOB_SECTION_TYPE.PHOTO]: {
                    imageUrl: PLACEHOLDER_IMAGE,
                    cloudinaryId: MOCK_CLOUDINARY_ID,
                    savedAt: new Date(),
                    isComplete: true
                }
            }
        });

        console.log('\n🚀 Database seeded successfully!');
        console.log('-------------------------------');
        console.log('Super Admin: superadmin@nitkkr.ac.in / SuperPassword123');
        console.log('Admin:       admin@nitkkr.ac.in / AdminPassword123');
        console.log('Reviewer:    reviewer@nitkkr.ac.in / ReviewerPassword123');
        console.log('Applicant:   applicant@gmail.com / ApplicantPassword123');
        console.log('-------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
