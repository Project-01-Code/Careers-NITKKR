/**
 * APPLICATION CONSTANTS
 * Centralized constants for the application
 */

/* ---------------- ENVIRONMENT ---------------- */

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
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
  SERVICE_UNAVAILABLE: 503
};

/* ---------------- MESSAGES ---------------- */

export const ERROR_MESSAGES = {
  SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  FILE_UPLOAD_ERROR: 'File upload failed',
  INVALID_FILE_TYPE: 'Invalid file type. Only PDF files are allowed.',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};

/* ---------------- DATABASE ---------------- */

export const DB_NAME = 'careers-nitkkr';

export const DB_CONFIG = {
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 2,
  SERVER_SELECTION_TIMEOUT: 5000,
  SOCKET_TIMEOUT: 45000,
  AUTO_INDEX: false,
  MAX_IDLE_TIME: 10000
};

export const NOTICE_CATEGORIES = [
  'Faculty Recruitment',
  'Non-Teaching Positions',
  'Project & Research Staff',
  'Guest & Adjunct Faculty',
  'Results & Shortlisting',
  'Important Notifications',
];

/* ---------------- PAGINATION ---------------- */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 4,
  MAX_LIMIT: 100,
};

/* ---------------- RATE LIMITING ---------------- */

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
  MESSAGE: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
};

/* ---------------- CORS ---------------- */

export const CORS_OPTIONS = {
  ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  CREDENTIALS: true,
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization']
};

/* ---------------- REQUEST ---------------- */

export const REQUEST_LIMITS = {
  JSON_LIMIT: '10mb',
  URL_ENCODED_LIMIT: '10mb',
  PARAMETER_LIMIT: 1000
};