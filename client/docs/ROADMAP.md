# Frontend Implementation Plan — Professional Team Split

**Architect/Lead**: Antigravity AI
**Status**: Finalized / Implementation Ready
**Project**: NIT KKR Careers Portal

---

## 🔵 Team A — Applicant Experience
**Focus**: Public-facing discovery, authentication, and the multi-step application submission engine.

### 1. Feature List
*   **Discovery**: Public job board and notice archive.
*   **Authentication**: Applicant signup, login, and email verification flow.
*   **Dynamic Application Engine**: Stateless form engine that renders sections based on Job configuration.
*   **Section Management**: Persisting per-section data (Education, Experience, etc.) to the server.
*   **File Persistence**: Uploading and replacing PDFs/Images for specific application steps.
*   **Submission Sequence**: Pre-submission validation, payment step integration, and final locking.
*   **Applicant Dashboard**: Real-time status tracking and application withdrawal.

### 2. Key Screens
*   `PublicNotices.jsx`: Categorized archive of recruitment notices.
*   `JobDiscovery.jsx`: Searchable list of active job openings with filters.
*   `JobDetails.jsx`: Full JD view with "Apply Now" triggers.
*   `AuthLayout.jsx`: Managed login/signup/reset containers.
*   `ApplicantDashboard.jsx`: List of "My Applications" with status badges.
*   `ApplicationEngine.jsx`: The "Master Controller" for the multi-step form.

### 3. Major Components
*   `SectionRenderer.jsx`: Maps backend section types to specific UI forms.
*   `StepProgress.jsx`: Visual indicator for application completion.
*   `FileUploadZone.jsx`: PDF/Image drop zone with size validation and preview.
*   `DraftAutoSave.jsx`: Ghost component to handle silent persistence during form filling.

### 4. State Management Concerns
*   **Form Context**: Global state to track unsaved changes across navigation steps.
*   **Job Snapshot**: Local state to store the "Rules" (mandatory sections) of the current job.
*   **Session Store**: Handling JWT persistence and auto-refresh logic.

### 5. Backend API Dependencies
*   `GET /api/v1/jobs` & `GET /api/v1/jobs/:id`
*   `GET /api/v1/notices`
*   `POST /api/v1/auth/register` & `/login`
*   `GET /api/v1/applications` (List mine)
*   `POST /api/v1/applications` (Create draft)
*   `PATCH /api/v1/applications/:id/sections/:type` (Save section data)
*   `POST /api/v1/applications/:id/submit` (Final lock)

### 6. Validation & Error Handling
*   **Frontend-First Validation**: Use `Zod` or `VeeValidate` for immediate feedback per field.
*   **Server Error Mapping**: High-level Toast notifications for 429 (Rate Limit) or 401 (Session Expired).
*   **Section Completion Logic**: Client-side check ensuring all "Mandatory" flag sections are `isComplete` before enabling the Submit button.

---

## 🔴 Team B — Admin & Reviewer Portal
**Focus**: Administrative management, recruitment lifecycle control, and application evaluation workflow.

### 1. Feature List
*   **Executive Dashboard**: High-level metrics (Total Apps, Apps per Job, Dept distribution).
*   **Job Management**: Full lifecycle management of job postings (Draft → Published → Closed).
*   **Notice Management**: Management of recruitment announcements and PDF document links.
*   **Reviewer Workflow**: Individual section verification (Approved/Rejected/Notes) for applicants.
*   **Application Operations**: Status updates (Shortlist/Select), Bulk status changes, and CSV exports.
*   **User/Role Management**: Internal user management (Promoting users to Reviewer/Admin).

### 2. Key Screens
*   `AdminDashboard.jsx`: Visual graph/metric cards for real-time monitoring.
*   `JobManager.jsx`: Table view of all jobs with status-switching controls.
*   `NoticeManager.jsx`: CRUD interface for notices with document upload support.
*   `ApplicationReview.jsx`: Split-view interface (Applicant Data on left, Reviewer controls on right).
*   `AdminUserManagement.jsx`: List of internal users with role-switching toggles.

