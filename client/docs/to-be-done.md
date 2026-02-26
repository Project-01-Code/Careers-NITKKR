# Client — Phased Development Roadmap

> **NIT KKR Careers Portal — Frontend**
> Last updated: February 2026 | Owner: Frontend Team

This file organises all pending frontend work into sequential development phases, each building on the last. Every task maps directly to what the backend already supports.

---

## 🏗️ Backend Dependencies & Blocker Map

**High-Level Status**: The frontend is **90% unblocked**. The existing API supports all core CRUD operations for applications, sections, and admin management.

| Frontend Area | Status | Blocker Step | Backend Dependency |
|---|---|---|---|
| **Application Form** | 🚀 **Unblocked** | Last step (Submit) | **Phase A** (Payment Gateway) — only if job has a fee. |
| **Authentication** | 🚀 **Unblocked** | After Registration | **Phase B** (Email Verification) — only for the "Verify" screen. |
| **User Dashboard** | 🚀 **Unblocked** | "Download Receipt" | **Phase C** (PDF Generation) — for the receipt download link. |
| **Admin Panel** | 🚀 **Unblocked** | Advanced Search | **Phase C** (Full-text Index) — for searching applicant data. |
| **Application List** | 🚀 **Unblocked** | Export to PDF | **Phase C** (PDF Generation) — for generating the print view. |

---

## ✅ Already Done (Baseline)

| Page/Feature | Route | Notes |
|---|---|---|
| Home page | `/` | Category cards, hero section |
| Jobs listing | `/jobs` | Search, filters, pagination |
| Job detail | `/jobs/:id` | Full job info, apply CTA |
| Notices | `/notices` | Paginated listing |
| Login / Signup | `/login`, `/signup` | Cookie-based auth |
| Profile page | `/profile` | View + edit profile |
| Admin — Job CRUD | `/admin/jobs` | Create, edit, list |
| Admin — Notices | `/admin/notices` | Create, archive |
| Auth context | — | Token refresh, session restore |
| Protected route | — | Role-based guard |

---

## Phase 1 — Core Application Flow (Critical Path)

> **Goal**: A user can start, fill, and submit a full job application end-to-end.

### 1.1 — Dynamic Application Form

**Why**: `ApplicationForm.jsx` currently has 4 hardcoded placeholder steps. The backend drives the form structure dynamically via `jobSnapshot.requiredSections` — the frontend must follow.

**What to build**:
- On form mount, call `GET /api/v1/applications` (or create via `POST /api/v1/applications { jobId }`) and read `application.jobSnapshot.requiredSections`
- Render only the sections required by that job — driven by the `sectionType` array
- Each step maps to a section component (see 1.2)
- The stepper shows section progress, marking complete/incomplete based on `sections[type].isComplete`

**API used**:
```
POST   /api/v1/applications                      → Create draft application
GET    /api/v1/applications/:id                  → Load existing application
PATCH  /api/v1/applications/:id/sections/:type   → Save section data (body: { data: {...} })
POST   /api/v1/applications/:id/sections/:type/validate → Validate section before Next
```

---

### 1.2 — Section Step Components

Build one React component per section type. All save via `PATCH /api/v1/applications/:id/sections/:sectionType` with `body: { data: {...} }`.

| Section Type | Component | Input Types |
|---|---|---|
| `personal` | `PersonalDetails.jsx` ✅ (exists, extend) | Name, DOB, gender, address, category, nationality |
| `photo` | `PhotoUpload.jsx` | JPEG ≤ 200KB — uses image endpoint (see 1.3) |
| `signature` | `SignatureUpload.jsx` | JPEG ≤ 50KB — uses image endpoint (see 1.3) |
| `education` | `Education.jsx` ✅ (exists, extend) | Degree level, field, institution, year, percentage |
| `experience` | `Experience.jsx` ✅ (exists, extend) | Role, org, org type, appointment type, dates |
| `publications_journal` | `PublicationsJournal.jsx` | Title, journal name, journal type, year, authors, DOI |
| `publications_conference` | `PublicationsConference.jsx` | Title, conference name, conference type, year |
| `phd_supervision` | `PhDSupervision.jsx` | Student name, thesis title, PHD status, year |
| `patents` | `Patents.jsx` | Title, patent number, patent status, year |
| `publications_books` | `PublicationsBooks.jsx` | Title, publisher, book type, year |
| `organized_programs` | `OrganizedPrograms.jsx` | Program name, role, dates, level |
| `sponsored_projects` | `SponsoredProjects.jsx` | Title, agency, amount, project status |
| `consultancy_projects` | `ConsultancyProjects.jsx` | Title, organization, amount, project status |
| `subjects_taught` | `SubjectsTaught.jsx` | Subject name, subject level, institution, years |
| `credit_points` | `CreditPoints.jsx` | Manual activities list + auto-calculated display |
| `referees` | `Referees.jsx` | Name, designation, institution, email, phone |
| `other_info` | `OtherInfo.jsx` | Custom key-value fields from `jobSnapshot.customFields` |
| `final_documents` | `FinalDocuments.jsx` | Merged PDF ≤ 3MB upload (see 1.4) |
| `declaration` | `Declaration.jsx` | Checkbox confirmation + digital signature |

