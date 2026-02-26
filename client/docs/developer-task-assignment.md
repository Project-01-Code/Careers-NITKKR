# Developer Task Assignment — Frontend

> **NIT KKR Careers Portal — Two-Developer Split**
> Last updated: February 2026

This document divides all frontend work between two developers and provides micro-task checklists. Work strictly top-to-bottom. Mark tasks complete only after manual verification. Sync daily after finishing one major task group.

> 🔔 **Backend Request Triggers** are marked with a 🔔 icon throughout this document. These indicate the exact moment when the frontend team should formally request a new backend feature. Requesting early gives the backend developer time to build while the frontend continues with unblocked work.

---

## 🔵 Developer A — Application Engine + Shared Infrastructure

**Scope**: Core application state, draft/load logic, stepper, file upload infra, submission flow, My Applications page.

---

### PHASE 1 — APPLICATION ENGINE CORE

#### TASK A1 — Application Context Setup

**Goal**: Centralize application state — remove all prop drilling for section data.

- [ ] Create `src/context/ApplicationContext.jsx`
- [ ] Store state:
  - `applicationId`
  - `applicationData`
  - `sections` (Map of sectionType → section data)
  - `requiredSections` (from `jobSnapshot`)
  - `currentStep`
- [ ] Expose functions:
  - `loadApplication(id)` — fetch existing draft
  - `createApplication(jobId)` — POST new draft
  - `updateSection(type, data)` — local state update after save
  - `goNext()` / `goBack()` — step navigation

**Acceptance Criteria**:
- Context wraps `ApplicationForm`
- State persists across steps
- No prop drilling for section data

> 🔔 **BACKEND REQUEST #1 — Trigger: After completing A1**
> Ask the backend developer to start **Phase B (Email Verification)**.
> **Why now**: By the time the user flow reaches signup → apply, the email verification endpoint should be ready. The frontend can add the "Verify your email" gate later without blocking any current work.
> **What to request**: `POST /auth/verify-email`, `POST /auth/resend-otp` endpoints.

---

#### TASK A2 — Draft Creation Logic

- [ ] On "Apply" click → call `POST /api/v1/applications` with `{ jobId }`
- [ ] Store returned `applicationId` in context
- [ ] Redirect to `/apply/:applicationId`
- [ ] On mount, check if draft already exists for this job (via `GET /api/v1/applications?jobId=...`) to prevent duplicates

**Acceptance Criteria**:
- Draft created only once per job per user
- Page refresh does not create duplicate draft

---

#### TASK A3 — Load Existing Application

- [ ] On component mount → call `GET /api/v1/applications/:id`
- [ ] Populate `ApplicationContext` with response
- [ ] Extract `jobSnapshot.requiredSections` → feed to stepper
- [ ] Restore `currentStep` based on last incomplete section

**Acceptance Criteria**:
- Page refresh restores correct step
- `requiredSections` array drives the UI

---

#### TASK A4 — Dynamic Stepper Builder

- [ ] Build `Stepper.jsx` (or extend existing)
- [ ] Render steps dynamically from `requiredSections`
- [ ] Visual states:
  - ✅ Completed (`isComplete === true`)
  - 🔵 Current step
  - ⚪ Incomplete / future
- [ ] Clicking a completed step navigates back to it

**Acceptance Criteria**:
- Steps reflect backend configuration exactly
- Removing a section in backend removes it in the UI automatically

---

#### TASK A5 — SectionLayout Wrapper

**Create a reusable wrapper** that all section components will use.

- [ ] Accept props: `sectionType`
- [ ] Implement **save handler** → `PATCH /api/v1/applications/:id/sections/:sectionType`
- [ ] Implement **validate-before-next** → `POST /api/v1/applications/:id/sections/:sectionType/validate`
- [ ] Map `{ field, message }` error array to inline form errors
- [ ] Handle `Next` / `Back` navigation via context
- [ ] Show loading state during save/validate
- [ ] Conditionally render PDF upload widget if `sectionConfig.requiresPDF === true`

