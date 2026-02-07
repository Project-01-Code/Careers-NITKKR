# NIT Recruitment Portal - Phased Development Plan

A production-ready backend architecture for a university recruitment portal inspired by NIT Jalandhar's section-based application system.

---

## Project Philosophy

### Application System Design
- **Section-based applications**: Personal, Education, Experience, Research, Publications, References, Documents
- **Independent section saving**: Each section can be saved as draft independently
- **PDF-per-section uploads**: Each section may require a combined PDF upload
- **Job-driven configuration**: Different jobs require different sections/documents
- **One application per job**: Unlike NIT Jalandhar (one app, multiple posts)
- **Dynamic frontend rendering**: Frontend adapts based on job requirements from backend
- **Snapshot architecture**: Application captures job requirements at creation time

### Technical Constraints
- ✅ Single flexible Application model (no per-job-type schemas)
- ✅ Production-oriented (realistic for academic institute)
- ✅ Backend-first approach
- ❌ No completion percentage logic
- ❌ No unnecessary microservices

---

## Phase 1: Foundation & Core Infrastructure

**Goal**: Establish robust foundation with authentication, file handling, and base utilities

### Backend Components

#### Models
- **User Model** (✅ Already exists - enhance)
  - Add `role` field: `['applicant', 'admin', 'reviewer']`
  - Add `profile` subdocument: `{ phone, dateOfBirth, nationality }`
  - Add `applicationIds` array reference
  - Add soft delete support: `isDeleted`, `deletedAt`

#### Utilities & Services
- **File Upload Service** (`services/upload.service.js`)
  - Cloudinary integration for PDFs
  - File validation (size, type, naming)
  - Secure URL generation
  - Delete/replace handlers
  
- **Audit Logger** (`utils/auditLogger.js`)
  - Track all admin actions
  - Log application state changes
  - Store IP, timestamp, user, action type

- **API Response Standardizer** (✅ Likely exists - verify)
  - Consistent response format
  - Error handling middleware

#### Middleware
- **Role-based Access Control** (`middlewares/rbac.middleware.js`)
  - `requireRole(['admin', 'reviewer'])`
  - `requireOwnership` (user can only access their own applications)

### Key Endpoints
```
POST   /api/auth/register          # Applicant registration
POST   /api/auth/login             # Login with role-based tokens
POST   /api/auth/refresh           # Token refresh
GET    /api/auth/profile           # Get current user profile
PATCH  /api/auth/profile           # Update profile
```

### Testable Outcomes
- ✅ User registration with role assignment
- ✅ JWT-based authentication with role claims
- ✅ File upload to Cloudinary (test with sample PDF)
- ✅ Audit log creation for critical actions
- ✅ RBAC middleware blocks unauthorized access

---

## Phase 2: Job Management System

**Goal**: Create job posting infrastructure with dynamic section requirements

### Backend Components

#### Models
- **Job Model** (`models/job.model.js`)
  ```javascript
  {
    title: String,                    // "Assistant Professor - CSE"
    jobCode: String,                  // "NITK/FAC/CSE/2026/01" (unique, indexed)
    category: String,                 // enum: Faculty, Non-Teaching, Research, Contract
    department: String,               // "Computer Science & Engineering"
    positions: Number,                // Number of vacancies
    
    // Job details
    description: String,
    qualifications: [String],
    responsibilities: [String],
    salaryRange: { min: Number, max: Number, currency: String },
    employmentType: String,           // Permanent, Contract, Temporary
    
    // Application configuration (CRITICAL)
    requiredSections: [{
      sectionType: String,            // 'personal', 'education', 'experience', etc.
      isMandatory: Boolean,
      requiresPDF: Boolean,
      pdfLabel: String,               // "Combined Education Certificates"
      maxPDFSize: Number,             // in MB
      instructions: String
    }],
    
    customFields: [{                  // Job-specific extra fields
      fieldName: String,
      fieldType: String,              // text, number, date, dropdown
      options: [String],              // for dropdown
      isMandatory: Boolean,
      section: String                 // which section this belongs to
    }],
    
    // Timeline
    applicationDeadline: Date,
    startDate: Date,
    
    // Status
    status: String,                   // draft, published, closed, cancelled
    isActive: Boolean,
    
    // Metadata
    createdBy: ObjectId (ref: User),
    publishedAt: Date,
    closedAt: Date
  }
  ```

