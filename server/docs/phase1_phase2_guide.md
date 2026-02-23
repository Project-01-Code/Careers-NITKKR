# Phase 1 & 2 — Complete Implementation Guide

> **NIT KKR Careers Portal — Backend Server**
> Last updated: February 2026 | Status: ✅ Complete

This document is the single source of truth for what was built in Phase 1 (Foundation) and Phase 2 (Job Management). It covers the architecture, every model, every endpoint, and a step-by-step Cloudinary test.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Tech Stack & Packages](#2-tech-stack--packages)
3. [Environment Variables](#3-environment-variables)
4. [Phase 1 — Foundation](#4-phase-1--foundation)
   - [User Model](#41-user-model)
   - [Authentication System](#42-authentication-system)
   - [RBAC Middleware](#43-rbac-middleware)
   - [Audit Logging](#44-audit-logging)
   - [File Upload (Cloudinary)](#45-file-upload-cloudinary)
   - [Error Handling](#46-error-handling)
5. [Phase 2 — Job Management System](#5-phase-2--job-management-system)
   - [Department Model & API](#51-department-model--api)
   - [Notice Model & API](#52-notice-model--api)
   - [Job Model](#53-job-model)
   - [Admin Job API](#54-admin-job-api)
   - [Public Job API](#55-public-job-api)
6. [Complete API Reference](#6-complete-api-reference)
7. [Testing Cloudinary Step-by-Step](#7-testing-cloudinary-step-by-step)
8. [Testing the Full Flow (Postman)](#8-testing-the-full-flow-postman)
9. [Key Business Rules & Guards](#9-key-business-rules--guards)

---

## 1. Project Structure

```
server/
├── src/
│   ├── app.js                        # Express app, middleware, route mounting
│   ├── constants.js                  # All enums, status codes, config constants
│   ├── config/
│   │   └── cloudinary.config.js      # Cloudinary SDK initialization
│   ├── models/
│   │   ├── user.model.js             # User schema (roles, profile, soft delete)
│   │   ├── auditLog.model.js         # Audit log schema
│   │   ├── department.model.js       # Department schema
│   │   ├── notice.model.js           # Notice schema
│   │   └── job.model.js              # Job schema (rich, NIT-specific)
│   ├── controllers/
│   │   ├── auth.controller.js        # Register, Login, Logout, Profile
│   │   ├── notice.controller.js      # Notice CRUD
│   │   ├── department.controller.js  # List departments
│   │   ├── admin/
│   │   │   ├── job.controller.js     # Admin CRUD + publish/close
│   │   │   └── user.controller.js    # Admin user management
│   │   └── public/
│   │       └── job.controller.js     # Public job listing & details
│   ├── middlewares/
│   │   ├── auth.middleware.js        # verifyJWT — JWT from cookie or header
│   │   ├── rbac.middleware.js        # requireRole('admin') etc.
│   │   ├── upload.middleware.js      # multer + CloudinaryStorage
│   │   ├── validate.middleware.js    # Zod schema validation
│   │   └── error.middleware.js       # Global error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── notice.routes.js
│   │   ├── department.routes.js
│   │   ├── admin/
│   │   │   ├── job.routes.js
│   │   │   └── user.routes.js
│   │   └── public/
│   │       └── job.routes.js
│   ├── services/
│   │   └── upload.service.js         # deleteFile() helper for Cloudinary cleanup
│   ├── utils/
│   │   ├── apiError.js               # Custom ApiError class
│   │   ├── apiResponse.js            # Standardized ApiResponse class
│   │   ├── asyncHandler.js           # Wraps async controllers
│   │   └── auditLogger.js            # logAction() — saves to DB non-blocking
│   ├── validators/
│   │   ├── auth.validator.js         # Zod schemas for auth endpoints
│   │   ├── notice.validator.js       # Zod schemas for notice endpoints
│   │   └── job.validator.js          # Zod schemas for job endpoints
│   └── scripts/
│       ├── createSuperAdmin.js       # Seeds super_admin account
│       └── seedDepartments.js        # Seeds NIT KKR departments
└── docs/
    ├── architecture_implementation.md
    ├── micro_execution_plan.md
    └── phase1_phase2_guide.md        # ← This file
```

---

## 2. Tech Stack & Packages

| Category      | Library                                | Purpose                                |
| ------------- | -------------------------------------- | -------------------------------------- |
| Framework     | `express`                              | HTTP server & routing                  |
| Database      | `mongoose` + MongoDB Atlas             | ODM + cloud DB                         |
| Auth          | `jsonwebtoken`, `bcryptjs`             | JWT tokens, password hashing           |
| Validation    | `zod`                                  | Request body/param validation          |
| Upload        | `multer`, `multer-storage-cloudinary`  | Multipart form parsing + direct upload |
| Cloud Storage | `cloudinary`                           | PDF/file storage                       |
| Security      | `helmet`, `express-rate-limit`, `cors` | Security headers, rate limiting, CORS  |
| Cookie        | `cookie-parser`                        | Read/write HTTP-only cookies           |
| Logging       | `morgan`                               | HTTP request logs                      |
| Performance   | `compression`                          | Gzip response compression              |

---

## 3. Environment Variables

Create a `.env` file in `server/`:

```env
# Server
NODE_ENV=development
PORT=8000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true

# JWT Secrets (use long random strings)
ACCESS_TOKEN_SECRET=your-secret-here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-other-secret-here
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary (REQUIRED for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

> **Important**: You get CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET from your Cloudinary dashboard at [console.cloudinary.com](https://console.cloudinary.com).

---

## 4. Phase 1 — Foundation

### 4.1 User Model

**File**: `src/models/user.model.js`

The User model is the backbone of the authentication and RBAC system.

**Schema Fields**:

| Field                 | Type          | Notes                                                     |
| --------------------- | ------------- | --------------------------------------------------------- |
| `email`               | String        | Unique, lowercase, indexed                                |
| `password`            | String        | Bcrypt-hashed before save (pre-save hook)                 |
| `role`                | String (enum) | `applicant` (default), `admin`, `reviewer`, `super_admin` |
| `refreshToken`        | String        | Stored for rotation-based refresh                         |
| `deletedAt`           | Date          | `null` = active. Set on soft delete                       |
| `profile.firstName`   | String        |                                                           |
| `profile.lastName`    | String        |                                                           |
| `profile.phone`       | String        |                                                           |
| `profile.dateOfBirth` | Date          |                                                           |
| `profile.nationality` | String        | Default: "Indian"                                         |
| `applicationIds`      | ObjectId[]    | References to `Application` (Phase 3)                     |

**Methods**:

- `isPasswordCorrect(password)` → bcrypt compare
- `generateAccessToken()` → Short-lived JWT (includes `_id`, `email`, `role`)
- `generateRefreshToken()` → Long-lived JWT (includes only `_id`)
- `toJSON()` → Strips `password`, `refreshToken`, `__v` from output

**Indexes**:

- `{ email: 1, deletedAt: 1 }` — fast login lookup
- `{ role: 1, deletedAt: 1 }` — fast role-based queries

---

### 4.2 Authentication System

**File**: `src/controllers/auth.controller.js`  
**Routes**: `src/routes/auth.routes.js`  
**Base URL**: `/api/v1/auth`

Authentication uses **HTTP-only cookies** for token storage. Tokens are:

- `accessToken`: Short-lived (default: 1 day). Required for protected routes.
- `refreshToken`: Long-lived (default: 7 days). Used to rotate a new access token.

Cookie settings: `httpOnly: true`, `sameSite: strict`, `secure: true` (production only).

#### Endpoints

| Method   | Path             | Auth                       | Description                                    |
| -------- | ---------------- | -------------------------- | ---------------------------------------------- |
| `POST`   | `/register`      | None                       | Create a new applicant account                 |
| `POST`   | `/login`         | None                       | Login, get tokens via cookies                  |
| `DELETE` | `/logout`        | Required                   | Clear tokens, unset refresh token in DB        |
| `POST`   | `/refresh-token` | None (uses refresh cookie) | Get a new access token                         |
| `GET`    | `/profile`       | Required                   | Get logged-in user's profile                   |
| `PATCH`  | `/profile`       | Required                   | Update profile (name, phone, DOB, nationality) |

**Register** — only creates `applicant` role. Role is hardcoded on the server; clients cannot choose a role.

**Login** — responds with:

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "...",
      "email": "...",
      "role": "applicant",
      "profile": {}
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "message": "User logged In Successfully",
  "success": true
}
```

Tokens are also set as cookies automatically.

---

### 4.3 RBAC Middleware

**File**: `src/middlewares/rbac.middleware.js`

Two middleware functions are exported:

**`requireRole(role | role[])`** — checks that `req.user.role` matches allowed roles. Called after `verifyJWT`.

```javascript
// Single role
requireRole('admin');

// Multiple roles (any of these are allowed)
requireRole(['admin', 'super_admin']);
```

**`requireOwnership(Model, paramName)`** — verifies the resource belongs to the requesting user. Admins bypass this check automatically.

**Role Hierarchy** (higher roles have more permissions):

```
super_admin > admin > reviewer > applicant
```

> Note: Role hierarchy is **not** automatic. Each route explicitly states allowed roles.

---

### 4.4 Audit Logging

**File**: `src/utils/auditLogger.js`  
**Model**: `src/models/auditLog.model.js`

Every significant action (login, logout, job created, job published, etc.) is recorded in the `auditlogs` collection.

**Log Schema**:

```
{ userId, action, resourceType, resourceId, changes: { before, after }, ipAddress, userAgent, timestamp }
```

**`logAction({ userId, action, resourceType, resourceId, changes, req })`**

- Non-blocking: errors during audit logging are **caught and logged to console** — they do not fail the main request.
- IP is extracted from `req.ip` or `X-Forwarded-For` header.

**Recorded Actions** (from `constants.js`):

| Action Key        | Trigger                  |
| ----------------- | ------------------------ |
| `USER_REGISTERED` | New user registers       |
| `LOGIN_SUCCESS`   | Successful login         |
| `LOGIN_FAILED`    | Wrong credentials        |
| `LOGOUT`          | User logs out            |
| `PROFILE_UPDATED` | Profile is updated       |
| `JOB_CREATED`     | Admin creates a job      |
| `JOB_UPDATED`     | Admin updates a job      |
| `JOB_PUBLISHED`   | Admin publishes a job    |
| `JOB_CLOSED`      | Admin closes a job       |
| `JOB_DELETED`     | Admin soft-deletes a job |

---

### 4.5 File Upload (Cloudinary)

**Config**: `src/config/cloudinary.config.js`  
**Middleware**: `src/middlewares/upload.middleware.js`  
**Service**: `src/services/upload.service.js`

Files (PDFs only) are uploaded **directly to Cloudinary** via `multer-storage-cloudinary`. Multer never writes to disk.

**Configuration**:

- Cloudinary folder: `nit_kkr_careers`
- Resource type: `raw` (for PDFs)
- Allowed formats: `pdf` only
- Max file size: **10 MB**
- Public ID format: `notice_{timestamp}_{originalName}`

**How it works in the Notice route**:

```
Request (multipart/form-data with 'file' field)
  → upload.single('file') middleware
  → multer streams file buffer to Cloudinary
  → Cloudinary returns URL and public_id
  → req.file.path = Cloudinary URL
  → req.file.filename = Cloudinary public_id
  → Controller saves these to the Notice document
```

**Deleting files**: `src/services/upload.service.js` exports `deleteFile(publicId, resourceType)`.  
Used in `updateNotice` when a notice PDF is replaced — the old file is deleted from Cloudinary first.

---

### 4.6 Error Handling

**File**: `src/middlewares/error.middleware.js`

Central error translator. Converts raw library errors to a consistent `ApiResponse` shape.

All controllers use `asyncHandler(fn)` which catches async errors and passes them to the next middleware (the error handler).

**Handled error types**:

- `ApiError` (custom) → Used directly
- `ZodError` → Converted to `400 Bad Request` with field details
- `MongoServerError` code `11000` → Converted to `409 Conflict` (duplicate key)
- `CastError` (bad ObjectId) → Converted to `400 Bad Request`
- `JsonWebTokenError` / `TokenExpiredError` → Converted to `401 Unauthorized`

All error responses follow this shape:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Validation failed",
  "success": false,
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## 5. Phase 2 — Job Management System

### 5.1 Department Model & API

**File**: `src/models/department.model.js`  
**Routes**: `src/routes/department.routes.js`  
**Base URL**: `/api/v1/departments`

Departments represent NIT KKR departments (CSE, ECE, ME, etc.).

**Schema**: `{ name, code (unique, uppercase), isActive }`

**Endpoints**:

| Method | Path | Auth | Description                 |
| ------ | ---- | ---- | --------------------------- |
| `GET`  | `/`  | None | List all active departments |

> Departments are seeded via `scripts/seedDepartments.js`. Run `node src/scripts/seedDepartments.js` to populate them.

---

### 5.2 Notice Model & API

**File**: `src/models/notice.model.js`  
**Controller**: `src/controllers/notice.controller.js`  
**Routes**: `src/routes/notice.routes.js`  
**Base URL**: `/api/v1/notices`

Notices are announcements (recruitment notices, exam dates, etc.) — optionally with attached PDF or an external URL.

**Schema**:

| Field          | Type    | Notes                                           |
| -------------- | ------- | ----------------------------------------------- |
| `heading`      | String  | Required                                        |
| `advtNo`       | String  | Optional advertisement number                   |
| `category`     | String  | `"Faculty Recruitment"`, `"Non-Teaching"`, etc. |
| `pdfUrl`       | String  | Cloudinary URL (optional)                       |
| `cloudinaryId` | String  | Used to delete old file on update               |
| `externalLink` | String  | External URL (optional)                         |
| `isActive`     | Boolean | Default `true`. `false` = archived              |

**Endpoints**:

| Method  | Path           | Auth  | Body / Form                        | Description                                            |
| ------- | -------------- | ----- | ---------------------------------- | ------------------------------------------------------ |
| `GET`   | `/`            | None  | Query: `page`, `limit`, `category` | List active notices (paginated)                        |
| `POST`  | `/`            | Admin | `multipart/form-data`              | Create notice. Optional `file` field for PDF           |
| `PATCH` | `/:id`         | Admin | `multipart/form-data`              | Update notice. Optional new `file` to replace existing |
| `PATCH` | `/:id/archive` | Admin | None                               | Soft-archive (set `isActive = false`)                  |

---

### 5.3 Job Model

**File**: `src/models/job.model.js`

The most complex model in the system, designed specifically for NIT recruitment.

#### Sub-schemas

**`applicationFeeSchema`** — Fee by candidate category:

```
{ general, sc_st, obc, ews, pwd (all Numbers), isRequired (Boolean) }
```

**`eligibilityCriteriaSchema`**:

```
{ minAge, maxAge, ageRelaxation: { SC, ST, OBC, PwD }, nationality: [String],
  minExperience, requiredDegrees: [{ level, field, isMandatory }] }
```

**`documentSchema`** — For attached PDFs (advertisement forms, annexures):

```
{ type (ADVERTISEMENT/APPLICATION_FORM/ANNEXURE), category, label, url, publicId, uploadedAt }
```

**`requiredSectionSchema`** — Configures what sections an applicant must fill:

```
{ sectionType, isMandatory, requiresPDF, pdfLabel, maxPDFSize, instructions }
```

Section types: `personal`, `education`, `experience`, `research`, `publications`, `references`, `documents`, `custom`

**`customFieldSchema`** — Admin-defined extra fields for an application:

```
{ fieldName, fieldType (text/number/date/dropdown), options, isMandatory, section }
```

#### Main Job Schema Fields

| Field                  | Type                  | Notes                                      |
| ---------------------- | --------------------- | ------------------------------------------ |
| `title`                | String                | Required                                   |
| `advertisementNo`      | String                | Required, unique, uppercase                |
| `department`           | ObjectId → Department | Required, validated on create              |
| `designation`          | String (enum)         | See `JOB_DESIGNATIONS` in constants        |
| `grade`                | String (enum)         | Grade-I, Grade-II                          |
| `payLevel`             | String (enum)         | 10, 11, 12, 13A2, 14A                      |
| `positions`            | Number                | Min 1                                      |
| `recruitmentType`      | String                | `external` or `internal`                   |
| `categories`           | String[]              | `GEN`, `SC`, `ST`, `OBC`, `EWS`, `PwD`     |
| `applicationFee`       | Sub-doc               | Required                                   |
| `eligibilityCriteria`  | Sub-doc               | Required                                   |
| `description`          | String                | Required                                   |
| `qualifications`       | String[]              |                                            |
| `responsibilities`     | String[]              |                                            |
| `documents`            | Sub-doc[]             | Cloudinary-stored PDFs                     |
| `requiredSections`     | Sub-doc[]             | Drives application form structure          |
| `customFields`         | Sub-doc[]             | Admin-defined extra fields                 |
| `publishDate`          | Date                  | Set when published                         |
| `applicationStartDate` | Date                  | Required                                   |
| `applicationEndDate`   | Date                  | Required. Must be after start date         |
| `status`               | String (enum)         | `draft`, `published`, `closed`, `archived` |
| `closedAt`             | Date                  | Set when closed                            |
| `deletedAt`            | Date                  | Set on soft delete                         |
| `createdBy`            | ObjectId → User       | Auto-set to `req.user._id`                 |

**Virtual field** — `isActive`: `true` if `status === 'published' && !deletedAt && applicationEndDate > now`

**Pre-save validations**:

- `applicationEndDate` must be after `applicationStartDate`
- `maxAge` must be greater than `minAge`

**Indexes for performance**:

- `{ advertisementNo: 1 }` — unique
- `{ status: 1, deletedAt: 1, applicationEndDate: 1 }` — primary query for active jobs
- `{ designation: 1, payLevel: 1 }`, `{ department: 1 }`, `{ categories: 1 }`
- `{ createdAt: -1 }`, `{ publishDate: -1 }` — sorting

---

### 5.4 Admin Job API

**Controller**: `src/controllers/admin/job.controller.js`  
**Routes**: `src/routes/admin/job.routes.js`  
**Base URL**: `/api/v1/admin/jobs`  
**Auth required**: All routes need valid JWT + `admin` or `super_admin` role

| Method   | Path           | Description                                             |
| -------- | -------------- | ------------------------------------------------------- |
| `POST`   | `/`            | Create a new job (status: `draft`)                      |
| `GET`    | `/`            | List all jobs (admin view, with filters)                |
| `GET`    | `/:id`         | Get job by MongoDB ObjectId                             |
| `PATCH`  | `/:id`         | Update job (any field, except closed jobs)              |
| `DELETE` | `/:id`         | Soft delete (sets `deletedAt`)                          |
| `POST`   | `/:id/publish` | Publish job (sets `status: 'published'`, `publishDate`) |
| `POST`   | `/:id/close`   | Close job early (sets `status: 'closed'`, `closedAt`)   |

**Create Job** (`POST /`) — Validates:

- `advertisementNo` is unique
- `department` ObjectId exists and `isActive: true`
- Sets `createdBy: req.user._id`

**Publish Job** (`POST /:id/publish`) — Guards:

- Job must not already be published
- Job must have at least 1 `requiredSection` configured

**Update Job** (`PATCH /:id`) — Guards:

- Cannot update a job with `status: 'closed'`
- If `department` is being changed, verifies new department exists and is active

**Supported Query Filters for `GET /`**:
`status`, `designation`, `payLevel`, `recruitmentType`, `category`, `department`, `isActive`, `search`, `sortBy`, `sortOrder`, `page`, `limit`

---

### 5.5 Public Job API

**Controller**: `src/controllers/public/job.controller.js`  
**Routes**: `src/routes/public/job.routes.js`  
**Base URL**: `/api/v1/jobs`  
**Auth required**: None (fully public)

| Method | Path                                 | Description                                                    |
| ------ | ------------------------------------ | -------------------------------------------------------------- |
| `GET`  | `/`                                  | List active jobs (published, not deleted, deadline not passed) |
| `GET`  | `/:id`                               | Get job by MongoDB ObjectId (must be published)                |
| `GET`  | `/by-advertisement/:advertisementNo` | Get published job by advert number                             |

**Active Job Filter** (hardcoded in `getActiveJobs`):

```javascript
{
  status: 'published',
  deletedAt: null,
  applicationEndDate: { $gt: new Date() }
}
```

Sensitive fields (`createdBy`, `deletedAt`, `__v`) are excluded from public responses.

**Supported Query Filters for `GET /`**:
`designation`, `payLevel`, `recruitmentType`, `category`, `department`, `search`, `sortBy`, `sortOrder`, `page`, `limit`

---

## 6. Complete API Reference

> Base URL for all routes: `http://localhost:8000/api/v1`

### Auth Routes (`/auth`)

| Method   | Path                  | Auth   | Body                                                                    | Notes                      |
| -------- | --------------------- | ------ | ----------------------------------------------------------------------- | -------------------------- |
| `POST`   | `/auth/register`      | No     | `{ email, password }`                                                   | Creates `applicant`        |
| `POST`   | `/auth/login`         | No     | `{ email, password }`                                                   | Returns cookies + user     |
| `DELETE` | `/auth/logout`        | Cookie | —                                                                       | Clears cookies             |
| `POST`   | `/auth/refresh-token` | No     | —                                                                       | Uses `refreshToken` cookie |
| `GET`    | `/auth/profile`       | Cookie | —                                                                       | Returns current user       |
| `PATCH`  | `/auth/profile`       | Cookie | `{ profile: { firstName, lastName, phone, dateOfBirth, nationality } }` | Updates profile            |

### Department Routes (`/departments`)

| Method | Path           | Auth | Notes                       |
| ------ | -------------- | ---- | --------------------------- |
| `GET`  | `/departments` | No   | List all active departments |

### Notice Routes (`/notices`)

| Method  | Path                   | Auth  | Body Type             | Notes                                                                     |
| ------- | ---------------------- | ----- | --------------------- | ------------------------------------------------------------------------- |
| `GET`   | `/notices`             | No    | —                     | Query: `page`, `limit`, `category`                                        |
| `POST`  | `/notices`             | Admin | `multipart/form-data` | Fields: `heading`, `advtNo?`, `category?`, `externalLink?`, `file?` (PDF) |
| `PATCH` | `/notices/:id`         | Admin | `multipart/form-data` | Same fields as POST, all optional                                         |
| `PATCH` | `/notices/:id/archive` | Admin | —                     | Soft-archives the notice                                                  |

### Admin Job Routes (`/admin/jobs`)

| Method   | Path                      | Auth  | Body Type | Notes                   |
| -------- | ------------------------- | ----- | --------- | ----------------------- |
| `POST`   | `/admin/jobs`             | Admin | JSON      | Full job payload        |
| `GET`    | `/admin/jobs`             | Admin | —         | Query filters available |
| `GET`    | `/admin/jobs/:id`         | Admin | —         | By MongoDB ObjectId     |
| `PATCH`  | `/admin/jobs/:id`         | Admin | JSON      | Partial update          |
| `DELETE` | `/admin/jobs/:id`         | Admin | —         | Soft delete             |
| `POST`   | `/admin/jobs/:id/publish` | Admin | —         | Publish the job         |
| `POST`   | `/admin/jobs/:id/close`   | Admin | —         | Close the job           |

### Public Job Routes (`/jobs`)

| Method | Path                                      | Auth | Notes                                      |
| ------ | ----------------------------------------- | ---- | ------------------------------------------ |
| `GET`  | `/jobs`                                   | No   | Active jobs only. Query filters available  |
| `GET`  | `/jobs/:id`                               | No   | By MongoDB ObjectId                        |
| `GET`  | `/jobs/by-advertisement/:advertisementNo` | No   | By advert number (e.g. `NITK/FAC/2026/01`) |

### Utility Routes

| Method | Path      | Notes                          |
| ------ | --------- | ------------------------------ |
| `GET`  | `/health` | DB status, uptime, environment |

---

## 7. Testing Cloudinary Step-by-Step

Cloudinary is only used for **Notice PDF uploads**. Here is exactly how to verify it works.

### Step 1: Verify your `.env` is set

Open `server/.env` and confirm these 3 values are filled in (not placeholders):

```
CLOUDINARY_CLOUD_NAME=dxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

You can find these in your Cloudinary Dashboard → Settings → API Keys.

### Step 2: Start the server

```bash
cd server
npm run dev
```

### Step 3: Login as Admin in Postman

**Request**: `POST http://localhost:8000/api/v1/auth/login`  
**Headers**: `Content-Type: application/json`  
**Body** (JSON):

```json
{
  "email": "admin@nitkkr.ac.in",
  "password": "Admin@123"
}
```

✅ You should get `200 OK` and cookies set automatically. Verify in the "Cookies" tab that `accessToken` and `refreshToken` are present.

### Step 4: Create a Notice WITH a PDF

**Request**: `POST http://localhost:8000/api/v1/notices`  
**Auth**: Cookies from Step 3 (Postman should auto-attach)  
**Body**: Set to `form-data` (NOT JSON) in Postman, with these fields:

| Key        | Type | Value                                 |
| ---------- | ---- | ------------------------------------- |
| `heading`  | Text | `Cloudinary Test Notice`              |
| `category` | Text | `Faculty Recruitment`                 |
| `advtNo`   | Text | `NITK/TEST/CLOUD/001`                 |
| `file`     | File | _(Upload any PDF from your computer)_ |

Click **Send**.

### Step 5: Verify the Response

You should get `201 Created` with a body like:

```json
{
  "statusCode": 201,
  "data": {
    "_id": "...",
    "heading": "Cloudinary Test Notice",
    "category": "Faculty Recruitment",
    "pdfUrl": "https://res.cloudinary.com/your_cloud/raw/upload/nit_kkr_careers/notice_1739...",
    "cloudinaryId": "nit_kkr_careers/notice_1739...",
    "isActive": true
  },
  "message": "Notice created successfully",
  "success": true
}
```

✅ **If `pdfUrl` is a `https://res.cloudinary.com/...` URL** → Cloudinary is working correctly.  
✅ Open the `pdfUrl` in your browser. You should see/download the PDF.

❌ **If you get a 500 error** → Check your `.env` credentials. Common mistake: extra spaces around the `=` sign.

### Step 6: Verify Cloudinary Dashboard

Log into [console.cloudinary.com](https://console.cloudinary.com) → Media Library → `nit_kkr_careers` folder. Your uploaded file should appear there.

---

## 8. Testing the Full Flow (Postman)

This walkthrough tests the complete Phase 1 + 2 flow without needing to check the database manually.

### Environment Setup

Create a Postman environment `Careers Dev` with:

- `base_url` = `http://localhost:8000/api/v1`
- `admin_email` = `admin@nitkkr.ac.in`
- `admin_password` = `Admin@123`
- `user_email` = `testuser@example.com`
- `user_password` = `Secure@123`

Enable: **Automatically follow redirects** and **Send cookies automatically**.

---

### Flow A: Auth & Profile

| Step | Request                                                                          | Expected                        |
| ---- | -------------------------------------------------------------------------------- | ------------------------------- |
| 1    | `POST /auth/register` — `{ email: {{user_email}}, password: {{user_password}} }` | `201` — user created            |
| 2    | `POST /auth/login` — same creds                                                  | `200` — cookies set             |
| 3    | `GET /auth/profile`                                                              | `200` — user data returned      |
| 4    | `PATCH /auth/profile` — `{ profile: { firstName: "Test", lastName: "User" } }`   | `200` — profile updated         |
| 5    | `DELETE /auth/logout`                                                            | `200` — cookies cleared         |
| 6    | `GET /auth/profile`                                                              | `401` — no longer authenticated |

---

### Flow B: Notice Management (Admin)

Login as admin first (`POST /auth/login` with admin creds).

| Step | Request                                                  | Expected                             |
| ---- | -------------------------------------------------------- | ------------------------------------ |
| 1    | `POST /notices` (form-data, with PDF)                    | `201` — `pdfUrl` is a Cloudinary URL |
| 2    | `POST /notices` (form-data, NO PDF, with `externalLink`) | `201` — notice with external link    |
| 3    | `GET /notices`                                           | `200` — both notices visible         |
| 4    | `PATCH /notices/:id/archive`                             | `200` — `isActive: false`            |
| 5    | `GET /notices`                                           | `200` — archived notice gone         |

---

### Flow C: Job Lifecycle (Admin → Public)

Get Department ID first: `GET /departments` → copy an `_id`.

**Create Job** — `POST /admin/jobs` (JSON):

```json
{
  "title": "Assistant Professor - Computer Science",
  "advertisementNo": "NITK/FAC/2026/CSE/001",
  "department": "<department_id_from_above>",
  "designation": "Assistant Professor Grade-II",
  "payLevel": "10",
  "positions": 3,
  "recruitmentType": "external",
  "categories": ["GEN", "SC", "OBC"],
  "applicationFee": {
    "general": 1000,
    "sc_st": 0,
    "obc": 500,
    "ews": 500,
    "pwd": 0,
    "isRequired": true
  },
  "eligibilityCriteria": {
    "minAge": 21,
    "maxAge": 60,
    "nationality": ["Indian"],
    "minExperience": 0,
    "requiredDegrees": [
      { "level": "PhD", "field": "Computer Science", "isMandatory": true }
    ]
  },
  "description": "Recruiting Assistant Professors in Computer Science & Engineering for NIT Kurukshetra. Candidates with strong research background preferred.",
  "applicationStartDate": "2026-03-01T00:00:00Z",
  "applicationEndDate": "2026-04-30T00:00:00Z",
  "requiredSections": [
    { "sectionType": "personal", "isMandatory": true },
    { "sectionType": "education", "isMandatory": true },
    { "sectionType": "research", "isMandatory": false }
  ]
}
```

| Step | Request                            | Expected                                         |
| ---- | ---------------------------------- | ------------------------------------------------ |
| 1    | `POST /admin/jobs` (above payload) | `201` — `status: "draft"`                        |
| 2    | `GET /jobs`                        | `200` — job NOT visible (still draft)            |
| 3    | `POST /admin/jobs/:id/publish`     | `200` — `status: "published"`, `publishDate` set |
| 4    | `GET /jobs`                        | `200` — job NOW visible publicly                 |
| 5    | `GET /jobs/:id`                    | `200` — full job details (no internal fields)    |
| 6    | `POST /admin/jobs/:id/close`       | `200` — `status: "closed"`, `closedAt` set       |
| 7    | `GET /jobs`                        | `200` — closed job NOT visible                   |
| 8    | `DELETE /admin/jobs/:id`           | `200` — soft deleted                             |

---

### Flow D: Security & Negative Tests

| Test                            | How                                                     | Expected                                               |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Wrong password                  | `POST /auth/login` with bad password                    | `401 Unauthorized`                                     |
| Access admin route as applicant | `POST /admin/jobs` while logged in as applicant         | `403 Forbidden`                                        |
| Missing required field          | `POST /admin/jobs` without `advertisementNo`            | `400` with field error                                 |
| Bad date range                  | Submit with `applicationEndDate < applicationStartDate` | `400` from pre-save hook                               |
| Publish without sections        | Create job, remove sections, try to publish             | `400` — "Cannot publish job without required sections" |
| Duplicate advert number         | `POST /admin/jobs` with same `advertisementNo` twice    | `409 Conflict`                                         |

---

## 9. Key Business Rules & Guards

| Rule                                                               | Where Enforced                    |
| ------------------------------------------------------------------ | --------------------------------- |
| Public registration always creates `applicant` role                | `auth.controller.js` L56          |
| Passwords are never returned in any response                       | `user.model.js` `toJSON()`        |
| Login checks for soft-deleted users (`deletedAt: null`)            | `auth.controller.js` L100         |
| CSRF protection via `sameSite: strict` cookies                     | `auth.controller.js` L18          |
| Rate limit: 100 requests per 15 mins per IP                        | `app.js` L47                      |
| Cannot create job for inactive department                          | `admin/job.controller.js` L32     |
| Cannot update a closed job                                         | `admin/job.controller.js` L182    |
| Cannot publish without required sections                           | `admin/job.controller.js` L274    |
| Public API never shows draft, deleted, or expired jobs             | `public/job.controller.js` L27-31 |
| Cloudinary auto-cleans old PDF when notice is updated              | `notice.controller.js` L134       |
| Audit logs are fire-and-forget (never block requests)              | `auditLogger.js`                  |
| All JSON responses follow `{ statusCode, data, message, success }` | `apiResponse.js`                  |
