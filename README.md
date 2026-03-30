# Careers NITKKR — Faculty Recruitment Portal

<div align="center">

![NITKKR Logo](./client/src/assets/nitlogo.png)

**Full-Stack Faculty Recruitment Management System**

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19.2.0-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/express-5.2.1-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/mongodb-mongoose%209.1.5-%2347A248.svg)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/payments-razorpay-blue.svg)](https://razorpay.com/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

A comprehensive web-based recruitment management system for **National Institute of Technology, Kurukshetra (NITKKR)** that handles the entire faculty hiring lifecycle — from job posting and multi-step applications to payment processing, review assignment, and final selection.

</div>

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone <repository-url> && cd Careers-NITKKR

# 2. Install dependencies
npm install                        # root (lint/format tooling)
cd server && npm install && cd ..  # backend
cd client && npm install && cd ..  # frontend

# 3. Configure environment
cp server/.env.example server/.env   # then edit with your keys
cp client/.env.example client/.env

# 4. Seed the database (creates super-admin, sample jobs, departments)
cd server && npm run seed && cd ..

# 5. Start development
cd server && npm run dev    # Terminal 1 → http://localhost:8000
cd client && npm run dev    # Terminal 2 → http://localhost:5173
```

> **Default Super Admin** (created by seed): `superadmin@nitkkr.ac.in` / `Admin@123`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Vite)               │
│  TailwindCSS 4 · Framer Motion · React Router 7 · Axios        │
│  Context API (Auth + Application) · react-hot-toast             │
└────────────────────────────┬────────────────────────────────────┘
                             │  REST API (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express 5 + Node.js)               │
│  JWT Auth · Zod Validation · Multer Uploads · Helmet · CORS     │
│  Rate Limiting · Morgan Logging · Compression                   │
├──────────┬───────────┬───────────┬──────────────┬───────────────┤
│ MongoDB  │Cloudinary │ Razorpay  │  SendGrid    │   PDFKit      │
│(Mongoose)│ (Images)  │(Payments) │  (Email)     │ (PDF Export)  │
└──────────┴───────────┴───────────┴──────────────┴───────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.2.0 |
| | Vite | 7.3.1 |
| | TailwindCSS | 4.1.18 |
| | Framer Motion | 12.34.0 |
| | React Router DOM | 7.13.0 |
| | Axios | 1.13.5 |
| **Backend** | Express | 5.2.1 |
| | Mongoose (MongoDB) | 9.1.5 |
| | JSON Web Token | 9.0.3 |
| | Zod | 4.3.6 |
| | bcryptjs | 3.0.3 |
| | Multer | 2.0.2 |
| **Integrations** | Razorpay | 2.9.6 |
| | Cloudinary | 1.41.3 |
| | SendGrid Mail | 8.1.6 |
| | PDFKit | 0.17.2 |
| **Dev Tools** | Nodemon | 3.1.11 |
| | ESLint | 9.39.1 |
| | Prettier | 3.8.1 |

---

## 📊 Features

### 👤 User Roles (4-tier RBAC)

| Role | Capabilities |
|------|-------------|
| **Applicant** | Register, browse jobs, apply with multi-step form, upload documents, make payments, track applications |
| **Reviewer** | Review assigned applications, submit scorecards with recommendations |
| **Admin** | Create/manage jobs, manage applications, assign reviewers, publish notices, exempt fees |
| **Super Admin** | All admin powers + user role management, system-wide dashboard |

### 📝 Multi-Step Application Form (19 Sections)

The application form dynamically shows only sections required by the job:

1. **Personal Details** — Name, DOB, category, addresses, PhD info
2. **Education** — Qualifications with NIRF ranking of institutes
3. **Experience** — Teaching, industry, and research positions
4. **Referees** — Two mandatory referees with contact details
5. **Journal Publications** — SCI/Scopus papers with authorship tracking
6. **Conference Publications** — Conference papers with co-author counts
7. **Books & Monographs** — Books, chapters, monographs
8. **Patents** — Patents with status (Granted/Applied/Published)
9. **Sponsored Projects** — R&D projects with PI/Co-PI tracking
10. **Consultancy Projects** — Consultancy work with funding details
11. **PhD Supervision** — Scholar supervision (Awarded/Submitted/Ongoing)
12. **Subjects Taught** — UG/PG subjects taught
13. **Organized Programs** — FDPs, workshops, conferences organized
14. **Credit Points** — Auto-calculated + manual credit point system (Note-2 Rubric)
15. **Other Information** — Awards, recognitions, additional details
16. **Custom Fields** — Job-specific custom fields defined by admin
17. **Documents** — Photo, signature, merged PDF upload
18. **Declaration** — Terms acceptance and verification
19. **Review & Submit** — Full application summary with validation

### 💳 Payment Processing

- **Razorpay Integration** — Secure payment gateway with modal checkout
- **Category-Based Fees** — Different fees for GEN, OBC, SC/ST, EWS, PwD
- **Automatic Exemption** — Fee waived when amount resolves to ₹0
- **Payment Verification** — Server-side signature verification
- **Auto-Submit on Payment** — Application submitted immediately after successful payment

### 📊 Credit Points (Note-2 Rubric)

Auto-calculated from saved sections:
- **Activity 1**: Sponsored R&D Projects + Patents (8 pts each, PI/Co-PI split)
- **Activity 2**: Consultancy (2 pts per ₹5 lakh)
- **Activity 3**: PhD Guidance (8 pts per scholar, supervisor split)
- **Activity 4**: SCI/Scopus Journal Papers (4 pts each)
- **Activity 5**: Conference Papers (1 pt each)
- **Activities 6–22**: Manual claims with per-activity caps
- **Activities 18–19**: Books & chapters (6/2 pts)

### 🔐 Security

- JWT authentication with access + refresh token rotation
- Password hashing with bcryptjs
- Zod schema validation on all inputs
- Helmet security headers
- CORS with configurable origins
- Rate limiting (10,000 req / 15 min window)
- Application ownership verification middleware
- Role-based route protection

### 📧 Email System

- OTP-based email verification on registration
- Password reset flow with secure tokens
- SendGrid integration for transactional emails

### 📄 PDF Export

- Application summary/docket generation using PDFKit
- Downloadable by applicants after submission

---

## 📁 Project Structure

```
Careers-NITKKR/
├── package.json                        # Root: ESLint + Prettier config
├── .eslintrc.json                      # Shared ESLint rules
├── .prettierrc                         # Prettier formatting config
├── DEPLOYMENT_GUIDE.md                 # Zero-cost deployment guide
├── IMPLEMENTATION_STATUS_REPORT.md     # Feature completion tracker
│
├── client/                             # ══ FRONTEND (React + Vite) ══
│   ├── package.json                    # Frontend dependencies
│   ├── vite.config.js                  # Vite build configuration
│   ├── postcss.config.js              # PostCSS with TailwindCSS
│   ├── eslint.config.js               # Frontend ESLint config
│   ├── vercel.json                    # Vercel deployment config
│   ├── index.html                     # HTML entry point
│   ├── .env.example                   # Environment template
│   │
│   ├── public/                        # Static assets
│   │   ├── hero-bg.jpg               # Homepage hero background
│   │   ├── jubliee.jpg               # Campus image
│   │   └── logoforppt.png            # Logo variant
│   │
│   └── src/
│       ├── main.jsx                   # App entry — providers, router
│       ├── App.jsx                    # Route definitions
│       ├── index.css                  # Global styles + Tailwind imports
│       │
│       ├── assets/                    # Bundled assets
│       │   ├── nitlogo.png            # NIT Kurukshetra logo
│       │   └── react.svg              # React logo
│       │
│       ├── constants/
│       │   └── applicationConstants.js # Section type mappings, initial form data
│       │
│       ├── context/                   # React Context providers
│       │   ├── AuthContext.jsx         # Authentication state (login, register, tokens)
│       │   ├── ApplicationContext.jsx  # Application form state (formData, save, validate)
│       │   └── ApplicationContextObj.js # Context object export
│       │
│       ├── hooks/
│       │   └── useApplication.js      # Hook to consume ApplicationContext
│       │
│       ├── services/
│       │   └── api.js                 # Axios instance with interceptors & token refresh
│       │
│       ├── layouts/
│       │   ├── MainLayout.jsx         # Public layout (Navbar + Footer)
│       │   └── AdminLayout.jsx        # Admin sidebar layout
│       │
│       ├── pages/                     # Page-level route components
│       │   ├── Home.jsx               # Landing page
│       │   ├── Jobs.jsx               # Job listings with filters
│       │   ├── JobDetail.jsx          # Single job detail + apply
│       │   ├── ApplicationForm.jsx    # Multi-step application form
│       │   ├── Profile.jsx            # User dashboard + applications
│       │   ├── Login.jsx              # Login page
│       │   ├── Register.jsx           # Registration page
│       │   ├── VerifyEmail.jsx        # Email OTP verification
│       │   ├── ForgotPassword.jsx     # Password reset flow
│       │   ├── Notices.jsx            # Public notices listing
│       │   ├── Help.jsx               # Help / FAQ page
│       │   ├── PaymentSuccess.jsx     # Payment success redirect
│       │   ├── PaymentCancel.jsx      # Payment failure redirect
│       │   ├── NotFound.jsx           # 404 page
│       │   │
│       │   └── admin/                 # Admin pages
│       │       ├── AdminDashboard.jsx     # Stats overview
│       │       ├── AdminJobs.jsx          # Job management
│       │       ├── AdminJobForm.jsx       # Create/edit job
│       │       ├── AdminApplications.jsx  # Application management
│       │       ├── ApplicationReview.jsx  # Detailed application review
│       │       ├── AdminUserManagement.jsx # User role management
│       │       ├── AdminNotices.jsx       # Notice CRUD
│       │       ├── AdminFeeExemption.jsx  # Fee exemption tool
│       │       └── ReviewerQueue.jsx      # Reviewer's assigned queue
│       │
│       └── components/                # Reusable UI components
│           ├── Navbar.jsx             # Top navigation bar
│           ├── Footer.jsx             # Site footer
│           ├── JobCard.jsx            # Job listing card
│           ├── CategoryCard.jsx       # Category filter card
│           ├── Stepper.jsx            # Step navigation sidebar
│           ├── SectionLayout.jsx      # Section wrapper (title, next/back)
│           ├── OtpInput.jsx           # 6-digit OTP input
│           ├── ImageUpload.jsx        # Image upload with preview
│           ├── PdfUpload.jsx          # PDF upload component
│           ├── ProtectedRoute.jsx     # Auth guard wrapper
│           ├── CookieConsent.jsx      # GDPR cookie banner
│           │
│           ├── admin/                 # Admin-specific components
│           │   ├── AssignReviewersModal.jsx  # Reviewer assignment modal
│           │   ├── JobStatsModal.jsx         # Job statistics popup
│           │   └── ReviewScorecard.jsx       # Review score form
│           │
│           └── application-steps/     # Application form step components
│               ├── PersonalDetails.jsx        # Personal info form
│               ├── Education.jsx              # Education qualifications
│               ├── Experience.jsx             # Work experience
│               ├── Referees.jsx               # Two referees
│               ├── Publications.jsx           # Journal publications
│               ├── ConferencePublications.jsx # Conference papers
│               ├── BooksPublications.jsx      # Books & chapters
│               ├── Patents.jsx                # Patent details
│               ├── Projects.jsx               # Sponsored projects
│               ├── ConsultancyProjects.jsx    # Consultancy projects
│               ├── PhdSupervision.jsx         # PhD scholars supervised
│               ├── SubjectsTaught.jsx         # Subjects taught
│               ├── OrganizedPrograms.jsx      # Organized events
│               ├── CreditPoints.jsx           # Credit point calculation
│               ├── OtherInfo.jsx              # Additional info
│               ├── CustomFieldsSection.jsx    # Dynamic custom fields
│               ├── DocumentUpload.jsx         # Photo, signature, PDF
│               ├── Declaration.jsx            # Declaration checkboxes
│               └── ReviewSubmit.jsx           # Final review + submit
│
└── server/                             # ══ BACKEND (Express 5 + Node.js) ══
    ├── package.json                    # Backend dependencies
    ├── .env.example                   # Environment template
    │
    └── src/
        ├── index.js                   # Server entry — DB connect, listen
        ├── app.js                     # Express app setup (middleware stack)
        ├── constants.js               # Enums: roles, statuses, categories, etc.
        │
        ├── config/
        │   ├── cloudinary.config.js   # Cloudinary SDK configuration
        │   └── env.config.js          # dotenv loader
        │
        ├── db/
        │   └── connectDB.js           # MongoDB connection with Mongoose
        │
        ├── models/                    # Mongoose schemas
        │   ├── user.model.js          # User (profile, auth, roles)
        │   ├── job.model.js           # Job posting (sections, fees, eligibility)
        │   ├── application.model.js   # Application (sections Map, status)
        │   ├── payment.model.js       # Payment transactions (Razorpay)
        │   ├── review.model.js        # Review scorecards
        │   ├── notice.model.js        # Announcements / notices
        │   ├── department.model.js    # Academic departments
        │   ├── auditLog.model.js      # Audit trail entries
        │   └── verificationToken.model.js # Email verification OTPs
        │
        ├── controllers/
        │   ├── auth.controller.js                # Register, login, refresh, verify
        │   ├── application.controller.js         # CRUD for applications
        │   ├── applicationSection.controller.js  # Save/validate sections, uploads
        │   ├── applicationSubmission.controller.js # validate-all, submit, withdraw
        │   ├── payment.controller.js             # Create order, verify, webhooks
        │   ├── notice.controller.js              # Notice CRUD
        │   ├── department.controller.js          # Department listing
        │   ├── admin/                            # Admin-only controllers
        │   │   ├── dashboard.controller.js       #   Dashboard statistics
        │   │   ├── job.controller.js              #   Job CRUD + publish/close
        │   │   ├── application.controller.js      #   Application management
        │   │   ├── review.controller.js           #   Review assignment + scoring
        │   │   └── user.controller.js             #   User management + promote
        │   └── public/
        │       └── job.controller.js              # Public job listing (no auth)
        │
        ├── routes/
        │   ├── index.js               # Route aggregator (/api/v1/*)
        │   ├── auth.routes.js         # /auth — register, login, verify, etc.
        │   ├── application.routes.js  # /applications — sections, uploads, submit
        │   ├── notice.routes.js       # /notices — public + admin CRUD
        │   ├── department.routes.js   # /departments — listing
        │   ├── admin/                 # /admin/* — protected admin routes
        │   │   ├── job.routes.js      #   /admin/jobs
        │   │   ├── application.routes.js #   /admin/applications
        │   │   ├── review.routes.js   #   /admin/reviews
        │   │   ├── dashboard.routes.js #  /admin/dashboard
        │   │   └── user.routes.js     #   /admin/users
        │   └── public/               # Unauthenticated public routes
        │       ├── job.routes.js       #   /public/jobs
        │       └── payment.routes.js   #   /payments
        │
        ├── middlewares/
        │   ├── auth.middleware.js               # JWT verification (verifyJWT)
        │   ├── rbac.middleware.js               # Role-based access control
        │   ├── applicationOwnership.middleware.js # Ownership + editable guards
        │   ├── validate.middleware.js           # Zod schema validation
        │   ├── error.middleware.js              # Global error handler
        │   ├── imageUpload.middleware.js        # Multer for images (photo/sig)
        │   ├── pdfUpload.middleware.js          # Multer for PDFs
        │   └── optionalAuth.middleware.js       # Optional JWT (public routes)
        │
        ├── services/
        │   ├── email.service.js                 # SendGrid email sending
        │   ├── upload.service.js                # Cloudinary upload/delete
        │   ├── payment.service.js               # Payment business logic
        │   ├── razorpay.service.js              # Razorpay SDK integration
        │   ├── application.service.js           # Application helper logic
        │   ├── sectionValidation.service.js     # Per-section Zod validation
        │   ├── submissionValidation.service.js  # Full-app validation before submit
        │   ├── creditPoints.service.js          # Auto credit point calculation
        │   ├── pdfExport.service.js             # Application docket PDF generation
        │   └── backgroundWorker.service.js      # Background job processor
        │
        ├── validators/                # Zod schemas for request validation
        │   ├── auth.validator.js       # Register, login, password reset
        │   ├── application.validator.js # Section save, section type params
        │   ├── sections.validator.js   # Per-section data schemas (all 19)
        │   ├── job.validator.js        # Job create/update schemas
        │   ├── notice.validator.js     # Notice CRUD schemas
        │   └── adminApplication.validator.js # Admin application actions
        │
        ├── utils/
        │   ├── apiError.js             # Custom error class (status + message)
        │   ├── apiResponse.js          # Standardized API response
        │   ├── asyncHandler.js         # Async route error wrapper
        │   ├── auditLogger.js          # Audit log creation utility
        │   ├── applicationNumberGenerator.js # Unique app number generator
        │   └── pdf.utils.js            # PDF formatting helpers
        │
        ├── scripts/
        │   └── seed.js                 # Database seeder (super-admin, depts, jobs)
        │
        └── assets/                    # Server-side static assets
```

---

## 🛠️ Installation

### Prerequisites

| Requirement | Version |
|------------|---------|
| **Node.js** | ≥ 18.0.0 (LTS recommended) |
| **npm** | ≥ 8.0.0 |
| **MongoDB** | ≥ 5.0 (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) |
| **Git** | ≥ 2.30.0 |

### Environment Variables

#### Server (`server/.env`)

```env
# Server
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=careers-nitkkr

# JWT
ACCESS_TOKEN_SECRET=your-access-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary (https://console.cloudinary.com/)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SendGrid (https://app.sendgrid.com/)
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
EMAIL_FROM=your-verified-email@gmail.com

# Razorpay (https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_TMP_DIR=tmp/uploads
```

#### Client (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPPORT_EMAIL=careers@nitkkr.ac.in
VITE_APP_NAME=NIT Kurukshetra Careers
VITE_APP_VERSION=1.0.0
```

---

## ⚡ Development Commands

### Root Level
```bash
npm run format           # Format all files with Prettier
npm run lint             # Lint all files with ESLint
```

### Server (`cd server`)
```bash
npm run dev              # Start with nodemon (auto-restart on changes)
npm start                # Start production server
npm run seed             # Seed database with initial data
```

### Client (`cd client`)
```bash
npm run dev              # Start Vite dev server (HMR)
npm run build            # Production build → dist/
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
```

---

## 🌐 API Routes

All routes are prefixed with `/api/v1`.

### Public Routes (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/public/jobs` | List published jobs |
| `GET` | `/public/jobs/:id` | Get job details |
| `POST` | `/auth/register` | Register new applicant |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/verify-email` | Verify email with OTP |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset password |
| `POST` | `/auth/refresh-token` | Refresh access token |
| `GET` | `/notices` | List published notices |

### Applicant Routes (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/applications` | Create new application |
| `GET` | `/applications` | List user's applications |
| `GET` | `/applications/:id` | Get application details |
| `DELETE` | `/applications/:id` | Delete draft application |
| `PATCH` | `/applications/:id/sections/:type` | Save section data |
| `POST` | `/applications/:id/sections/:type/validate` | Validate a section |
| `POST` | `/applications/:id/sections/:type/pdf` | Upload section PDF |
| `POST` | `/applications/:id/sections/:type/image` | Upload photo/signature |
| `GET` | `/applications/:id/sections/credit_points/summary` | Get credit point summary |
| `POST` | `/applications/:id/validate-all` | Pre-submission validation |
| `POST` | `/applications/:id/submit` | Submit application |
| `POST` | `/applications/:id/withdraw` | Withdraw application |
| `GET` | `/applications/:id/docket` | Download PDF summary |
| `POST` | `/payments/create-order` | Create Razorpay order |
| `POST` | `/payments/verify-payment` | Verify payment signature |

### Admin Routes (`/admin/*`, Admin/Super Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard/stats` | Dashboard statistics |
| `POST` | `/admin/jobs` | Create job |
| `PUT` | `/admin/jobs/:id` | Update job |
| `PATCH` | `/admin/jobs/:id/publish` | Publish/close job |
| `DELETE` | `/admin/jobs/:id` | Soft-delete job |
| `GET` | `/admin/applications` | List all applications |
| `PATCH` | `/admin/applications/:id/status` | Change application status |
| `POST` | `/admin/applications/:id/assign` | Assign reviewers |
| `POST` | `/admin/reviews/:id/submit` | Submit review scorecard |
| `GET` | `/admin/users` | List users |
| `PATCH` | `/admin/users/:id/role` | Promote user role |

---

## 🚢 Deployment

The project is designed for **zero-cost deployment**:

| Service | Provider | Tier |
|---------|----------|------|
| **Frontend** | [Vercel](https://vercel.com) | Free |
| **Backend** | [Render](https://render.com) | Free |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Free (512 MB) |
| **File Storage** | [Cloudinary](https://cloudinary.com) | Free (25 GB) |
| **Email** | [SendGrid](https://sendgrid.com) | Free (100/day) |
| **Payments** | [Razorpay](https://razorpay.com) | Test mode (free) |

> See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for step-by-step instructions.

### Vercel (Frontend)
```bash
cd client
# vercel.json already configured for SPA routing
vercel --prod
```

### Render (Backend)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Set all environment variables from `server/.env.example`

---

## 🗃️ Database Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | Accounts & profiles | email, password, role, profile, refreshToken |
| **Job** | Job postings | title, department, requiredSections, customFields, applicationFee, eligibility |
| **Application** | Candidate applications | userId, jobId, sections (Map), status, applicationNumber, jobSnapshot |
| **Payment** | Payment transactions | applicationId, razorpayOrderId, amount, status |
| **Review** | Review scorecards | applicationId, reviewerId, scores, recommendation |
| **Notice** | Announcements | title, content, isPublished, priority |
| **Department** | Academic departments | name, code |
| **AuditLog** | Activity tracking | action, userId, resourceType, metadata |
| **VerificationToken** | OTP tokens | userId, otp, type, expiresAt |

---

## 🔒 Application Section Types

Server-side section type constants (used in job configuration):

```
personal · education · experience · referees · publications_journal
publications_conference · publications_books · patents
sponsored_projects · consultancy_projects · phd_supervision
subjects_taught · organized_programs · credit_points
other_info · photo · signature · final_documents · declaration · custom
```

---

## 🧪 Seed Data

Running `npm run seed` creates:

1. **Super Admin** — `superadmin@nitkkr.ac.in` / `Admin@123`
2. **Departments** — Computer Science, Electrical, Mechanical, Civil, Electronics, Mathematics, Physics, Chemistry
3. **Sample Jobs** — Pre-configured with all required sections, custom fields, and fee structures
4. **Notices** — Sample announcements

---

## 📝 Code Conventions

- **ES Modules** throughout (`"type": "module"` in both packages)
- **Prettier** for formatting (single quotes, trailing commas, 100 char width)
- **ESLint** with React hooks plugin
- **Zod** for all server-side input validation
- **asyncHandler** wrapper for all Express route handlers
- **ApiError** / **ApiResponse** for consistent error/response format
- **camelCase** keys in frontend, **snake_case** section types on backend

---

## 📄 License

Proprietary to NIT Kurukshetra. All rights reserved.

---

<div align="center">

**Last Updated**: March 2026 · **Version**: 1.0.0 · **Maintained by**: NIT Kurukshetra Development Team

</div>