**Acceptance Criteria**:
- **All** section components use this wrapper
- Zero API logic inside individual section components

---

### PHASE 2 — FILE UPLOAD INFRASTRUCTURE

#### TASK A6 — Reusable ImageUpload Component

Used for: `photo` (200KB) and `signature` (50KB).

- [ ] Drag-and-drop area + click-to-upload
- [ ] Client-side size validation (configurable limit prop)
- [ ] JPEG-only filter
- [ ] Image preview after upload
- [ ] "Replace" button to re-upload
- [ ] "Delete" button → calls `DELETE` endpoint
- [ ] Multipart `FormData` with field name `"image"`

**Acceptance Criteria**:
- Prevents upload above allowed size with user-friendly error
- Correct `multipart/form-data` request sent
- Preview shows `imageUrl` from saved section data on reload

---

#### TASK A7 — Reusable PdfUpload Component

Used for: per-section PDFs and final documents.

- [ ] Validate file type (PDF only)
- [ ] Validate size (configurable via prop — 10MB default, 3MB for final docs)
- [ ] Show filename + file size after successful upload
- [ ] Link to view uploaded PDF
- [ ] Support delete (conditional via prop)
- [ ] Multipart `FormData` with field name `"pdf"`

**Acceptance Criteria**:
- Handles server-side validation errors gracefully
- Shows upload progress indicator

---

### PHASE 3 — CREDIT POINTS

#### TASK A8 — Credit Points Summary Widget

- [ ] Call `GET /api/v1/applications/:id/sections/credit_points/summary`
- [ ] Render `autoCredits` as a breakdown table
- [ ] Display `manualTotal` + `grandTotal`
- [ ] Sync `manualActivities` save via standard section PATCH
- [ ] Re-fetch summary after manual activities are saved

**Acceptance Criteria**:
- Totals match backend response exactly
- Summary updates immediately after manual save

> 🔔 **BACKEND REQUEST #2 — Trigger: After completing A8**
> Ask the backend developer to start **Phase A (Payment Gateway)**.
> **Why now**: The entire form flow works. The only remaining blocker is the payment step before submit. If the backend delivers the payment endpoint by the time Dev A finishes A9, there's zero delay.
> **What to request**: Razorpay/PayU integration, `POST /applications/:id/payment/initiate`, `POST /applications/:id/payment/verify`, `paymentStatus` field on Application model.

---

### PHASE 4 — SUBMISSION FLOW

#### TASK A9 — Validate-All Before Submit

- [ ] Call `POST /api/v1/applications/:id/validate-all`
- [ ] If invalid → block submission, display section-level error list
- [ ] Each error links to the incomplete section step

**Acceptance Criteria**:
- Cannot proceed to submit if any mandatory section is incomplete

---

#### TASK A10 — Submit Application + Payment Step

> ⚠️ **If Payment endpoint is not ready yet**: Build the submit flow WITHOUT the payment step. Add a `// TODO: Insert payment step here` placeholder. The payment UI can be slotted in later as Task A10b without touching any other code.

- [ ] Call `POST /api/v1/applications/:id/submit`
- [ ] On success → redirect to confirmation page
- [ ] Lock editing after submit (`isLocked === true`)
- [ ] Show success animation + application number

**Acceptance Criteria**:
- Cannot submit incomplete mandatory sections
- Status updates to `"submitted"` in backend
- Form becomes read-only after submission

---

### PHASE 5 — MY APPLICATIONS PAGE

#### TASK A11 — MyApplications.jsx

- [ ] Route: `/my-applications`
- [ ] `GET /api/v1/applications` with pagination query params
- [ ] Render application cards with:
  - Job title, advertisement number
  - Status badge (color-coded)
  - Applied date, deadline
- [ ] Status color mapping:
  - `draft` → gray
  - `submitted` → blue
  - `under_review` → yellow
  - `shortlisted` → green
  - `rejected` → red
  - `selected` → gold
  - `withdrawn` → gray
