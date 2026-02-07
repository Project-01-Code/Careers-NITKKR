# Micro-Execution Plan

## NIT Recruitment Portal - Detailed Implementation Guide

**Purpose**: Step-by-step implementation guide for solo developer  
**Approach**: Granular, actionable tasks with clear Definition of Done  
**Audience**: Backend developer executing the architecture plan

---

## Phase 1: Foundation & Core Infrastructure

**Duration**: 3-4 days  
**Goal**: Establish authentication, file handling, RBAC, and audit logging

### Step 1.1: Enhance User Model

**Files to Modify**:

- `src/models/user.model.js`

**Tasks**:

1. Add `role` field:

   ```javascript
   role: {
     type: String,
     enum: ['applicant', 'admin', 'reviewer'],
     default: 'applicant'
   }
   ```

2. Add `profile` subdocument:

   ```javascript
   profile: {
     phone: { type: String, trim: true },
     dateOfBirth: Date,
     nationality: { type: String, default: 'Indian' }
   }
   ```

3. Add `applicationIds` array:

   ```javascript
   applicationIds: [
     {
       type: Schema.Types.ObjectId,
       ref: 'Application',
     },
   ];
   ```

4. Add soft delete fields:

   ```javascript
   isDeleted: { type: Boolean, default: false },
   deletedAt: Date
   ```

5. Add index:
   ```javascript
   userSchema.index({ role: 1, isDeleted: 1 });
   ```

**MongoDB Collections Affected**: `users`

**Definition of Done**:

- ✅ User model has role, profile, applicationIds, soft delete fields
- ✅ Index created on role and isDeleted
- ✅ Existing users still work (backward compatible)

---

### Step 1.2: Create File Upload Service

**Files to Create**:

- `src/services/upload.service.js`

**Tasks**:

1. Import dependencies:

   ```javascript
   import cloudinary from '../config/cloudinary.js';
   import { ApiError } from '../utils/ApiError.js';
   ```

2. Create `uploadPDF` function:
   - Accept file buffer, folder name, original filename
   - Upload to Cloudinary with `resource_type: 'raw'`
   - Return `{ url, cloudinaryId }`
   - Handle errors (file too large, invalid type)

3. Create `deletePDF` function:
   - Accept cloudinaryId
   - Delete from Cloudinary
   - Handle errors (file not found)

4. Create `replacePDF` function:
   - Delete old file (if exists)
   - Upload new file
   - Return new URL and ID

5. Add file validation:
   - Check MIME type (application/pdf)
   - Check file size (configurable, default 5MB)
   - Sanitize filename

**Definition of Done**:

- ✅ Can upload PDF to Cloudinary
- ✅ Can delete PDF from Cloudinary
- ✅ File validation works (rejects non-PDF, oversized files)
- ✅ Returns secure URLs

---

### Step 1.3: Create Audit Logger Utility

**Files to Create**:

- `src/utils/auditLogger.js`
- `src/models/auditLog.model.js` (optional, or use separate collection)

**Tasks**:

1. Create AuditLog model (if using MongoDB):

   ```javascript
   {
     userId: ObjectId (ref: User),
     action: String,              // 'APPLICATION_SUBMITTED', 'STATUS_CHANGED', etc.
     resourceType: String,         // 'Application', 'Job', etc.
     resourceId: ObjectId,
     changes: Object,              // { before: {...}, after: {...} }
     ipAddress: String,
     userAgent: String,
     timestamp: Date (default: Date.now)
   }
   ```

2. Create `logAction` function:

   ```javascript
   async function logAction({
     userId,
     action,
     resourceType,
     resourceId,
     changes,
     req,
   }) {
     // Extract IP from req
     // Create audit log entry
     // Save to database
   }
   ```

3. Add indexes:
   ```javascript
   auditLogSchema.index({ userId: 1, timestamp: -1 });
   auditLogSchema.index({ resourceType: 1, resourceId: 1 });
   ```

**MongoDB Collections Affected**: `auditlogs` (new)

**Definition of Done**:

- ✅ Audit logs saved to database
- ✅ Captures user, action, resource, changes, IP, timestamp
- ✅ Indexes created for efficient querying

---

### Step 1.4: Create RBAC Middleware

**Files to Create**:

- `src/middlewares/rbac.middleware.js`

**Tasks**:

1. Create `requireRole` middleware:

   ```javascript
   export const requireRole = (allowedRoles) => {
     return (req, res, next) => {
       if (!req.user) {
         throw new ApiError(401, 'Unauthorized');
       }
       if (!allowedRoles.includes(req.user.role)) {
         throw new ApiError(403, 'Forbidden: Insufficient permissions');
       }
       next();
     };
   };
   ```

2. Create `requireOwnership` middleware:
   ```javascript
   export const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
     return async (req, res, next) => {
       const resourceId = req.params[resourceIdParam];
       const resource = await resourceModel.findById(resourceId);

       if (!resource) {
         throw new ApiError(404, 'Resource not found');
       }

       if (
         resource.userId.toString() !== req.user._id.toString() &&
         req.user.role !== 'admin'
       ) {
         throw new ApiError(
           403,
           'Forbidden: You can only access your own resources'
         );
       }

       req.resource = resource; // Attach to request for controller use
       next();
     };
   };
   ```

**Definition of Done**:

- ✅ `requireRole` blocks unauthorized roles
- ✅ `requireOwnership` prevents horizontal privilege escalation
- ✅ Admin role bypasses ownership checks

---

### Step 1.5: Enhance Auth Endpoints

**Files to Modify**:

- `src/controllers/auth.controller.js`
- `src/routes/auth.routes.js`

**Tasks**:

1. Update `register` controller:
   - Accept `role` in request body (default: 'applicant')
   - Validate role (only 'applicant' allowed for public registration)
   - Save user with role

2. Update `login` controller:
   - Include `role` in JWT payload
   - Return role in response

3. Create `getProfile` controller:

   ```javascript
   export const getProfile = asyncHandler(async (req, res) => {
     const user = await User.findById(req.user._id).select(
       '-password -refreshToken'
     );
     res.json(new ApiResponse(200, user, 'Profile fetched successfully'));
   });
   ```