- **Department Model** (`models/department.model.js`)
  ```javascript
  {
    name: String,                     // "Computer Science & Engineering"
    code: String,                     // "CSE"
    isActive: Boolean
  }
  ```

#### Controllers
- **Job Controller** (`controllers/job.controller.js`)
  - CRUD operations for jobs
  - Publish/unpublish logic
  - Deadline validation
  - Duplicate job code prevention

- **Public Job Controller** (`controllers/public.job.controller.js`)
  - List active jobs (with filters)
  - Get job details (public view)
  - No authentication required

#### Validators
- **Job Validators** (`validators/job.validator.js`)
  - Job creation schema (Zod/Joi)
  - Section configuration validation
  - Deadline must be future date
  - Required sections validation

### Key Endpoints

**Admin Routes** (Protected)
```
POST   /api/admin/jobs                    # Create job
GET    /api/admin/jobs                    # List all jobs (with filters)
GET    /api/admin/jobs/:id                # Get job details
PATCH  /api/admin/jobs/:id                # Update job
DELETE /api/admin/jobs/:id                # Soft delete job
POST   /api/admin/jobs/:id/publish        # Publish job
POST   /api/admin/jobs/:id/close          # Close job early
```

**Public Routes**
```
GET    /api/jobs                          # List active jobs (category, dept filters)
GET    /api/jobs/:jobCode                 # Get job details by code
GET    /api/jobs/categories               # Get job categories
GET    /api/departments                   # List departments
```

### Testable Outcomes
- ✅ Admin can create job with section requirements
- ✅ Job code uniqueness enforced
- ✅ Cannot publish job without required fields
- ✅ Public can view only published, active jobs
- ✅ Jobs auto-close after deadline
- ✅ Filter jobs by category, department, status
- ✅ Retrieve job with full section configuration

---

## Phase 3: Application System - Core Structure

**Goal**: Implement flexible application model with snapshot architecture

### Backend Components

#### Models
- **Application Model** (`models/application.model.js`)
  ```javascript
  {
    applicationNumber: String,        // Auto-generated: "APP-2026-00001"
    
    // References
    userId: ObjectId (ref: User),
    jobId: ObjectId (ref: Job),
    
    // Job snapshot (captured at application creation)
    jobSnapshot: {
      title: String,
      jobCode: String,
      department: String,
      requiredSections: [...],        // Copy from Job.requiredSections
      customFields: [...]             // Copy from Job.customFields
    },
    
    // Application state
    status: String,                   // draft, submitted, under_review, shortlisted, rejected, selected
    submittedAt: Date,
    lastModifiedAt: Date,
    
    // Section data (flexible schema)
    sections: {
      personal: {
        data: Object,                 // Flexible JSON
        pdfUrl: String,
        cloudinaryId: String,
        savedAt: Date,
        isComplete: Boolean
      },
      education: { /* same structure */ },
      experience: { /* same structure */ },
      research: { /* same structure */ },
      publications: { /* same structure */ },
      references: { /* same structure */ },
      documents: { /* same structure */ },
      custom: { /* for job-specific sections */ }
    },
    
    // Validation
    validationErrors: [{
      section: String,
      field: String,
      message: String
    }],
    
    // Locking
    isLocked: Boolean,                // True after final submission
    lockedAt: Date,
    
    // Review (for admin)
    reviewNotes: String,
    reviewedBy: ObjectId (ref: User),
    reviewedAt: Date,
    
    // Audit
    statusHistory: [{
      status: String,
      changedBy: ObjectId (ref: User),
      changedAt: Date,
      remarks: String
    }]
  }
  ```