- [ ] Action buttons: "Continue Draft", "View", "Withdraw"
- [ ] Withdraw → `POST /api/v1/applications/:id/withdraw` with `{ reason }`

**Acceptance Criteria**:
- Withdraw calls correct endpoint and refreshes list
- Pagination works correctly
- Empty state shown when no applications exist

---

### 🔵 DONE CRITERIA FOR DEVELOPER A

- [ ] Full apply → fill → submit flow works end-to-end
- [ ] File uploads (photo, signature, PDF) functional
- [ ] Draft resume works after page refresh
- [ ] My Applications page stable with all status badges

---

---

## 🟣 Developer B — Section Components + Admin Portal

**Scope**: All form section UIs, admin dashboard, admin application management, admin user management, UX polish.

**Rules for all section components**:
- Must use `SectionLayout` wrapper (built by Dev A)
- Must use mirrored constants from `client/src/constants/`
- Must be fully controlled forms (no local uncontrolled state)
- Zero API calls inside section components

---

### PHASE 1 — SECTION COMPONENTS

#### WAVE 1 — CORE SECTIONS

##### TASK B1 — PersonalDetails.jsx

- [ ] Fields: Name, DOB, Gender, Category, Nationality, Address (with State dropdown)
- [ ] All enums from constants file (`GENDER`, `MARITAL_STATUS`, `INDIAN_STATES`, `JOB_CATEGORIES`)
- [ ] Field-level validation with error display

---

##### TASK B2 — Education.jsx

- [ ] Fields: Degree level, Field of study, Institution, Year, Percentage/CGPA
- [ ] Support adding multiple education entries
- [ ] Support removing entries
- [ ] Use `DEGREE_LEVELS` and `EXAM_TYPE` from constants

---

##### TASK B3 — Experience.jsx

- [ ] Fields: Role, Organization, Organization type, Appointment type, Start/End dates
- [ ] Support multiple entries with add/remove
- [ ] Use `APPOINTMENT_TYPE`, `ORGANIZATION_TYPE`, `EXPERIENCE_TYPE` from constants

---

##### TASK B4 — Referees.jsx

- [ ] Fields: Name, Designation, Institution, Email, Phone
- [ ] Support multiple referees (min 2, max 5)
- [ ] Email format validation

---

##### TASK B5 — FinalDocuments.jsx

- [ ] Use `PdfUpload` component (built by Dev A)
- [ ] Display instruction text: "Merge all certificates into one PDF ≤ 3 MB"
- [ ] Pass `maxSize={3}` prop to PdfUpload

---

##### TASK B6 — Declaration.jsx

- [ ] Checkbox: "I hereby declare that all information is true..."
- [ ] Digital signature text field
- [ ] Must block "Next" / "Submit" if checkbox unchecked

---

#### WAVE 2 — ACADEMIC SECTIONS

Build each as a multi-entry form with add/remove row support:

- [ ] `PublicationsJournal.jsx` — Title, journal name, journal type (`JOURNAL_TYPE`), year, authors, DOI
- [ ] `PublicationsConference.jsx` — Title, conference name, conference type (`CONFERENCE_TYPE`), year
- [ ] `PublicationsBooks.jsx` — Title, publisher, book type (`BOOK_TYPE`), year
- [ ] `PhDSupervision.jsx` — Student name, thesis title, PhD status (`PHD_STATUS`), year
- [ ] `Patents.jsx` — Title, patent number, patent status (`PATENT_STATUS`), year
- [ ] `SponsoredProjects.jsx` — Title, agency, amount, project status (`PROJECT_STATUS`)
- [ ] `ConsultancyProjects.jsx` — Title, organization, amount, project status
- [ ] `OrganizedPrograms.jsx` — Program name, role, dates, level
- [ ] `SubjectsTaught.jsx` — Subject name, subject level (`SUBJECT_LEVEL`), institution, years
- [ ] `CreditPoints.jsx` — Manual activities UI (add/remove rows with activity name + points)
- [ ] `OtherInfo.jsx` — Dynamic fields rendered from `jobSnapshot.customFields` (text/number/date/dropdown based on `fieldType`)