4. Create `updateProfile` controller:

   ```javascript
   export const updateProfile = asyncHandler(async (req, res) => {
     const { fullName, profile } = req.body;
     const user = await User.findByIdAndUpdate(
       req.user._id,
       { fullName, profile },
       { new: true, runValidators: true }
     ).select('-password -refreshToken');

     res.json(new ApiResponse(200, user, 'Profile updated successfully'));
   });
   ```

5. Add routes:
   ```javascript
   router.get('/profile', verifyJWT, getProfile);
   router.patch('/profile', verifyJWT, updateProfile);
   ```

**API Endpoints**:

- `GET /api/auth/profile` (protected)
- `PATCH /api/auth/profile` (protected)

**Definition of Done**:

- ✅ Register includes role (defaults to 'applicant')
- ✅ Login returns role in JWT
- ✅ Can fetch user profile
- ✅ Can update profile (fullName, phone, dateOfBirth, nationality)

---

### Step 1.6: Testing Phase 1

**Tasks**:

1. Test user registration with role
2. Test login returns role in token
3. Test RBAC middleware (create test route)
4. Test file upload service (upload sample PDF)
5. Test audit logger (create sample log entry)
6. Test profile endpoints

**Definition of Done**:

- ✅ All endpoints return correct status codes
- ✅ RBAC blocks unauthorized access
- ✅ File upload works end-to-end
- ✅ Audit logs created in database

---

## Phase 2: Job Management System

**Duration**: 4-5 days  
**Goal**: Create job posting infrastructure with dynamic section requirements

### Step 2.1: Create Department Model

**Files to Create**:

- `src/models/department.model.js`

**Tasks**:

1. Create schema:

   ```javascript
   {
     name: { type: String, required: true, trim: true },
     code: { type: String, required: true, unique: true, uppercase: true },
     isActive: { type: Boolean, default: true }
   }
   ```

2. Add indexes:
   ```javascript
   departmentSchema.index({ code: 1 }, { unique: true });
   departmentSchema.index({ isActive: 1 });
   ```

**MongoDB Collections Affected**: `departments` (new)

**Definition of Done**:

- ✅ Department model created
- ✅ Unique index on code
- ✅ Can create departments

---

### Step 2.2: Create Job Model

**Files to Create**:

- `src/models/job.model.js`

**Tasks**:

1. Create main schema:

   ```javascript
   {
     title: { type: String, required: true, trim: true },
     jobCode: { type: String, required: true, unique: true, trim: true },
     category: {
       type: String,
       required: true,
       enum: ['Faculty', 'Non-Teaching', 'Research', 'Contract']
     },
     department: { type: String, required: true },
     positions: { type: Number, required: true, min: 1 },

     description: { type: String, required: true },
     qualifications: [{ type: String }],
     responsibilities: [{ type: String }],
     salaryRange: {
       min: Number,
       max: Number,
       currency: { type: String, default: 'INR' }
     },
     employmentType: {
       type: String,
       enum: ['Permanent', 'Contract', 'Temporary'],
       default: 'Permanent'
     },

     requiredSections: [{
       sectionType: {
         type: String,
         enum: ['personal', 'education', 'experience', 'research', 'publications', 'references', 'documents', 'custom']
       },
       isMandatory: { type: Boolean, default: true },
       requiresPDF: { type: Boolean, default: false },
       pdfLabel: String,
       maxPDFSize: { type: Number, default: 5 }, // MB
       instructions: String
     }],

     customFields: [{
       fieldName: { type: String, required: true },
       fieldType: {
         type: String,
         enum: ['text', 'number', 'date', 'dropdown'],
         required: true
       },
       options: [String], // for dropdown
       isMandatory: { type: Boolean, default: false },
       section: { type: String, default: 'custom' }
     }],

     noticeId: { type: Schema.Types.ObjectId, ref: 'Notice' },

     applicationDeadline: { type: Date, required: true },
     startDate: Date,

     status: {
       type: String,
       enum: ['draft', 'published', 'closed', 'cancelled'],
       default: 'draft'
     },
     isActive: { type: Boolean, default: true },

     createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
     publishedAt: Date,
     closedAt: Date
   }
   ```

2. Add indexes:

   ```javascript
   jobSchema.index({ jobCode: 1 }, { unique: true });
   jobSchema.index({ status: 1, isActive: 1, applicationDeadline: 1 });
   jobSchema.index({ category: 1, department: 1 });
   jobSchema.index({ noticeId: 1 });
   ```

3. Add pre-save hook for deadline validation:
   ```javascript
   jobSchema.pre('save', function (next) {
     if (this.isNew && this.applicationDeadline <= new Date()) {
       return next(new Error('Application deadline must be in the future'));
     }
     next();
   });
   ```

**MongoDB Collections Affected**: `jobs` (new)

**Definition of Done**:

- ✅ Job model created with all fields
- ✅ Indexes created
- ✅ Deadline validation works
- ✅ requiredSections and customFields arrays functional

---

### Step 2.3: Create Job Validators

**Files to Create**:

- `src/validators/job.validator.js`

**Tasks**:

1. Create `createJobSchema` (Zod):

   ```javascript
   export const createJobSchema = z.object({
     title: z.string().min(5).max(200),
     jobCode: z.string().regex(/^[A-Z0-9\/-]+$/),
     category: z.enum(['Faculty', 'Non-Teaching', 'Research', 'Contract']),
     department: z.string().min(2),
     positions: z.number().int().min(1),
     description: z.string().min(50),
     qualifications: z.array(z.string()).optional(),
     responsibilities: z.array(z.string()).optional(),
     requiredSections: z
       .array(
         z.object({
           sectionType: z.enum([
             'personal',
             'education',
             'experience',
             'research',
             'publications',
             'references',
             'documents',
             'custom',
           ]),
           isMandatory: z.boolean(),
           requiresPDF: z.boolean(),
           pdfLabel: z.string().optional(),
           maxPDFSize: z.number().optional(),
           instructions: z.string().optional(),
         })
       )
       .min(1),
     customFields: z
       .array(
         z.object({
           fieldName: z.string(),
           fieldType: z.enum(['text', 'number', 'date', 'dropdown']),
           options: z.array(z.string()).optional(),
           isMandatory: z.boolean(),
         })
       )
       .optional(),
     applicationDeadline: z.string().datetime(),
     startDate: z.string().datetime().optional(),
   });
   ```

2. Create `updateJobSchema` (similar, but all fields optional)

3. Validate deadline is future date

**Definition of Done**:

- ✅ Validators reject invalid job data
- ✅ requiredSections validated (at least 1 section)
- ✅ Deadline must be future date

---

### Step 2.4: Create Job Controllers (Admin)

**Files to Create**:

- `src/controllers/admin/job.controller.js`

**Tasks**:

1. `createJob`:
   - Validate input with `createJobSchema`
   - Check jobCode uniqueness
   - Set `createdBy` to `req.user._id`
   - Save job
   - Log action (audit)

2. `getAllJobs`:
   - Support filters: category, department, status
   - Support pagination
   - Return jobs with creator info

3. `getJobById`:
   - Fetch job by ID
   - Populate createdBy

4. `updateJob`:
   - Validate input
   - Cannot update if status is 'closed'
   - Update job
   - Log action

5. `deleteJob`:
   - Soft delete (set isActive = false)
   - Log action

6. `publishJob`:
   - Validate job has all required fields
   - Set status = 'published'
   - Set publishedAt = Date.now()
   - Log action

7. `closeJob`:
   - Set status = 'closed'
   - Set closedAt = Date.now()
   - Log action

**Definition of Done**:

- ✅ All CRUD operations work
- ✅ Publish/close logic functional
- ✅ Audit logs created for all actions
- ✅ Cannot publish incomplete job

---

### Step 2.5: Create Job Routes (Admin)

**Files to Create**:

- `src/routes/admin/job.routes.js`

**Tasks**:

1. Import controllers and middleware
2. Create routes:

   ```javascript
   router.post(
     '/',
     verifyJWT,
     requireRole(['admin']),
     validate(createJobSchema),
     createJob
   );
   router.get('/', verifyJWT, requireRole(['admin']), getAllJobs);
   router.get('/:id', verifyJWT, requireRole(['admin']), getJobById);
   router.patch(
     '/:id',
     verifyJWT,
     requireRole(['admin']),
     validate(updateJobSchema),
     updateJob
   );
   router.delete('/:id', verifyJWT, requireRole(['admin']), deleteJob);
   router.post('/:id/publish', verifyJWT, requireRole(['admin']), publishJob);
   router.post('/:id/close', verifyJWT, requireRole(['admin']), closeJob);
   ```

3. Mount in `src/app.js`:
   ```javascript
   app.use('/api/admin/jobs', adminJobRoutes);
   ```

**API Endpoints**:

- `POST /api/admin/jobs`
- `GET /api/admin/jobs`
- `GET /api/admin/jobs/:id`
- `PATCH /api/admin/jobs/:id`
- `DELETE /api/admin/jobs/:id`
- `POST /api/admin/jobs/:id/publish`
- `POST /api/admin/jobs/:id/close`

**Definition of Done**:

- ✅ All routes protected with RBAC (admin only)
- ✅ Routes mounted correctly
- ✅ Can access endpoints with admin token

---

### Step 2.6: Create Public Job Controllers

**Files to Create**:

- `src/controllers/public/job.controller.js`

**Tasks**:

1. `getActiveJobs`:
   - Filter: status = 'published', isActive = true, applicationDeadline > Date.now()
   - Support filters: category, department, noticeId
   - Support pagination
   - Return jobs (exclude createdBy, internal fields)

2. `getJobByCode`:
   - Find job by jobCode
   - Only return if published and active
   - Include full requiredSections and customFields

3. `getJobCategories`:
   - Return enum values: ['Faculty', 'Non-Teaching', 'Research', 'Contract']

4. `getJobsByNotice`:
   - Filter jobs by noticeId
   - Only return published, active jobs

**Definition of Done**:

- ✅ Public can view only published, active jobs
- ✅ Deadline-passed jobs not returned
- ✅ Job details include full section configuration

---

### Step 2.7: Create Public Job Routes

**Files to Create**:

- `src/routes/public/job.routes.js`

**Tasks**:

1. Create routes (no authentication):

   ```javascript
   router.get('/', getActiveJobs);
   router.get('/categories', getJobCategories);
   router.get('/notice/:noticeId', getJobsByNotice);
   router.get('/:jobCode', getJobByCode);
   ```

2. Mount in `src/app.js`:
   ```javascript
   app.use('/api/jobs', publicJobRoutes);
   ```

**API Endpoints**:

- `GET /api/jobs`
- `GET /api/jobs/categories`
- `GET /api/jobs/notice/:noticeId`
- `GET /api/jobs/:jobCode`

**Definition of Done**:

- ✅ Public routes accessible without authentication
- ✅ Only published, active jobs returned
- ✅ Notice-based filtering works

---

### Step 2.8: Create Department Endpoints

**Files to Create**:

- `src/controllers/department.controller.js`
- `src/routes/department.routes.js`

**Tasks**:

1. `getAllDepartments` controller:
   - Return all active departments
   - Sort by name

2. Create route:

   ```javascript
   router.get('/', getAllDepartments);
   ```

3. Mount in `src/app.js`:
   ```javascript
   app.use('/api/departments', departmentRoutes);
   ```

**API Endpoints**:

- `GET /api/departments`

**Definition of Done**:

- ✅ Can fetch all departments
- ✅ Public route (no auth required)

---

### Step 2.9: Seed Departments (Optional)

**Files to Create**:

- `src/scripts/seedDepartments.js`

**Tasks**:

1. Create seed script:

   ```javascript
   const departments = [
     { name: 'Computer Science & Engineering', code: 'CSE' },
     { name: 'Electrical Engineering', code: 'EE' },
     { name: 'Mechanical Engineering', code: 'ME' },
     // ... more departments
   ];

   await Department.insertMany(departments);
   ```

2. Run script: `node src/scripts/seedDepartments.js`

**Definition of Done**:

- ✅ Departments seeded in database
- ✅ Can fetch departments via API

---

### Step 2.10: Testing Phase 2

**Tasks**:

1. Create job as admin
2. Publish job
3. Fetch job as public user
4. Filter jobs by category, department
5. Fetch jobs by notice
6. Try to create job as applicant (should fail)
7. Verify deadline validation
8. Close job and verify it's not returned in public API

**Definition of Done**:

- ✅ All job endpoints work
- ✅ RBAC enforced (admin only for create/update)
- ✅ Public can view only published jobs
- ✅ Filters work correctly

---

## Phase 3: Application System - Core Structure

**Duration**: 5-6 days  
**Goal**: Implement flexible application model with snapshot architecture

### Step 3.1: Create Application Number Generator

