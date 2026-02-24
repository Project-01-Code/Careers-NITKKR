import { z } from 'zod';
import {
  GENDER,
  MARITAL_STATUS,
  INDIAN_STATES,
  EXAM_TYPE,
  APPOINTMENT_TYPE,
  ORGANIZATION_TYPE,
  EXPERIENCE_TYPE,
  JOURNAL_TYPE,
  CONFERENCE_TYPE,
  PHD_STATUS,
  PATENT_STATUS,
  PROJECT_STATUS,
  BOOK_TYPE,
  SUBJECT_LEVEL,
  DEGREE_FROM_TOP_INSTITUTE,
  JOB_CATEGORY,
  NIRF_RANK_RANGES,
} from '../constants.js';

/** Year string between 1950 and 5 years from now */
const currentYear = new Date().getFullYear();
const yearString = z
  .string()
  .regex(/^\d{4}$/, 'Must be a 4-digit year')
  .refine(
    (y) => {
      const n = parseInt(y);
      return n >= 1950 && n <= currentYear + 5;
    },
    { message: `Year must be between 1950 and ${currentYear + 5}` }
  );

/** ISO date string */
const dateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: 'Invalid date',
});

/** Indian mobile number */
const mobileRegex = z
  .string()
  .regex(
    /^[6-9]\d{9}$/,
    'Invalid Indian mobile number (10 digits, starts with 6-9)'
  );

/** Pincode */
const pincodeRegex = z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits');

/** Non-negative integer */
const nonNegativeInt = z.number().int().min(0);