#### Services
- **Application Service** (`services/application.service.js`)
  - Generate unique application number
  - Snapshot job configuration
  - Validate section completeness
  - Check if all mandatory sections are filled
  - Lock/unlock application

#### Utilities
- **Application Number Generator** (`utils/applicationNumberGenerator.js`)
  - Format: `APP-{YEAR}-{5-digit-sequence}`
  - Atomic counter with MongoDB

### Key Endpoints

**Applicant Routes** (Protected - Applicant role)
```
POST   /api/applications                  # Create new application (snapshots job)
GET    /api/applications                  # List user's applications
GET    /api/applications/:id              # Get application details
DELETE /api/applications/:id              # Delete draft application
```

### Testable Outcomes
- ✅ User can create application for a job
- ✅ Job configuration is snapshotted at creation
- ✅ Application number is unique and sequential
- ✅ User can only view their own applications
- ✅ Cannot create duplicate application for same job
- ✅ Application status defaults to 'draft'

---

## Phase 4: Section-wise Saving & Validation

**Goal**: Enable independent section saving with validation

### Backend Components

#### Controllers
- **Application Section Controller** (`controllers/applicationSection.controller.js`)
  - Save individual section
  - Upload section PDF
  - Validate section data against job requirements
  - Mark section as complete

#### Validators
- **Section Validators** (`validators/section.validator.js`)
  - Dynamic validation based on `jobSnapshot.requiredSections`
  - Validate custom fields
  - File upload validation

#### Services
- **Section Validation Service** (`services/sectionValidation.service.js`)
  - Check mandatory fields
  - Validate data types
  - Check PDF requirements
  - Return detailed validation errors

### Key Endpoints

**Applicant Routes** (Protected)
```
PATCH  /api/applications/:id/sections/:sectionType        # Save section data
POST   /api/applications/:id/sections/:sectionType/pdf    # Upload section PDF
DELETE /api/applications/:id/sections/:sectionType/pdf    # Delete section PDF
POST   /api/applications/:id/sections/:sectionType/validate  # Validate section
```

### Testable Outcomes
- ✅ Save personal section independently
- ✅ Upload PDF for education section
- ✅ Validation errors returned for incomplete sections
- ✅ Cannot save section if application is locked
- ✅ Section `savedAt` timestamp updates
- ✅ PDF replaces previous upload
- ✅ Custom fields validated correctly

---

## Phase 5: Final Submission & Locking

**Goal**: Implement hard validation and application locking

### Backend Components

#### Controllers
- **Application Submission Controller** (`controllers/applicationSubmission.controller.js`)
  - Pre-submission validation (all mandatory sections)
  - Final submission
  - Lock application
  - Generate submission receipt

#### Services
- **Submission Validation Service** (`services/submissionValidation.service.js`)
  - Validate all sections
  - Check all mandatory PDFs uploaded
  - Verify job is still accepting applications
  - Check deadline

- **Email Service** (`services/email.service.js`) *(Optional for MVP)*
  - Send submission confirmation email
  - Include application number and job details

### Key Endpoints

**Applicant Routes** (Protected)
```
POST   /api/applications/:id/validate-all    # Pre-submission validation check
POST   /api/applications/:id/submit          # Final submission (locks application)
GET    /api/applications/:id/receipt         # Get submission receipt (PDF)
```

### Testable Outcomes
- ✅ Cannot submit with incomplete mandatory sections
- ✅ Cannot submit without required PDFs
- ✅ Cannot submit after job deadline
- ✅ Application locks after submission
- ✅ Status changes to 'submitted'
- ✅ `submittedAt` timestamp recorded
- ✅ Cannot edit locked application
- ✅ Validation returns all errors at once