**Files to Create**:

- `src/utils/applicationNumberGenerator.js`
- `src/models/counter.model.js`

**Tasks**:

1. Create Counter model:

   ```javascript
   {
     _id: String,  // 'applicationNumber'
     seq: { type: Number, default: 0 }
   }
   ```

2. Create `generateApplicationNumber` function:
   ```javascript
   export async function generateApplicationNumber() {
     const year = new Date().getFullYear();
     const counter = await Counter.findByIdAndUpdate(
       'applicationNumber',
       { $inc: { seq: 1 } },
       { new: true, upsert: true }
     );

     const paddedSeq = String(counter.seq).padStart(5, '0');
     return `APP-${year}-${paddedSeq}`;
   }
   ```

**MongoDB Collections Affected**: `counters` (new)

**Definition of Done**:

- ✅ Generates unique application numbers
- ✅ Format: APP-YYYY-NNNNN
- ✅ Atomic increment (no duplicates)

---

### Step 3.2: Create Application Model

**Files to Create**:

- `src/models/application.model.js`

**Tasks**:

1. Create schema:

   ```javascript
   {
     applicationNumber: { type: String, required: true, unique: true },

     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
     jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },

     jobSnapshot: {
       title: String,
       jobCode: String,
       department: String,
       requiredSections: [{
         sectionType: String,
         isMandatory: Boolean,
         requiresPDF: Boolean,
         pdfLabel: String,
         maxPDFSize: Number,
         instructions: String
       }],
       customFields: [{
         fieldName: String,
         fieldType: String,
         options: [String],
         isMandatory: Boolean,
         section: String
       }]
     },

     status: {
       type: String,
       enum: ['draft', 'submitted', 'under_review', 'shortlisted', 'rejected', 'selected'],
       default: 'draft'
     },
     submittedAt: Date,
     lastModifiedAt: { type: Date, default: Date.now },

     sections: {
       personal: {
         data: Schema.Types.Mixed,
         pdfUrl: String,
         cloudinaryId: String,
         savedAt: Date,
         isComplete: { type: Boolean, default: false }
       },
       education: { /* same */ },
       experience: { /* same */ },
       research: { /* same */ },
       publications: { /* same */ },
       references: { /* same */ },
       documents: { /* same */ },
       custom: { /* same */ }
     },

     validationErrors: [{
       section: String,
       field: String,
       message: String
     }],

     isLocked: { type: Boolean, default: false },
     lockedAt: Date,

     reviewNotes: String,
     reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
     reviewedAt: Date,

     statusHistory: [{
       status: String,
       changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
       changedAt: { type: Date, default: Date.now },
       remarks: String
     }]
   }
   ```

2. Add indexes:

   ```javascript
   applicationSchema.index({ applicationNumber: 1 }, { unique: true });
   applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true }); // One app per job per user
   applicationSchema.index({ status: 1, submittedAt: -1 });
   applicationSchema.index({ jobId: 1, status: 1 });
   applicationSchema.index({ userId: 1, status: 1 });
   ```

3. Add pre-save hook to update `lastModifiedAt`:
   ```javascript
   applicationSchema.pre('save', function (next) {
     this.lastModifiedAt = new Date();
     next();
   });
   ```

**MongoDB Collections Affected**: `applications` (new)

**Definition of Done**:

- ✅ Application model created
- ✅ Indexes created
- ✅ Compound unique index on userId + jobId
- ✅ Flexible sections schema

---

### Step 3.3: Create Application Service

**Files to Create**:

- `src/services/application.service.js`

**Tasks**:

1. Create `snapshotJobConfiguration` function:

   ```javascript
   export async function snapshotJobConfiguration(jobId) {
     const job = await Job.findById(jobId);
     if (!job) throw new ApiError(404, 'Job not found');

     return {
       title: job.title,
       jobCode: job.jobCode,
       department: job.department,
       requiredSections: job.requiredSections,
       customFields: job.customFields,
     };
   }
   ```

2. Create `validateSectionCompleteness` function:

   ```javascript
   export function validateSectionCompleteness(section, sectionConfig) {
     const errors = [];

     // Check if data exists (if mandatory)
     if (sectionConfig.isMandatory && !section.data) {
       errors.push({ field: 'data', message: 'Section data is required' });
     }

     // Check if PDF exists (if required)
     if (sectionConfig.requiresPDF && !section.pdfUrl) {
       errors.push({ field: 'pdf', message: 'PDF upload is required' });
     }

     return errors;
   }
   ```

3. Create `checkAllMandatorySections` function:

   ```javascript
   export function checkAllMandatorySections(application) {
     const errors = [];

     application.jobSnapshot.requiredSections.forEach((sectionConfig) => {
       if (sectionConfig.isMandatory) {
         const section = application.sections[sectionConfig.sectionType];
         const sectionErrors = validateSectionCompleteness(
           section,
           sectionConfig
         );

         if (sectionErrors.length > 0) {
           errors.push({
             section: sectionConfig.sectionType,
             errors: sectionErrors,
           });
         }
       }
     });

     return errors;
   }
   ```

4. Create `lockApplication` function:
   ```javascript
   export async function lockApplication(applicationId) {
     const application = await Application.findByIdAndUpdate(
       applicationId,
       { isLocked: true, lockedAt: new Date() },
       { new: true }
     );
     return application;
   }
   ```

**Definition of Done**:

- ✅ Can snapshot job configuration
- ✅ Can validate section completeness
- ✅ Can check all mandatory sections
- ✅ Can lock application

---

### Step 3.4: Create Application Controllers

**Files to Create**:

- `src/controllers/application.controller.js`

**Tasks**:

1. `createApplication`:
   - Check if job exists and is published
   - Check if user already has application for this job
   - Generate application number
   - Snapshot job configuration
   - Create application with status = 'draft'
   - Add applicationId to user.applicationIds
   - Log action

2. `getUserApplications`:
   - Fetch all applications for req.user.\_id
   - Support filters: status, jobId
   - Support pagination
   - Populate job details

3. `getApplicationById`:
   - Fetch application by ID
   - Check ownership (req.user.\_id === application.userId)
   - Populate job details

4. `deleteApplication`:
   - Check ownership
   - Check status = 'draft' (cannot delete submitted)
   - Delete application
   - Remove from user.applicationIds
   - Log action

**Definition of Done**:

- ✅ Can create application (snapshots job)
- ✅ Application number generated
- ✅ Cannot create duplicate application for same job
- ✅ Can list user's applications
- ✅ Can view application details
- ✅ Can delete draft application

---

### Step 3.5: Create Application Routes

**Files to Create**:

- `src/routes/application.routes.js`

**Tasks**:

1. Create routes:

   ```javascript
   router.post('/', verifyJWT, requireRole(['applicant']), createApplication);
   router.get('/', verifyJWT, requireRole(['applicant']), getUserApplications);
   router.get(
     '/:id',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     getApplicationById
   );
   router.delete(
     '/:id',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     deleteApplication
   );
   ```

2. Mount in `src/app.js`:
   ```javascript
   app.use('/api/applications', applicationRoutes);
   ```

**API Endpoints**:

- `POST /api/applications` (body: { jobId })
- `GET /api/applications`
- `GET /api/applications/:id`
- `DELETE /api/applications/:id`

**Definition of Done**:

- ✅ All routes protected (applicant only)
- ✅ Ownership validation enforced
- ✅ Can create, list, view, delete applications

---

### Step 3.6: Testing Phase 3

**Tasks**:

1. Create application as applicant
2. Verify application number generated
3. Verify job snapshot created
4. Try to create duplicate application (should fail)
5. List user's applications
6. View application details
7. Delete draft application
8. Try to delete submitted application (should fail)
9. Verify audit logs created

**Definition of Done**:

- ✅ Application creation works end-to-end
- ✅ Snapshot logic functional
- ✅ Duplicate prevention works
- ✅ Ownership validation enforced

---

## Phase 4: Section-wise Saving & Validation

**Duration**: 4-5 days  
**Goal**: Enable independent section saving with validation

### Step 4.1: Create Section Validation Service

**Files to Create**:

- `src/services/sectionValidation.service.js`

**Tasks**:

1. Create `validateSectionData` function:

   ```javascript
   export function validateSectionData(
     sectionType,
     data,
     sectionConfig,
     customFields
   ) {
     const errors = [];

     // For custom section, validate custom fields
     if (sectionType === 'custom' && customFields) {
       customFields.forEach((field) => {
         if (field.isMandatory && !data[field.fieldName]) {
           errors.push({
             field: field.fieldName,
             message: `${field.fieldName} is required`,
           });
         }

         // Validate field type
         if (data[field.fieldName]) {
           switch (field.fieldType) {
             case 'number':
               if (isNaN(data[field.fieldName])) {
                 errors.push({
                   field: field.fieldName,
                   message: 'Must be a number',
                 });
               }
               break;
             case 'date':
               if (!Date.parse(data[field.fieldName])) {
                 errors.push({
                   field: field.fieldName,
                   message: 'Invalid date',
                 });
               }
               break;
             case 'dropdown':
               if (!field.options.includes(data[field.fieldName])) {
                 errors.push({
                   field: field.fieldName,
                   message: 'Invalid option',
                 });
               }
               break;
           }
         }
       });
     }

     // For standard sections, add basic validation (can be expanded)
     // Example: personal section must have name, email, etc.

     return errors;
   }
   ```

2. Create `validatePDFUpload` function:
   ```javascript
   export function validatePDFUpload(file, sectionConfig) {
     const errors = [];

     // Check file type
     if (file.mimetype !== 'application/pdf') {
       errors.push({ field: 'file', message: 'Only PDF files are allowed' });
     }

     // Check file size
     const maxSize = (sectionConfig.maxPDFSize || 5) * 1024 * 1024; // Convert MB to bytes
     if (file.size > maxSize) {
       errors.push({
         field: 'file',
         message: `File size must not exceed ${sectionConfig.maxPDFSize || 5}MB`,
       });
     }

     return errors;
   }
   ```

**Definition of Done**:

- ✅ Can validate section data
- ✅ Custom fields validated correctly
- ✅ PDF upload validated (type, size)

---

### Step 4.2: Create Section Controllers

**Files to Create**:

- `src/controllers/applicationSection.controller.js`

**Tasks**:

1. `saveSection`:
   - Check application exists and user owns it
   - Check application is not locked
   - Get section config from jobSnapshot
   - Validate section data
   - Update `sections[sectionType].data`
   - Update `sections[sectionType].savedAt`
   - Save application
   - Return updated section

2. `uploadSectionPDF`:
   - Check application exists and user owns it
   - Check application is not locked
   - Get section config from jobSnapshot
   - Validate PDF upload
   - Upload to Cloudinary (use upload service)
   - Delete old PDF if exists
   - Update `sections[sectionType].pdfUrl` and `cloudinaryId`
   - Update `sections[sectionType].savedAt`
   - Save application
   - Return updated section

3. `deleteSectionPDF`:
   - Check application exists and user owns it
   - Check application is not locked
   - Delete PDF from Cloudinary
   - Clear `sections[sectionType].pdfUrl` and `cloudinaryId`
   - Save application

4. `validateSection`:
   - Check application exists and user owns it
   - Get section config from jobSnapshot
   - Validate section data and PDF
   - Return validation errors (if any)

**Definition of Done**:

- ✅ Can save section data independently
- ✅ Can upload section PDF
- ✅ Can delete section PDF
- ✅ Can validate section
- ✅ Cannot edit locked application

---

### Step 4.3: Create Section Routes

**Files to Modify**:

- `src/routes/application.routes.js`

**Tasks**:

1. Add section routes:
   ```javascript
   router.patch(
     '/:id/sections/:sectionType',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     saveSection
   );
   router.post(
     '/:id/sections/:sectionType/pdf',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     upload.single('pdf'),
     uploadSectionPDF
   );
   router.delete(
     '/:id/sections/:sectionType/pdf',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     deleteSectionPDF
   );
   router.post(
     '/:id/sections/:sectionType/validate',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     validateSection
   );
   ```

**API Endpoints**:

- `PATCH /api/applications/:id/sections/:sectionType` (body: { data })
- `POST /api/applications/:id/sections/:sectionType/pdf` (multipart/form-data)
- `DELETE /api/applications/:id/sections/:sectionType/pdf`
- `POST /api/applications/:id/sections/:sectionType/validate`

**Definition of Done**:

- ✅ All section routes functional
- ✅ Ownership validation enforced
- ✅ Locking checks in place

---

### Step 4.4: Configure Multer for PDF Uploads

**Files to Create**:

- `src/middlewares/upload.middleware.js`

**Tasks**:

1. Configure multer:

   ```javascript
   import multer from 'multer';

   const storage = multer.memoryStorage(); // Store in memory for Cloudinary upload

   export const upload = multer({
     storage,
     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max (will be validated per section)
     fileFilter: (req, file, cb) => {
       if (file.mimetype === 'application/pdf') {
         cb(null, true);
       } else {
         cb(new Error('Only PDF files are allowed'), false);
       }
     },
   });
   ```

**Definition of Done**:

- ✅ Multer configured for PDF uploads
- ✅ File stored in memory (for Cloudinary)
- ✅ Basic file type validation

---

### Step 4.5: Testing Phase 4

**Tasks**:

1. Save personal section data
2. Upload PDF for education section
3. Validate section (with incomplete data)
4. Complete section and validate again
5. Try to save section on locked application (should fail)
6. Delete section PDF
7. Upload new PDF (verify old one deleted from Cloudinary)
8. Verify savedAt timestamp updates

**Definition of Done**:

- ✅ Section saving works independently
- ✅ PDF upload/delete works
- ✅ Validation returns correct errors
- ✅ Locking prevents edits

---

## Phase 5: Final Submission & Locking

**Duration**: 3-4 days  
**Goal**: Implement hard validation and application locking

### Step 5.1: Create Submission Validation Service

**Files to Create**:

- `src/services/submissionValidation.service.js`

**Tasks**:

1. Create `validateAllSections` function:

   ```javascript
   export async function validateAllSections(application) {
     const errors = [];

     application.jobSnapshot.requiredSections.forEach((sectionConfig) => {
       if (sectionConfig.isMandatory) {
         const section = application.sections[sectionConfig.sectionType];

         // Check data exists
         if (!section || !section.data) {
           errors.push({
             section: sectionConfig.sectionType,
             message: 'Section is required but not completed',
           });
           return;
         }

         // Check PDF exists (if required)
         if (sectionConfig.requiresPDF && !section.pdfUrl) {
           errors.push({
             section: sectionConfig.sectionType,
             message: 'PDF upload is required for this section',
           });
         }
       }
     });

     return errors;
   }
   ```

2. Create `checkJobDeadline` function:
   ```javascript
   export async function checkJobDeadline(jobId) {
     const job = await Job.findById(jobId);
     if (!job) throw new ApiError(404, 'Job not found');

     if (new Date() > new Date(job.applicationDeadline)) {
       throw new ApiError(400, 'Application deadline has passed');
     }

     if (job.status !== 'published') {
       throw new ApiError(400, 'Job is not accepting applications');
     }

     return true;
   }
   ```

**Definition of Done**:

- ✅ Can validate all sections
- ✅ Can check job deadline
- ✅ Returns detailed validation errors

---

### Step 5.2: Create Submission Controllers

**Files to Create**:

- `src/controllers/applicationSubmission.controller.js`

**Tasks**:

1. `validateAllBeforeSubmission`:
   - Fetch application
   - Check ownership
   - Validate all sections
   - Check job deadline
   - Return validation result (errors or success)

2. `submitApplication`:
   - Fetch application
   - Check ownership
   - Check application is not already submitted
   - Validate all sections (hard validation)
   - Check job deadline
   - If validation passes:
     - Set status = 'submitted'
     - Set submittedAt = Date.now()
     - Set isLocked = true
     - Set lockedAt = Date.now()
     - Add to statusHistory
     - Save application
     - Log action (audit)
   - Return success response

3. `getSubmissionReceipt` (optional):
   - Fetch application
   - Check ownership
   - Check application is submitted
   - Generate PDF receipt (using library like pdfkit)
   - Return PDF

**Definition of Done**:

- ✅ Pre-submission validation works
- ✅ Cannot submit with incomplete sections
- ✅ Cannot submit without required PDFs
- ✅ Cannot submit after deadline
- ✅ Application locks after submission
- ✅ Status changes to 'submitted'
- ✅ Audit log created

---

### Step 5.3: Create Submission Routes

**Files to Modify**:

- `src/routes/application.routes.js`

**Tasks**:

1. Add submission routes:
   ```javascript
   router.post(
     '/:id/validate-all',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     validateAllBeforeSubmission
   );
   router.post(
     '/:id/submit',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     submitApplication
   );
   router.get(
     '/:id/receipt',
     verifyJWT,
     requireRole(['applicant']),
     requireOwnership(Application),
     getSubmissionReceipt
   );
   ```

**API Endpoints**:

- `POST /api/applications/:id/validate-all`
- `POST /api/applications/:id/submit`
- `GET /api/applications/:id/receipt`

**Definition of Done**:

- ✅ All submission routes functional
- ✅ Validation endpoint returns detailed errors
- ✅ Submit endpoint locks application

---

### Step 5.4: Testing Phase 5

**Tasks**:

1. Create application with incomplete sections
2. Try to submit (should fail with validation errors)
3. Complete all mandatory sections
4. Validate all sections (should pass)
5. Submit application
6. Verify application locked
7. Try to edit section (should fail)
8. Try to submit again (should fail - already submitted)
9. Create application for job past deadline (should fail)
10. Verify audit log created

**Definition of Done**:

- ✅ Validation works correctly
- ✅ Submission locks application
- ✅ Cannot edit after submission
- ✅ Deadline validation works

---

## Phase 6: Admin Review & Management

**Duration**: 4-5 days  
**Goal**: Admin tools for reviewing and managing applications

### Step 6.1: Create Admin Application Controllers

**Files to Create**:

- `src/controllers/admin/application.controller.js`

**Tasks**:

1. `getAllApplications`:
   - Support filters: jobId, status, dateRange
   - Support pagination
   - Populate user and job details
   - Return applications

2. `getApplicationById`:
   - Fetch application by ID
   - Populate user and job details
   - Return full application (including all sections)

3. `updateApplicationStatus`:
   - Validate new status
   - Update application.status
   - Add to statusHistory (with req.user.\_id, remarks)
   - Log action (audit)
   - Return updated application

4. `addReviewNotes`:
   - Update application.reviewNotes
   - Set reviewedBy = req.user.\_id
   - Set reviewedAt = Date.now()
   - Log action
   - Return updated application

5. `bulkUpdateStatus`:
   - Accept array of applicationIds and new status
   - Update all applications
   - Add to statusHistory for each
   - Log action
   - Return count of updated applications