export const personalSchema = z.object({
  // Personal Details
  postAppliedFor: z.string().min(1),
  departmentDiscipline: z
    .string()
    .min(1, 'Department / Discipline is required'),
  category: z.enum(Object.values(JOB_CATEGORY), {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  disability: z.boolean({ required_error: 'Disability status is required' }),
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  dob: dateString,
  fatherName: z.string().min(2, "Father's name is required"),
  nationality: z.string().min(2, 'Nationality is required'),
  gender: z.enum(GENDER, { errorMap: () => ({ message: 'Invalid gender' }) }),
  maritalStatus: z.enum(MARITAL_STATUS, {
    errorMap: () => ({ message: 'Invalid marital status' }),
  }),

  // Optional personal
  aadhar: z
    .string()
    .regex(/^\d{12}$/, 'Aadhar must be 12 digits')
    .optional()
    .or(z.literal('')),

  // Correspondence Address
  corrAddress: z.string().min(5, 'Correspondence address is required'),
  corrCity: z.string().min(1, 'City is required'),
  corrDistrict: z.string().min(1, 'District is required'),
  corrState: z.enum(INDIAN_STATES, {
    errorMap: () => ({ message: 'Select a valid state' }),
  }),
  corrPincode: pincodeRegex,
  mobile: mobileRegex,
  phone: z.string().optional().or(z.literal('')),

  // Permanent Address
  sameAsCorrespondence: z.boolean().optional(),
  permAddress: z.string().min(5, 'Permanent address is required'),
  permCity: z.string().min(1, 'City is required'),
  permDistrict: z.string().min(1, 'District is required'),
  permState: z.enum(INDIAN_STATES, {
    errorMap: () => ({ message: 'Select a valid state' }),
  }),
  permPincode: pincodeRegex,
  permPhone: z.string().optional().or(z.literal('')),

  // Other Details
  specialization: z
    .array(z.string().min(1))
    .min(1, 'At least one specialization is required')
    .max(2, 'Maximum 2 specializations allowed'),
  phdTitle: z.string().min(5, 'PhD thesis title is required'),
  phdUniversity: z.string().min(2, 'PhD University/Institution is required'),
  phdDate: dateString,
  degreeFromTopInstitute: z
    .array(z.enum(DEGREE_FROM_TOP_INSTITUTE))
    .min(1, 'Select at least one qualification'),

  // Optional
  scopusId: z.string().optional().or(z.literal('')),
  lastPromotionDate: dateString.optional().or(z.literal('')),
  lastPromotionDesignation: z.string().optional().or(z.literal('')),
  lastPromotionPayScale: z.string().optional().or(z.literal('')),
  lastPromotionDepartment: z.string().optional().or(z.literal('')),
});

// No data schema needed; image upload is file-only.
// Presence validated in submissionValidation.service via section.imageUrl existence.

const educationEntrySchema = z.object({
  examPassed: z.enum(EXAM_TYPE, {
    errorMap: () => ({ message: 'Invalid exam type' }),
  }),
  discipline: z.string().min(1, 'Discipline/Subject is required'),
  boardUniversity: z.string().min(2, 'Board/University/Institute is required'),
  marks: z.string().min(1, 'CGPA/Percentage is required'),
  classDivision: z.string().min(1, 'Class/Division is required'),
  yearOfPassing: yearString,
  nirfRanking: z
    .object({
      rank: z.enum(NIRF_RANK_RANGES).optional().or(z.literal('')),
      rankingYear: yearString.optional().or(z.literal('')),
    })
    .optional(),
});

export const educationSchema = z.object({
  items: z
    .array(educationEntrySchema)
    .min(1, 'At least one education entry is required'),
});

const experienceEntrySchema = z
  .object({
    experienceType: z
      .array(z.enum(EXPERIENCE_TYPE))
      .min(1, 'Select at least one experience type'),
    employerNameAddress: z
      .string()
      .min(5, 'Employer name and address is required'),
    isPresentEmployer: z.boolean().default(false),
    designation: z.string().min(2, 'Designation is required'),
    appointmentType: z.enum(APPOINTMENT_TYPE, {
      errorMap: () => ({ message: 'Invalid appointment type' }),
    }),
    payScale: z.string().min(1, 'Pay scale is required'),
    fromDate: dateString,
    toDate: dateString.optional().or(z.literal('')),
    organizationType: z.enum(ORGANIZATION_TYPE, {
      errorMap: () => ({ message: 'Invalid organization type' }),
    }),
  })
  .refine(
    (data) => {
      if (!data.isPresentEmployer && !data.toDate) return false;
      if (data.toDate && data.fromDate) {
        return new Date(data.toDate) >= new Date(data.fromDate);
      }
      return true;
    },
    {
      message:
        'To Date is required when not current employer, and must be after From Date',
      path: ['toDate'],
    }
  );

export const experienceSchema = z.object({
  items: z
    .array(experienceEntrySchema)
    .min(1, 'At least one experience entry is required'),
});

const journalEntrySchema = z.object({
  journalType: z.enum(JOURNAL_TYPE, {
    errorMap: () => ({ message: 'Invalid journal type' }),
  }),
  paperTitle: z.string().min(5, 'Paper title is required'),
  authors: z.string().min(2, 'Authors are required'),
  isFirstAuthor: z.boolean({
    required_error: 'Specify if you are first author',
  }),
  coAuthorCount: nonNegativeInt,
  journalName: z.string().min(2, 'Journal name is required'),
  isPaidJournal: z.boolean({
    required_error: 'Specify if journal is paid or unpaid',
  }),
  volume: z.string().min(1, 'Volume is required'),
  year: yearString,
  pages: z.string().min(1, 'Pages are required'),
});

export const publicationsJournalSchema = z.object({
  items: z.array(journalEntrySchema).min(0),
});

const conferenceEntrySchema = z.object({
  conferenceType: z.enum(CONFERENCE_TYPE, {
    errorMap: () => ({ message: 'Invalid conference type' }),
  }),
  paperTitle: z.string().min(5, 'Paper title is required'),
  authors: z.string().min(2, 'Authors are required'),
  isFirstAuthor: z.boolean({
    required_error: 'Specify if you are first author',
  }),
  coAuthorCount: nonNegativeInt,
  conferenceName: z.string().min(2, 'Conference name is required'),
  organizer: z.string().min(2, 'Organizer/Institute is required'),
  year: yearString,
  pages: z.string().min(1, 'Pages are required'),
  volume: z.string().optional().or(z.literal('')),
});

export const publicationsConferenceSchema = z.object({
  items: z.array(conferenceEntrySchema).min(0),
});

const phdEntrySchema = z.object({
  scholarName: z.string().min(2, 'Scholar name is required'),
  researchTopic: z.string().min(5, 'Research topic is required'),
  universityInstitute: z.string().min(2, 'University/Institute is required'),
  supervisors: z.string().min(2, 'Supervisor names are required'),
  isFirstSupervisor: z.boolean({
    required_error: 'Specify if you are first supervisor',
  }),
  coSupervisorCount: nonNegativeInt,
  year: yearString,
  status: z.enum(PHD_STATUS, {
    errorMap: () => ({ message: 'Invalid PhD status' }),
  }),
});

export const phdSupervisionSchema = z.object({
  items: z.array(phdEntrySchema).min(0),
});

const patentEntrySchema = z.object({
  patentTitle: z.string().min(5, 'Patent title is required'),
  inventors: z.string().min(2, 'Inventors are required'),
  isPrincipalInventor: z.boolean({
    required_error: 'Specify if you are principal inventor',
  }),
  coInventorCount: nonNegativeInt,
  year: yearString,
  status: z.enum(PATENT_STATUS, {
    errorMap: () => ({ message: 'Invalid patent status' }),
  }),
});

export const patentsSchema = z.object({
  items: z.array(patentEntrySchema).min(0),
});

const bookEntrySchema = z.object({
  type: z.enum(BOOK_TYPE, {
    errorMap: () => ({ message: 'Invalid book type' }),
  }),
  title: z.string().min(3, 'Title is required'),
  authors: z.string().min(2, 'Authors are required'),
  year: yearString,
  publisher: z.string().min(2, 'Publisher is required'),
});

export const publicationsBooksSchema = z.object({
  items: z.array(bookEntrySchema).min(0),
});

const organizedProgramEntrySchema = z
  .object({
    title: z.string().min(3, 'Program title is required'),
    fromDate: dateString,
    toDate: dateString,
    sponsoringAgency: z.string().min(2, 'Sponsoring agency is required'),
  })
  .refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: 'To Date must be on or after From Date',
    path: ['toDate'],
  });