---

## Phase 6: Admin Review & Management

**Goal**: Admin tools for reviewing and managing applications

### Backend Components

#### Controllers
- **Admin Application Controller** (`controllers/admin.application.controller.js`)
  - List all applications (with filters)
  - View application details
  - Update application status
  - Add review notes
  - Bulk status updates
  - Export applications (CSV/Excel)

#### Services
- **Application Export Service** (`services/applicationExport.service.js`)
  - Generate CSV/Excel with application data
  - Include section data
  - Filter by job, status, date range

#### Middleware
- **Application Access Control** (`middlewares/applicationAccess.middleware.js`)
  - Admins can view all applications
  - Applicants can only view their own

### Key Endpoints

**Admin Routes** (Protected - Admin/Reviewer role)
```
GET    /api/admin/applications                      # List all applications (filters)
GET    /api/admin/applications/:id                  # View application details
PATCH  /api/admin/applications/:id/status           # Update status
PATCH  /api/admin/applications/:id/review           # Add review notes
POST   /api/admin/applications/bulk-status          # Bulk status update
GET    /api/admin/applications/export               # Export to CSV/Excel
GET    /api/admin/jobs/:jobId/applications          # Applications for specific job
```

### Testable Outcomes
- ✅ Admin can view all applications
- ✅ Filter applications by job, status, date
- ✅ Update application status with audit trail
- ✅ Add review notes
- ✅ Bulk update status for multiple applications
- ✅ Export applications to CSV
- ✅ Status history tracks all changes
- ✅ Applicant cannot access admin routes

---

## Phase 7: Enhancements & Polish

**Goal**: Add production-ready features and optimizations

### Backend Components

#### Features to Add

1. **Application Dashboard Statistics** (`controllers/dashboard.controller.js`)
   - Total applications per job
   - Status breakdown (submitted, under review, etc.)
   - Applications by department
   - Timeline charts (applications over time)

2. **Search & Advanced Filters**
   - Full-text search in applications
   - Filter by multiple criteria
   - Sort by date, status, job

3. **Deadline Reminders** (`services/reminder.service.js`)
   - Cron job to check upcoming deadlines
   - Notify users with draft applications

4. **Application Withdrawal**
   - Allow applicants to withdraw submitted applications
   - Require reason for withdrawal
   - Admin approval for withdrawal

5. **Document Verification**
   - Admin can mark documents as verified/rejected
   - Track verification status per section

6. **Notification System** (`models/notification.model.js`)
   - In-app notifications
   - Status change notifications
   - Deadline reminders

### Key Endpoints

**Dashboard Routes** (Admin)
```
GET    /api/admin/dashboard/stats                   # Overall statistics
GET    /api/admin/dashboard/jobs/:jobId/stats       # Job-specific stats
```

**Applicant Routes**
```
POST   /api/applications/:id/withdraw               # Withdraw application
GET    /api/notifications                           # Get user notifications
PATCH  /api/notifications/:id/read                  # Mark notification as read
```

**Admin Routes**
```
PATCH  /api/admin/applications/:id/verify-section   # Verify section documents
```

### Testable Outcomes
- ✅ Dashboard shows accurate statistics
- ✅ Search returns relevant applications
- ✅ Applicant can withdraw submitted application
- ✅ Notifications created on status change
- ✅ Admin can verify individual sections
- ✅ Cron job sends deadline reminders

---

## Database Indexes Strategy

### Critical Indexes
```javascript
// User Model
{ username: 1 }                          // Unique
{ email: 1 }                             // Unique
{ role: 1, isDeleted: 1 }

// Job Model
{ jobCode: 1 }                           // Unique
{ status: 1, isActive: 1, applicationDeadline: 1 }
{ category: 1, department: 1 }

// Application Model
{ applicationNumber: 1 }                 // Unique
{ userId: 1, jobId: 1 }                  // Compound (prevent duplicates)
{ status: 1, submittedAt: -1 }
{ jobId: 1, status: 1 }
{ userId: 1, status: 1 }

// Notice Model (already exists)
{ isActive: 1, createdAt: -1 }
```