6. `exportApplications`:
   - Fetch applications based on filters
   - Generate CSV/Excel (using library like json2csv or exceljs)
   - Include: applicationNumber, user details, job details, status, submittedAt
   - Return file

7. `getApplicationsByJob`:
   - Fetch all applications for a specific jobId
   - Support filters: status
   - Support pagination
   - Return applications

**Definition of Done**:

- ✅ Admin can view all applications
- ✅ Can filter by job, status, date
- ✅ Can update status with audit trail
- ✅ Can add review notes
- ✅ Bulk status update works
- ✅ Can export to CSV

---

### Step 6.2: Create Admin Application Routes

**Files to Create**:

- `src/routes/admin/application.routes.js`

**Tasks**:

1. Create routes:

   ```javascript
   router.get(
     '/',
     verifyJWT,
     requireRole(['admin', 'reviewer']),
     getAllApplications
   );
   router.get(
     '/:id',
     verifyJWT,
     requireRole(['admin', 'reviewer']),
     getApplicationById
   );
   router.patch(
     '/:id/status',
     verifyJWT,
     requireRole(['admin']),
     updateApplicationStatus
   );
   router.patch(
     '/:id/review',
     verifyJWT,
     requireRole(['admin', 'reviewer']),
     addReviewNotes
   );
   router.post(
     '/bulk-status',
     verifyJWT,
     requireRole(['admin']),
     bulkUpdateStatus
   );
   router.get('/export', verifyJWT, requireRole(['admin']), exportApplications);
   ```

2. Create job-specific route:

   ```javascript
   router.get(
     '/job/:jobId',
     verifyJWT,
     requireRole(['admin', 'reviewer']),
     getApplicationsByJob
   );
   ```

3. Mount in `src/app.js`:
   ```javascript
   app.use('/api/admin/applications', adminApplicationRoutes);
   app.use('/api/admin/jobs/:jobId/applications', adminApplicationRoutes); // Alternative mount
   ```

**API Endpoints**:

- `GET /api/admin/applications`
- `GET /api/admin/applications/:id`
- `PATCH /api/admin/applications/:id/status`
- `PATCH /api/admin/applications/:id/review`
- `POST /api/admin/applications/bulk-status`
- `GET /api/admin/applications/export`
- `GET /api/admin/jobs/:jobId/applications`

**Definition of Done**:

- ✅ All admin routes protected (admin/reviewer only)
- ✅ Routes mounted correctly
- ✅ Can access with admin token

---

### Step 6.3: Create Application Access Control Middleware

**Files to Create**:

- `src/middlewares/applicationAccess.middleware.js`

**Tasks**:

1. Create `checkApplicationAccess` middleware:
   ```javascript
   export const checkApplicationAccess = async (req, res, next) => {
     const application = await Application.findById(req.params.id);

     if (!application) {
       throw new ApiError(404, 'Application not found');
     }

     // Admin can access all
     if (req.user.role === 'admin' || req.user.role === 'reviewer') {
       req.application = application;
       return next();
     }

     // Applicant can only access own
     if (application.userId.toString() !== req.user._id.toString()) {
       throw new ApiError(
         403,
         'Forbidden: You can only access your own applications'
       );
     }

     req.application = application;
     next();
   };
   ```

**Definition of Done**:

- ✅ Admin can access all applications
- ✅ Applicant can only access own applications
- ✅ Middleware reusable across routes

---

### Step 6.4: Testing Phase 6

**Tasks**:

1. Login as admin
2. Fetch all applications
3. Filter by job, status
4. View application details
5. Update application status
6. Add review notes
7. Bulk update status for multiple applications
8. Export applications to CSV
9. Fetch applications for specific job
10. Verify audit logs created
11. Try to access admin routes as applicant (should fail)

**Definition of Done**:

- ✅ All admin endpoints work
- ✅ Filters work correctly
- ✅ Status history tracks changes
- ✅ CSV export functional
- ✅ RBAC enforced

---

## Phase 7: Enhancements & Polish

**Duration**: 5-7 days  
**Goal**: Add production-ready features and optimizations

### Step 7.1: Create Dashboard Statistics

**Files to Create**:

- `src/controllers/admin/dashboard.controller.js`

**Tasks**:

1. `getOverallStats`:
   - Total applications
   - Applications by status (breakdown)
   - Applications by job
   - Applications by department
   - Applications over time (last 30 days)

2. `getJobStats`:
   - Total applications for job
   - Status breakdown
   - Average time to submit
   - Completion rate

**API Endpoints**:

- `GET /api/admin/dashboard/stats`
- `GET /api/admin/dashboard/jobs/:jobId/stats`

**Definition of Done**:

- ✅ Dashboard shows accurate statistics
- ✅ Charts data available (frontend can render)

---

### Step 7.2: Create Notification System

**Files to Create**:

- `src/models/notification.model.js`
- `src/controllers/notification.controller.js`
- `src/services/notification.service.js`

**Tasks**:

1. Create Notification model:

   ```javascript
   {
     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
     type: {
       type: String,
       enum: ['status_change', 'deadline_reminder', 'admin_message'],
       required: true
     },
     title: { type: String, required: true },
     message: { type: String, required: true },
     relatedResource: {
       resourceType: String, // 'Application', 'Job'
       resourceId: Schema.Types.ObjectId
     },
     isRead: { type: Boolean, default: false },
     readAt: Date
   }
   ```

2. Create notification service:
   - `createNotification(userId, type, title, message, relatedResource)`
   - `markAsRead(notificationId)`
   - `getUserNotifications(userId, filters)`

3. Create controllers:
   - `getNotifications` (for current user)
   - `markAsRead`
   - `markAllAsRead`

4. Integrate with status changes:
   - When admin updates status, create notification for applicant

