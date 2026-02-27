/**
 * APPLICATION CONSTANTS
 * Centralized constants for the application
 */

/* ---------------- ENVIRONMENT ---------------- */

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
};

/* ---------------- HTTP ---------------- */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/* ---------------- DATABASE ---------------- */

export const DB_NAME = 'careers-nitkkr';

export const DB_CONFIG = {
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 2,
  SERVER_SELECTION_TIMEOUT: 5000,
  SOCKET_TIMEOUT: 45000,
  AUTO_INDEX: false,
  MAX_IDLE_TIME: 10000,
};

/* ---------------- RATE LIMITING ---------------- */

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 10000, // limit each IP to 10000 requests per windowMs
  MESSAGE: 'Too many requests, please try again later',
};

/* ---------------- CORS ---------------- */

export const CORS_OPTIONS = {
  ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  CREDENTIALS: true,
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
};

/* ---------------- REQUEST ---------------- */

export const REQUEST_LIMITS = {
  JSON_LIMIT: '10mb',
  URL_ENCODED_LIMIT: '10mb',
  PARAMETER_LIMIT: 1000,
};

/* ---------------- USER ROLES ---------------- */

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  APPLICANT: 'applicant',
};

/* ---------------- AUDIT ACTIONS ---------------- */

export const AUDIT_ACTIONS = {
  USER_REGISTERED: 'USER_REGISTERED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  APPLICATION_WITHDRAWN: 'APPLICATION_WITHDRAWN',
  APPLICATION_STATUS_CHANGED: 'APPLICATION_STATUS_CHANGED',
};

/* ---------------- RESOURCE TYPES ---------------- */

export const RESOURCE_TYPES = {
  USER: 'User',
  JOB: 'Job',
  APPLICATION: 'Application',
  NOTICE: 'Notice',
};

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
};

export const TOKEN_TYPES = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
};

/* ---------------- APPLICATION ENUMS ---------------- */

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  EXEMPTED: 'exempted',
};

export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected',
  SELECTED: 'selected',
  WITHDRAWN: 'withdrawn',
};

/* ---------------- PAGINATION ---------------- */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const APPLICATION_STATUSES = Object.values(APPLICATION_STATUS);

/* ---------------- JOB ENUMS ---------------- */

export const JOB_DESIGNATION = {
  ASSISTANT_PROFESSOR_GRADE_II: 'Assistant Professor Grade-II',
  ASSISTANT_PROFESSOR_GRADE_I: 'Assistant Professor Grade-I',
  ASSOCIATE_PROFESSOR: 'Associate Professor',
  PROFESSOR: 'Professor',
};

export const JOB_DESIGNATIONS = Object.values(JOB_DESIGNATION);

export const JOB_GRADE = {
  GRADE_I: 'Grade-I',
  GRADE_II: 'Grade-II',
};

export const JOB_GRADES = Object.values(JOB_GRADE);

export const JOB_PAY_LEVEL = {
  LEVEL_10: '10',
  LEVEL_11: '11',
  LEVEL_12: '12',
  LEVEL_13A2: '13A2',
  LEVEL_14A: '14A',
};

export const JOB_PAY_LEVELS = Object.values(JOB_PAY_LEVEL);

export const JOB_RECRUITMENT_TYPE = {
  EXTERNAL: 'external',
  INTERNAL: 'internal',
};

export const JOB_RECRUITMENT_TYPES = Object.values(JOB_RECRUITMENT_TYPE);

export const JOB_CATEGORY = {
  GEN: 'GEN',
  SC: 'SC',
  ST: 'ST',
  OBC: 'OBC',
  EWS: 'EWS',
  PWD: 'PwD',
};

export const JOB_CATEGORIES = Object.values(JOB_CATEGORY);

export const JOB_DOCUMENT_TYPE = {
  ADVERTISEMENT: 'ADVERTISEMENT',
  APPLICATION_FORM: 'APPLICATION_FORM',
  ANNEXURE: 'ANNEXURE',
};