export const organizedProgramsSchema = z.object({
  items: z.array(organizedProgramEntrySchema).min(0),
});

const sponsoredProjectEntrySchema = z.object({
  sponsoringAgency: z.string().min(2, 'Sponsoring agency is required'),
  title: z.string().min(3, 'Project title is required'),
  period: z.string().min(1, 'Period is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  piCoPI: z.string().min(2, 'PI/Co-PI details are required'),
  isPrincipalInvestigator: z.boolean({
    required_error: 'Specify if you are principal investigator',
  }),
  coInvestigatorCount: nonNegativeInt,
  status: z.enum(PROJECT_STATUS, {
    errorMap: () => ({ message: 'Invalid project status' }),
  }),
});

export const sponsoredProjectsSchema = z.object({
  items: z.array(sponsoredProjectEntrySchema).min(0),
});

const consultancyProjectEntrySchema = z.object({
  fundingAgency: z.string().min(2, 'Funding agency is required'),
  title: z.string().min(3, 'Project title is required'),
  period: z.string().min(1, 'Period is required'),
  amount: z
    .number()
    .min(0, 'Amount must be non-negative (enter in numbers only, e.g. 450000)'),
  piCoPI: z.string().min(2, 'PI/Co-PI details are required'),
  status: z.enum(PROJECT_STATUS, {
    errorMap: () => ({ message: 'Invalid project status' }),
  }),
});

export const consultancyProjectsSchema = z.object({
  items: z.array(consultancyProjectEntrySchema).min(0),
});

const subjectEntrySchema = z.object({
  category: z.enum(SUBJECT_LEVEL, {
    errorMap: () => ({ message: 'Invalid subject level' }),
  }),
  subjectName: z.string().min(2, 'Subject name is required'),
});

export const subjectsTaughtSchema = z.object({
  items: z.array(subjectEntrySchema).min(0),
});

const manualActivitySchema = z.object({
  activityId: z.number().int().min(5).max(22),
  description: z.string().min(1, 'Activity description is required'),
  claimedPoints: z.number().min(0, 'Credit points cannot be negative'),
});

export const creditPointsSchema = z.object({
  // autoCredits is computed server-side, client only reads it back
  // Client submits manualActivities (5-22) and totals
  manualActivities: z.array(manualActivitySchema).min(0),
  totalCreditsClaimed: z.number().min(0, 'Total credits cannot be negative'),
  totalCreditsAllowed: z
    .number()
    .min(0, 'Total credits allowed cannot be negative'),
});

const refereeEntrySchema = z.object({
  name: z.string().min(2, 'Referee name is required'),
  designation: z.string().min(2, 'Designation is required'),
  departmentAddress: z.string().min(5, 'Department address is required'),
  city: z.string().min(1, 'City is required'),
  pincode: pincodeRegex,
  phone: z.string().min(5, 'Phone/Fax number is required'),
  officialEmail: z.string().email('Invalid official email address'),
  personalEmail: z.string().email('Invalid personal email address'),
});

export const refereesSchema = z
  .object({
    items: z.array(refereeEntrySchema),
  })
  .refine((data) => data.items.length === 2, {
    message: 'Exactly 2 referees are required',
    path: ['items'],
  });

export const otherInfoSchema = z.object({
  strength: z.string().optional().or(z.literal('')),
  weakness: z.string().optional().or(z.literal('')),
  visionForHigherEd: z.string().optional().or(z.literal('')),
  topThreePriorities: z.string().optional().or(z.literal('')),
  preferredSubjects: z.array(z.string().min(1)).max(5).optional(),
  labInnovations: z.array(z.string().min(1)).max(2).optional(),
  otherInfo: z.string().optional().or(z.literal('')),
});

// Completeness validated via section.pdfUrl presence in submission validation.

export const declarationSchema = z.object({
  declareInfoTrue: z.literal(true, {
    errorMap: () => ({
      message: 'You must declare that the information provided is true',
    }),
  }),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
  }),
  photoUploaded: z.literal(true, {
    errorMap: () => ({
      message: 'Please confirm that you have uploaded your passport photograph',
    }),
  }),
  detailsVerified: z.literal(true, {
    errorMap: () => ({
      message: 'You must verify all details before final submission',
    }),
  }),
});

/**
 * Schema Dispatch Map
 * Used by sectionValidation.service.js
 */
export const SECTION_SCHEMAS = {
  personal: personalSchema,
  education: educationSchema,
  experience: experienceSchema,
  publications_journal: publicationsJournalSchema,
  publications_conference: publicationsConferenceSchema,
  phd_supervision: phdSupervisionSchema,
  patents: patentsSchema,
  publications_books: publicationsBooksSchema,
  organized_programs: organizedProgramsSchema,
  sponsored_projects: sponsoredProjectsSchema,
  consultancy_projects: consultancyProjectsSchema,
  subjects_taught: subjectsTaughtSchema,
  credit_points: creditPointsSchema,
  referees: refereesSchema,
  other_info: otherInfoSchema,
  declaration: declarationSchema,
  // photo, signature, final_documents: file-only, no data schema
};