**Acceptance Criteria for all Wave 2**:
- Each saves structured array data
- Each uses constants for dropdown enums
- Each wraps in `SectionLayout`

> 🔔 **BACKEND REQUEST #3 — Trigger: After completing Wave 2**
> Ask the backend developer to start **Phase C (PDF Receipt + Full-text Search)**.
> **Why now**: The admin portal is about to be built (Tasks B7–B9), which needs the "Download Receipt" and "Search by Qualification" features. If the backend delivers these by the time Dev B finishes B8, the admin portal is fully featured.
> **What to request**:
> - `GET /applications/:id/receipt` — PDF generation endpoint
> - MongoDB full-text index on application data for search

---

### PHASE 2 — ADMIN PORTAL

#### TASK B7 — AdminDashboard.jsx

- [ ] Route: `/admin` (replace current redirect to `/admin/jobs`)
- [ ] Fetch `GET /api/v1/admin/dashboard/stats`
- [ ] Summary cards: total applications by status, active/closed jobs
- [ ] Recent applications list (last 10)
- [ ] Quick link to view specific job stats: `GET /api/v1/admin/dashboard/stats/job/:jobId`

---

#### TASK B8 — AdminApplications.jsx

- [ ] Route: `/admin/applications`
- [ ] Table view with columns: applicant email, job title, status, applied date, actions
- [ ] Filters: status dropdown, job dropdown
- [ ] Pagination
- [ ] Checkbox selection for bulk operations
- [ ] Bulk status update → `POST /api/v1/admin/applications/bulk-status`
- [ ] Export button → `GET /api/v1/admin/applications/export` (blob download)

- [ ] Search box → full-text search across applicant data (**⏳ Needs Backend Phase C**)

> ⚠️ **If full-text search endpoint is not ready yet**: Build the table without the search box. Add a disabled search input with tooltip "Coming soon". Slot it in when the backend delivers the endpoint.

---

#### TASK B9 — AdminApplicationDetail.jsx

- [ ] Route: `/admin/applications/:id`
- [ ] Fetch `GET /api/v1/admin/applications/:id`
- [ ] Render all filled sections as read-only views with PDF links
- [ ] Status change dropdown → `PATCH /api/v1/admin/applications/:id/status`
- [ ] Review notes textarea → `PATCH /api/v1/admin/applications/:id/review`
- [ ] Per-section verification toggle → `PATCH /api/v1/admin/applications/:id/verify-section`
- [ ] Status history timeline
- [ ] "Download Application Receipt" button → `GET /applications/:id/receipt` (**⏳ Needs Backend Phase C**)

> ⚠️ **If PDF receipt endpoint is not ready yet**: Show the button in disabled state with "Receipt generation coming soon" tooltip. Enable it once the backend delivers the endpoint.

---

#### TASK B10 — AdminUsers.jsx

- [ ] Route: `/admin/users`
- [ ] Create admin/reviewer form → `POST /api/v1/admin/users`
- [ ] List current admin/reviewer accounts
- [ ] Promote user action → `PATCH /api/v1/admin/users/:userId/promote`
- [ ] Role-based visibility (super_admin sees promote button; admin only sees create reviewer)

---

### PHASE 3 — UX POLISH

#### TASK B11 — Skeleton Loaders

Replace spinner with skeleton cards in:
- [ ] `Jobs.jsx`
- [ ] `JobDetail.jsx`
- [ ] `Notices.jsx`
- [ ] `MyApplications.jsx`
- [ ] `AdminApplications.jsx`

---

#### TASK B12 — Empty States

Add friendly empty state illustrations to:
- [ ] Application list (no applications yet)
- [ ] Admin application list (no applications for this job)
- [ ] Admin users list
- [ ] Jobs listing (no matching jobs)
- [ ] Notices listing (no notices)