### 3. Major Components
*   `StatusBadge.jsx`: Unified status indicator used across all Admin tables.
*   `AdminTable.jsx`: Robust data table with server-side pagination, search, and bulk selection.
*   `ReviewToolbar.jsx`: Sticky actions for application status changes and note entry.
*   `ExportButton.jsx`: Trigger for backend CSV generation with filter persistence.

### 4. State Management Concerns
*   **Filter Persistence**: Syncing table filters (status, date, jobId) with URL search params.
*   **Bulk Selection Store**: Tracking IDs selected for mass status updates.
*   **Admin Auth**: RBAC protection (ensuring Reviewers cannot access User Management).

### 5. Backend API Dependencies
*   `GET /api/v1/admin/dashboard`
*   `GET /api/v1/admin/jobs` (CRUD operations)
*   `GET /api/v1/admin/applications` (List with advanced filters)
*   `PATCH /api/v1/admin/applications/:id/status` (Update single status)
*   `POST /api/v1/admin/applications/bulk-status` (Update multiple)
*   `PATCH /api/v1/admin/applications/:id/review` (Add review notes)
*   `POST /api/v1/admin/users/promote` (Role management)

### 6. Validation & Error Handling
*   **Bulk Error Reporting**: Handling scenarios where 45/50 applications updated successfully.
*   **Permission Guards**: UI-level hiding of buttons (e.g., "Select" buttons hidden for Reviewers).
*   **Data Integrity**: Ensuring Admin cannot "Publish" a job with missing mandatory fields.

---

## 🤝 Shared Contracts
Consistency across teams is maintained via two strictly enforced files.

### 1. Shared Enums (`/src/constants.js`)
Both teams **must** use these constant values for logic.
*   **User Roles**: `APPLICANT`, `REVIEWER`, `ADMIN`, `SUPER_ADMIN`.
*   **Application Status**: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED`, `SELECTED`, `REJECTED`.
*   **Section Types**: `PERSONAL`, `EDUCATION`, `EXPERIENCE`, `CREDIT_POINTS`, etc.

### 2. Shared Data Shapes
*   **Application Summary**: `{ id, applicationNumber, status, applicantName, jobTitle, submittedAt }`
*   **ApiResponse Envelope**: `{ success, data, message, errors: [] }`

### 3. Rules for Changes
- Any change to `constants.js` requires a **Sync Meeting** between Team A and Team B leads.
- API response shape changes must be requested through a **Backend Change Request** and updated in `api-reference.md`.

---

## 📅 Delivery Order

| Phase | Team A (Applicant) | Team B (Admin) | Parallel Status |
|---|---|---|---|
| **Phase 1** | Auth Flow & Job Discovery | Admin Login & Management Layout | ✅ Fully Parallel |
| **Phase 2** | Section Saving & Application Logic | Job & Notice CRUD | ✅ Fully Parallel |
| **Phase 3** | File Uploads & Progress Tracking | Reviewer Verify/Review Logic | ✅ Fully Parallel |
| **Phase 4** | **Submission & Payment Flow** | **Application List & Status Operations** | ⚠️ Minor Sync Needed |
| **Phase 5** | UX Polish & Skeletons | Dashboard Metrics & CSV Exports | ✅ Fully Parallel |

---

## 🚨 Risk & Dependency Notes

### 1. External Blockers
*   **Backend Phase A**: Payment Gateway integration is required for Team A Phase 4.
*   **Backend Phase C**: Full-text Search indexing is required for Team B Phase 4.

### 2. Frontend Fallbacks (If Backend is delayed)
*   **Payment**: Use a Client-side stub to simulate a successful 200/OK response if the gateway is not initialized.
*   **Search**: Perform client-side filtering on the current page data if the full-text search index isn't ready.
*   **Auth Loop**: If Refresh Tokens fail, immediately dump user to Login rather than hanging.