**API Endpoints**:

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/mark-all-read`

**MongoDB Collections Affected**: `notifications` (new)

**Definition of Done**:

- ✅ Notifications created on status change
- ✅ User can fetch notifications
- ✅ Can mark as read

---

### Step 7.3: Create Application Withdrawal

**Files to Modify**:

- `src/controllers/application.controller.js`

**Tasks**:

1. `withdrawApplication`:
   - Check application is submitted (not draft)
   - Accept withdrawal reason
   - Set status = 'withdrawn' (add to enum)
   - Add to statusHistory
   - Log action
   - Create notification for admin

**API Endpoints**:

- `POST /api/applications/:id/withdraw` (body: { reason })

**Definition of Done**:

- ✅ Applicant can withdraw submitted application
- ✅ Reason required
- ✅ Admin notified

---

### Step 7.4: Create Deadline Reminder Service

**Files to Create**:

- `src/services/reminder.service.js`
- `src/cron/deadlineReminder.cron.js`

**Tasks**:

1. Create reminder service:

   ```javascript
   export async function sendDeadlineReminders() {
     const threeDaysFromNow = new Date();
     threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

     // Find jobs with deadline in 3 days
     const jobs = await Job.find({
       status: 'published',
       applicationDeadline: {
         $gte: new Date(),
         $lte: threeDaysFromNow,
       },
     });

     for (const job of jobs) {
       // Find users with draft applications for this job
       const draftApplications = await Application.find({
         jobId: job._id,
         status: 'draft',
       }).populate('userId');

       for (const app of draftApplications) {
         // Create notification
         await createNotification(
           app.userId._id,
           'deadline_reminder',
           `Deadline Reminder: ${job.title}`,
           `The application deadline for ${job.title} is in 3 days. Please complete your application.`,
           { resourceType: 'Application', resourceId: app._id }
         );
       }
     }
   }
   ```

2. Create cron job:

   ```javascript
   import cron from 'node-cron';

   // Run daily at 9 AM
   cron.schedule('0 9 * * *', async () => {
     console.log('Running deadline reminder cron job');
     await sendDeadlineReminders();
   });
   ```

3. Initialize cron in `src/index.js`

**Definition of Done**:

- ✅ Cron job runs daily
- ✅ Notifications sent to users with draft applications
- ✅ Only for jobs with deadline in 3 days

---

### Step 7.5: Create Document Verification

**Files to Modify**:

- `src/models/application.model.js`
- `src/controllers/admin/application.controller.js`

**Tasks**:

1. Add verification fields to section schema:

   ```javascript
   sections: {
     personal: {
       // ... existing fields
       isVerified: { type: Boolean, default: false },
       verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
       verifiedAt: Date,
       verificationNotes: String
     }
   }
   ```

2. Create `verifySectionDocuments` controller:
   - Update section verification status
   - Add verification notes
   - Set verifiedBy and verifiedAt
   - Log action

**API Endpoints**:

- `PATCH /api/admin/applications/:id/verify-section` (body: { sectionType, isVerified, notes })

**Definition of Done**:

- ✅ Admin can verify individual sections
- ✅ Verification status tracked
- ✅ Audit log created

---

### Step 7.6: Add Search & Advanced Filters

**Files to Modify**:

- `src/controllers/admin/application.controller.js`

**Tasks**:

1. Enhance `getAllApplications`:
   - Add full-text search on applicationNumber, user.fullName, user.email
   - Add filters: jobId, status, dateRange, department
   - Add sorting: submittedAt, lastModifiedAt, status
   - Add pagination

2. Create indexes for search:
   ```javascript
   applicationSchema.index({ applicationNumber: 'text' });
   userSchema.index({ fullName: 'text', email: 'text' });
   ```

**Definition of Done**:

- ✅ Can search applications by number, name, email
- ✅ Advanced filters work
- ✅ Sorting functional

---

### Step 7.7: Testing Phase 7

**Tasks**:

1. Fetch dashboard statistics
2. Create notification manually
3. Fetch notifications as user
4. Mark notification as read
5. Withdraw application
6. Run deadline reminder cron job manually
7. Verify section documents as admin
8. Search applications
9. Test advanced filters

**Definition of Done**:

- ✅ All enhancements functional
- ✅ Cron job works
- ✅ Notifications system operational
- ✅ Search and filters work

---

## Final Checklist

### Code Quality

- [ ] All files follow consistent naming conventions
- [ ] All functions have JSDoc comments
- [ ] Error handling in all controllers
- [ ] Input validation on all endpoints
- [ ] Audit logging for critical actions

### Security

- [ ] All routes have authentication
- [ ] RBAC enforced correctly
- [ ] Ownership validation in place
- [ ] File upload security (type, size)
- [ ] Rate limiting configured
- [ ] CORS configured for production

### Database

- [ ] All indexes created
- [ ] Compound unique index on userId + jobId (Application)
- [ ] Soft delete implemented (User)
- [ ] Audit logs collection created

### Testing

- [ ] All endpoints tested manually
- [ ] Edge cases covered (locked application, deadline passed, etc.)
- [ ] RBAC tested (applicant cannot access admin routes)
- [ ] File upload tested (PDF only, size limits)
- [ ] Validation tested (incomplete sections, missing PDFs)

### Documentation

- [ ] API endpoints documented (Postman collection or Swagger)
- [ ] Environment variables documented (.env.example)
- [ ] README updated with setup instructions
- [ ] Deployment guide created

### Deployment

- [ ] Environment variables set
- [ ] MongoDB connection pooling configured
- [ ] PM2 configured (if using)
- [ ] Logging configured (Morgan, custom error logs)
- [ ] CORS configured for production domain
- [ ] Database backups scheduled

---

## Estimated Timeline

| Phase   | Days | Cumulative |
| ------- | ---- | ---------- |
| Phase 1 | 3-4  | 3-4        |
| Phase 2 | 4-5  | 7-9        |
| Phase 3 | 5-6  | 12-15      |
| Phase 4 | 4-5  | 16-20      |
| Phase 5 | 3-4  | 19-24      |
| Phase 6 | 4-5  | 23-29      |
| Phase 7 | 5-7  | 28-36      |

**Total**: 28-36 days (solo developer, full-time)

---

## Tips for Solo Developer

1. **Work Phase by Phase**: Complete one phase fully before moving to next
2. **Test Incrementally**: Test each endpoint immediately after creating it
3. **Use Postman**: Create collection for all endpoints, save example requests
4. **Commit Frequently**: Commit after each step (granular commits)
5. **Document as You Go**: Add comments, JSDoc, update README
6. **Handle Errors Early**: Add error handling from the start, not as afterthought
7. **Use Audit Logs**: They help debug issues in production
8. **Keep It Simple**: Don't over-engineer, follow the plan

---

**Document Status**: ✅ Ready for Implementation  
**Next Step**: Start with Phase 1, Step 1.1 (Enhance User Model)