> **Tip**: Import field-level enums from a mirrored `client/src/constants/` file (see Phase 3, item 3.6) to keep these in sync with the backend's `constants.js`.

---

### 1.3 — Photo & Signature Upload

**API** — these are separate endpoints from the standard section save:

```
POST   /api/v1/applications/:id/sections/photo/image
       Content-Type: multipart/form-data
       Field name: "image" (JPEG, max 200KB)

POST   /api/v1/applications/:id/sections/signature/image
       Content-Type: multipart/form-data
       Field name: "image" (JPEG, max 50KB)

DELETE /api/v1/applications/:id/sections/photo/image
DELETE /api/v1/applications/:id/sections/signature/image
```

**UI requirements**:
- Drag-and-drop or click-to-upload file picker
- Client-side size validation before upload (200KB / 50KB)
- Preview of uploaded image with a "Replace" button
- Show `imageUrl` from saved section data if already uploaded

---

### 1.4 — Final Documents Upload

```
POST   /api/v1/applications/:id/sections/final_documents/pdf
       Content-Type: multipart/form-data
       Field name: "pdf" (PDF only, max 3MB — enforced server-side)

DELETE (not needed — replaced on re-upload)
```

**UI requirements**:
- File size warning: "Merge all certificates into one PDF ≤ 3MB"
- Client-side size validation before upload
- Success state shows filename + a link to the uploaded PDF

---

### 1.5 — Per-Section PDF Upload

Some sections have `requiresPDF: true` in their config. Check the `sectionConfig` from `jobSnapshot.requiredSections`.

```
POST   /api/v1/applications/:id/sections/:sectionType/pdf
       Content-Type: multipart/form-data
       Field name: "pdf" (PDF only, max 10MB per file)

DELETE /api/v1/applications/:id/sections/:sectionType/pdf
```

**UI**: Render a PDF upload widget conditionally at the bottom of each section step when `sectionConfig.requiresPDF === true`. Show `pdfLabel` and `maxPDFSize` as instructional text.

---

### 1.6 — Credit Points Summary Widget

Called **only** on the `credit_points` step. Auto-credits are calculated from other saved sections.

```
GET /api/v1/applications/:id/sections/credit_points/summary
```

Returns:
```json
{
  "autoCredits": { "publications": 12, "projects": 5, "autoTotal": 17 },
  "manualTotal": 8,
  "grandTotal": 25,
  "manualActivities": [...]
}
```

Display as a formatted table. The `manualActivities` array is saved via the standard section save API.

---

### 1.7 — Form Validation & Submission

**Step validation** (call before allowing Next):
```
POST /api/v1/applications/:id/sections/:sectionType/validate
```
Returns `{ isValid, errors: [{ field, message }] }`. Surface inline field errors.

**Pre-submission check** (validates ALL mandatory sections at once):
```
POST /api/v1/applications/:id/validate-all
```

**Submit**:
```
POST /api/v1/applications/:id/submit
```
Guards: all mandatory sections complete, (future: payment verified). On success → redirect to a "Submitted" confirmation page.

**Withdraw** (from MyApplications page):
```
POST /api/v1/applications/:id/withdraw
Body: { reason: "string" }
```

---

### 1.8 — My Applications Page

New page: `src/pages/MyApplications.jsx` — route `/my-applications`.

**API**:
```
GET /api/v1/applications
Query: status, jobId, page, limit
```

**UI requirements**:
- Application cards showing: job title, advert no., status badge, applied date, deadline
- Status colour coding: draft=gray, submitted=blue, under_review=yellow, shortlisted=green, rejected=red, selected=gold, withdrawn=gray
- Actions: "Continue Draft", "View", "Withdraw"
- Pagination

---

## Phase 2 — Admin Portal

> **Goal**: Admins can manage applications, view analytics, and manage users.

### 2.1 — Admin Dashboard

New page: `src/pages/admin/AdminDashboard.jsx` — make it the default landing for `/admin` (remove current redirect to `/admin/jobs`).

**API**:
```
GET /api/v1/admin/dashboard/stats
GET /api/v1/admin/dashboard/stats/job/:jobId
```

`/stats` returns summary counts. Build widgets for:
- Total applications: draft / submitted / under_review / shortlisted / selected / rejected
- Active jobs count, closed jobs count
- Recent applications list

---

### 2.2 — Admin Application List

New page: `src/pages/admin/AdminApplications.jsx` — route `/admin/applications`.

**API**:
```
GET /api/v1/admin/applications
Query: status, jobId, page, limit

GET /api/v1/admin/applications/job/:jobId
→ Applications filtered for a specific job
```

**UI**: Searchable table with columns: applicant email, job title, status, applied date, actions.

Add link from each job card in `AdminJobs.jsx` → "View Applications".

---

### 2.3 — Admin Application Detail