---

## API Design Principles

### Consistent Response Format
```javascript
// Success
{
  success: true,
  data: { ... },
  message: "Operation successful"
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [...]
  }
}
```

### Pagination Standard
```javascript
GET /api/applications?page=1&limit=20&sortBy=createdAt&order=desc

Response:
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
    hasNext: true,
    hasPrev: false
  }
}
```

---

## Security Considerations

### Authentication & Authorization
- ✅ JWT-based authentication (already implemented)
- ✅ Role-based access control (Phase 1)
- ✅ Ownership validation (user can only access own applications)

### Data Protection
- ✅ Validate all inputs (Zod/Joi validators)
- ✅ Sanitize file uploads
- ✅ Rate limiting on API endpoints (already have express-rate-limit)
- ✅ Helmet for security headers (already implemented)

### File Upload Security
- ✅ Restrict file types (PDF only)
- ✅ Limit file size (configurable per section)
- ✅ Virus scanning (optional - ClamAV integration)
- ✅ Secure Cloudinary URLs with expiry

---

## Testing Strategy

### Unit Tests
- Model validations
- Utility functions (application number generator)
- Service layer logic

### Integration Tests
- API endpoint testing
- Authentication flows
- File upload workflows

### End-to-End Scenarios
1. **Complete Application Flow**
   - Register → Login → Create Application → Save Sections → Upload PDFs → Submit
   
2. **Admin Review Flow**
   - Login as Admin → View Applications → Update Status → Add Notes

3. **Job Lifecycle**
   - Create Job → Publish → Accept Applications → Close → Review

---

## Frontend Dependencies

### What Frontend Needs from Backend

1. **Job Configuration API**
   - `GET /api/jobs/:jobCode` returns full `requiredSections` and `customFields`
   - Frontend dynamically renders forms based on this

2. **Section Metadata**
   - Each section type has predefined fields (backend provides schema)
   - Custom fields are added dynamically

3. **Validation Feedback**
   - Real-time validation endpoint per section
   - Final validation before submission

4. **File Upload Progress**
   - Multipart upload support
   - Progress tracking

5. **Application State**
   - Current status
   - Which sections are complete
   - Validation errors per section

---

## Deployment Checklist

### Environment Variables
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGIN=https://careers.nitkkr.ac.in
```

### Production Optimizations
- ✅ Enable MongoDB connection pooling
- ✅ Use compression middleware (already have)
- ✅ Set up proper logging (Morgan already configured)
- ✅ Configure CORS for production domain
- ✅ Set up PM2 for process management
- ✅ Database backups (automated)

---

## Summary: Build Order

| Phase | Focus | Duration (Est.) | Complexity |
|-------|-------|-----------------|------------|
| 1 | Foundation & Auth | 3-4 days | Medium |
| 2 | Job Management | 4-5 days | Medium |
| 3 | Application Core | 5-6 days | High |
| 4 | Section Saving | 4-5 days | High |
| 5 | Submission & Locking | 3-4 days | Medium |
| 6 | Admin Review | 4-5 days | Medium |
| 7 | Enhancements | 5-7 days | Low-Medium |

**Total Estimated Time**: 28-36 days (1-1.5 months for solo developer)

---

## Next Steps

1. **Review this plan** - Ensure alignment with your vision
2. **Prioritize phases** - Decide if all phases are needed for MVP
3. **Set up development environment** - Ensure all dependencies installed
4. **Start with Phase 1** - Build foundation first
5. **Iterate and test** - Test each phase before moving to next

> **Note**: This plan is designed to be production-ready for an academic institute. Each phase builds upon the previous, ensuring a stable, testable system at every stage.