---

#### TASK B13 — Mobile Sidebar Fix

- [ ] Fix z-index stacking context in `AdminLayout.jsx`
- [ ] Ensure hamburger button is always reachable on small screens
- [ ] Test overlay closes correctly on link click

---

### 🟣 DONE CRITERIA FOR DEVELOPER B

- [ ] All 19 section components functional and using `SectionLayout`
- [ ] Admin dashboard operational with live stats
- [ ] Admin can view, change status, and review applications
- [ ] Bulk update works from application list
- [ ] Mobile admin sidebar usable

---

---

## 📋 How to Use This Document

1. Each developer copies their section into their task tracker
2. Work **strictly top to bottom** — do not skip tasks
3. Mark checkboxes only **after manual verification**
4. **Sync daily** after finishing one major task group
5. Dev B depends on Dev A's `SectionLayout` (Task A5) and upload components (Tasks A6, A7) — coordinate timing
6. When you hit a 🔔 marker, **immediately** notify the backend developer

### Dependency Graph

```
Dev A: A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 → A10 → A11
        🔔#1                                 🔔#2
        (Email)                               (Payment)
                                ↓       ↓
Dev B:                    B1–B6 start  B5 uses PdfUpload
                          after A5     after A7
                                              → Wave 2 → 🔔#3 → B7–B10
                                                         (PDF/Search)

Dev B (Polish):           B11–B13 after all pages exist
```

> **Key sync point**: Dev B cannot start any section component until Dev A delivers `SectionLayout` (Task A5). Plan accordingly.

---

## 🔔 Backend Request Timeline

This table shows **when** the frontend should request each backend feature, **why** at that moment, and **what happens** if the backend isn't ready.

| # | Trigger Point | Backend Feature Needed | Why This Moment | If Backend Not Ready Yet |
|---|---|---|---|---|
| 🔔 1 | After **Task A1** (Context setup) | **Phase B**: Email Verification (`/auth/verify-email`, `/auth/resend-otp`) | Gives backend ~2 weeks lead time. By the time users can sign up and apply, verification should be ready. | Frontend proceeds without email gate. Add the "Verify Email" screen later as a drop-in route guard. Zero rework. |
| 🔔 2 | After **Task A8** (Credit Points) | **Phase A**: Payment Gateway (`/applications/:id/payment/initiate`, `/payment/verify`, `paymentStatus`) | The entire form flow is functional. Payment is the last step before submit. Need it ASAP. | Build submit flow without payment step. Add `// TODO` placeholder. Payment UI slots in later as Task A10b. |
| 🔔 3 | After **Wave 2** (All section components done) | **Phase C**: PDF Receipt (`/applications/:id/receipt`) + Full-text Search (MongoDB index) | Admin portal build is starting. "Download Receipt" and "Search" are needed for Tasks B8 and B9. | Show disabled buttons with "Coming soon" tooltip. Enable when backend delivers. No code restructuring needed. |

### Visual Timeline

```
Week 1–2: Dev A builds A1–A5  ───────> 🔔#1 Request Email Verification
Week 2–3: Dev A builds A6–A8  ───────> 🔔#2 Request Payment Gateway
          Dev B builds B1–B6 (sections)
Week 3–4: Dev A builds A9–A11
          Dev B builds Wave 2  ──────> 🔔#3 Request PDF Receipt + Search
Week 4–5: Dev B builds B7–B10 (admin)
          Backend delivers Payment ──> Dev A slots in A10b (Payment Step)
          Backend delivers Email ───> Dev A adds email verification gate
Week 5–6: Dev B builds B11–B13 (polish)
          Backend delivers PDF/Search > Dev B enables receipt + search buttons
```

> **Key Principle**: The frontend is never fully blocked. Every backend dependency has a graceful fallback (disabled button, placeholder, skip). Request early, integrate when ready.
