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
  MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
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
};

/* ---------------- RESOURCE TYPES ---------------- */

export const RESOURCE_TYPES = {
  USER: 'User',
  JOB: 'Job',
  APPLICATION: 'Application',
  NOTICE: 'Notice',
};

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
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  RESEARCH: 'research',
  PUBLICATIONS: 'publications',
  REFERENCES: 'references',
  DOCUMENTS: 'documents',
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