New page: `src/pages/admin/AdminApplicationDetail.jsx` — route `/admin/applications/:id`.

**API**:
```
GET  /api/v1/admin/applications/:id
     → Full application with all sections, snapshot data

PATCH /api/v1/admin/applications/:id/status
      Body: { status: "under_review"|"shortlisted"|"rejected"|"selected", note?: string }

PATCH /api/v1/admin/applications/:id/review
      Body: { notes: string }
      → Add review notes (accessible to reviewers too)

PATCH /api/v1/admin/applications/:id/verify-section
      Body: { sectionType, isVerified, notes? }
      → Mark individual section as verified
```

**UI**: Read-only view of all filled sections with PDF links. Status change dropdown + status history timeline.

---

### 2.4 — Bulk Status Update

Available from the `AdminApplications.jsx` list via checkbox selection.

```
POST /api/v1/admin/applications/bulk-status
Body: { applicationIds: [...], status: "shortlisted", note?: "..." }
```

---

### 2.5 — Export Applications

```
GET /api/v1/admin/applications/export
Query: jobId, status (optional filters)
```

Trigger as a download button. The backend returns a file — handle as a blob download in axios.

---

### 2.6 — Admin User Management

New page: `src/pages/admin/AdminUsers.jsx` — route `/admin/users`.

**API**:
```
POST  /api/v1/admin/users
      Body: { email, password, role: "admin"|"reviewer" }
      → Create a new admin or reviewer (super_admin creates admin; admin creates reviewer)

PATCH /api/v1/admin/users/:userId/promote
      Body: { role: "admin" }
      → Promote existing user (super_admin only)
```

**UI**: Form to create admin/reviewer, list of current admin/reviewer accounts.

---

## Phase 3 — UX Polish & Robustness

> **Goal**: Production-quality feel. No rough edges.

### 3.1 — Consistent API Error Handling

Currently: errors shown inconsistently. Fix: in `api.js` response interceptor, extract `error.response?.data?.message` and call `toast.error(message)` globally for all non-401/non-refresh errors.

### 3.2 — ProtectedRoute — 403 Forbidden Page

When an authenticated user hits a route they don't have permission for, show a proper `403.jsx` page instead of redirecting to `/`.

### 3.3 — Loading Skeletons

Replace all `<Spinner />` loaders with Tailwind CSS skeleton cards that match the real content shape. Affects: `Jobs.jsx`, `JobDetail.jsx`, `Notices.jsx`, `MyApplications.jsx`, `AdminApplications.jsx`.

### 3.4 — Empty State Illustrations

All list pages need a friendly empty state (illustration + helpful text) when no results are returned.

### 3.5 — Mobile — Admin Sidebar Fix

`AdminLayout.jsx`: hamburger button z-index conflicts with the sticky header. Fix stacking context and ensure the sidebar toggle is always reachable on small screens.

### 3.6 — Client-Side Constants Mirror

Create `client/src/constants/index.js` mirroring the relevant enums from `server/src/constants.js`:

```js
// mirrors server constants.js — keep in sync
export const APPLICATION_STATUS = { DRAFT: 'draft', SUBMITTED: 'submitted', ... };
export const JOB_SECTION_TYPE = { PERSONAL: 'personal', PHOTO: 'photo', ... };
export const GENDER = ['Male', 'Female', 'Transgender'];
export const MARITAL_STATUS = [...];
export const EXAM_TYPE = [...];
// etc.
```

Use these in all form components instead of hardcoded strings.

### 3.7 — `client/.env.example`

Add `client/.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Phase 4 — Testing & Production Ready

> **Goal**: Confidence before going live.

### 4.1 — Unit Tests

Setup: Vitest + React Testing Library.

Priority targets:
- `AuthContext` — login, logout, session restore, token refresh
- `ProtectedRoute` — unauthenticated redirect, role guard
- Section form components — field validation, save/error states
- `api.js` interceptor — 401 handling, queue flush

### 4.2 — E2E Tests

Setup: Playwright or Cypress.

Critical user journeys:
1. Sign up → verify profile → browse jobs
2. Apply for job → fill all sections → upload documents → submit
3. Admin: create job → publish → view applications → change status

### 4.3 — Accessibility Audit

Run `axe-core` or Lighthouse. Target: WCAG 2.1 AA compliance.

Must fix:
- `aria-label` on all icon-only buttons (sidebar toggle, logout, etc.)
- `aria-live` regions on form validation error areas
- Keyboard navigation through multi-step form stepper

---

## Waiting on Backend (Parallel Work)

These frontend tasks cannot start until the corresponding backend phase is complete. Tracked in `server/docs/Todo.md`.

| Frontend Task | Waiting For |
|---|---|
| Payment step in application form | **Phase A**: Razorpay/PayU integration + `paymentStatus` on Application model |
| Email verification gate on signup | **Phase B**: OTP/token email verification endpoint |
| "Application Receipt" PDF download | **Phase C**: PDF generation endpoint |
| Full-text search in application list | **Phase C**: MongoDB full-text index on application data |