export const JOB_DOCUMENT_TYPES = Object.values(JOB_DOCUMENT_TYPE);

export const JOB_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
};

export const JOB_STATUSES = Object.values(JOB_STATUS);

export const JOB_SECTION_TYPE = {
  PERSONAL: 'personal',
  PHOTO: 'photo',
  SIGNATURE: 'signature',
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  PUBLICATIONS_JOURNAL: 'publications_journal',
  PUBLICATIONS_CONFERENCE: 'publications_conference',
  PHD_SUPERVISION: 'phd_supervision',
  PATENTS: 'patents',
  PUBLICATIONS_BOOKS: 'publications_books',
  ORGANIZED_PROGRAMS: 'organized_programs',
  SPONSORED_PROJECTS: 'sponsored_projects',
  CONSULTANCY_PROJECTS: 'consultancy_projects',
  SUBJECTS_TAUGHT: 'subjects_taught',
  CREDIT_POINTS: 'credit_points',
  REFEREES: 'referees',
  OTHER_INFO: 'other_info',
  FINAL_DOCUMENTS: 'final_documents',
  DECLARATION: 'declaration',
  CUSTOM: 'custom',
};

export const JOB_SECTION_TYPES = Object.values(JOB_SECTION_TYPE);

export const JOB_FIELD_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  DROPDOWN: 'dropdown',
};

export const JOB_FIELD_TYPES = Object.values(JOB_FIELD_TYPE);

export const DEGREE_LEVEL = {
  PHD: 'PhD',
  MASTERS: 'Masters',
  BACHELORS: 'Bachelors',
  DIPLOMA: 'Diploma',
};

export const DEGREE_LEVELS = Object.values(DEGREE_LEVEL);

/* ---------------- APPLICATION FORM ENUMS ---------------- */

export const GENDER = ['Male', 'Female', 'Transgender'];

export const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];

export const EXAM_TYPE = [
  'Post-Doctoral',
  'PhD',
  'M.Tech/ME/M.Sc',
  'B.Tech/BE/B.Sc',
  'Intermediate/12th',
  'Matriculation/10th',
];

export const APPOINTMENT_TYPE = [
  'Regular',
  'Adhoc',
  'Contract',
  'Guest',
  'Temporary',
];

export const ORGANIZATION_TYPE = [
  'Fully Funded Central Educational Institutions',
  'IIMs and Other Management Institutions ranked by NIRF upto 50',
  'State Educational Institutions funded by State Governments',
  'Other Educational Institutions ranked by NIRF upto 100',
  'Any Other Institute / Organization',
  'Institute / University outside India with QS/THE Ranking within 500',
];

export const EXPERIENCE_TYPE = [
  'Teaching',
  'Industry',
  'Research/Post-Doctoral',
];

export const JOURNAL_TYPE = [
  'SCI / Scopus Journals',
  'Non-SCI / Non-Scopus Journals',
];

export const CONFERENCE_TYPE = [
  'SCI Indexed Conference',
  'Scopus Indexed Conference',
  'Web of Science Conference',
  'Internationally Renowned Conference',
];

export const PHD_STATUS = ['Awarded', 'Submitted', 'Ongoing'];

export const PATENT_STATUS = [
  'Granted',
  'Applied',
  'Published',
  'Under Examination',
];

export const PROJECT_STATUS = ['Completed', 'Ongoing', 'Sanctioned'];

export const BOOK_TYPE = ['Book', 'Monograph', 'Book Chapter'];

export const SUBJECT_LEVEL = ['UG Level', 'PG Level'];

export const DEGREE_FROM_TOP_INSTITUTE = [
  'UG Degree',
  'PG Degree',
  'PhD Degree',
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export const NIRF_RANK_RANGES = [
  '1-10',
  '11-25',
  '26-50',
  '51-100',
  '101-150',
  '151-200',
  '201+',
  'Not Ranked',
];
