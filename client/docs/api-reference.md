# Backend API Reference — Client Guide

> **NIT KKR Careers Portal**
> Base URL: `http://localhost:8000/api/v1`  
> All requests/responses use JSON unless marked `multipart/form-data`.

---

## How Auth Works

The API uses **HTTP-only cookies**. You do not need to manually set `Authorization` headers — the browser sends cookies automatically on every request.

- `accessToken` cookie: short-lived (1 day), required for protected routes
- `refreshToken` cookie: long-lived (7 days), used to silently renew access tokens

The `api.js` interceptor already handles 401 → auto-refresh → retry. **No manual token management needed.**

---

## Standard Response Shape

Every response — success or error — follows this envelope:

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Human-readable message",
  "success": true
}
```

Error responses additionally have `"errors"`:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Validation failed",
  "success": false,
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

Access data via: `response.data.data`  
Access message via: `response.data.message`  
Access field errors via: `response.data.errors`

---

## 1. Auth — `/auth`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| `POST` | `/auth/register` | ❌ | `{ email, password }` | Created user object |
| `POST` | `/auth/login` | ❌ | `{ email, password }` | User + sets cookies |
| `DELETE` | `/auth/logout` | 🍪 | — | Clears cookies |
| `POST` | `/auth/refresh-token` | ❌ | — | Refreshes access cookie |
| `GET` | `/auth/profile` | 🍪 | — | Full user profile |
| `PATCH` | `/auth/profile` | 🍪 | `{ profile: {...} }` | Updated user |

**Profile update body**:
```json
{
  "profile": {
    "firstName": "Kunal",
    "lastName": "Sharma",
    "phone": "9876543210",
    "dateOfBirth": "1995-06-15",
    "nationality": "Indian"
  }
}
```

**User object shape** (returned from login/profile):
```json
{
  "_id": "...",
  "email": "user@example.com",
  "role": "applicant",
  "profile": {
    "firstName": "Kunal",
    "lastName": "Sharma",
    "phone": "...",
    "dateOfBirth": "...",
    "nationality": "Indian"
  },
  "applicationIds": [...]
}
```

**Role values**: `applicant` | `reviewer` | `admin` | `super_admin`

---

## 2. Departments — `/departments`

| Method | Path | Auth | Returns |
|---|---|---|---|
| `GET` | `/departments` | ❌ | Array of `{ _id, name, code }` |

Use the `_id` when creating jobs. Departments are seeded — they don't change.

---

## 3. Notices — `/notices`

| Method | Path | Auth | Content-Type | Notes |
|---|---|---|---|---|
| `GET` | `/notices` | ❌ | JSON | Query: `page`, `limit`, `category` |
| `POST` | `/notices` | 🔑 Admin | `multipart/form-data` | Fields below |
| `PATCH` | `/notices/:id` | 🔑 Admin | `multipart/form-data` | All fields optional |
| `PATCH` | `/notices/:id/archive` | 🔑 Admin | JSON | Soft-archive |

**Form-data fields for POST/PATCH**:
- `heading` (text, required on create)
- `advtNo` (text, optional)
- `category` (text, optional — e.g. `"Faculty Recruitment"`)
- `externalLink` (text, optional)
- `file` (file, optional — PDF only, max 10MB)

**Notice object shape**:
```json
{
  "_id": "...",
  "heading": "Recruitment Notice 2026",
  "advtNo": "NITK/FAC/2026/01",
  "category": "Faculty Recruitment",
  "pdfUrl": "https://res.cloudinary.com/...",
  "externalLink": null,
  "isActive": true,
  "createdAt": "2026-02-01T..."
}
```

---

## 4. Public Jobs — `/jobs`

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/jobs` | ❌ | Active jobs only (published, deadline not passed) |
| `GET` | `/jobs/:id` | ❌ | Single job by MongoDB ID |
| `GET` | `/jobs/by-advertisement/:advertisementNo` | ❌ | By advert number |

**Query parameters for `GET /jobs`**:
- `designation` — e.g. `"Assistant Professor Grade-II"`
- `payLevel` — `"10"` ... `"14A"`
- `recruitmentType` — `"external"` or `"internal"`
- `category` — `"GEN"` `"SC"` `"ST"` `"OBC"` `"EWS"` `"PwD"`
- `department` — ObjectId
- `search` — text search on title
- `sortBy` — `"publishDate"` | `"applicationEndDate"` | `"positions"`
- `sortOrder` — `"asc"` | `"desc"`
- `page` — default `1`
- `limit` — default `10`, max `100`

**Job object shape** (public fields):
```json
{
  "_id": "...",
  "title": "Assistant Professor - CSE",
  "advertisementNo": "NITK/FAC/2026/CSE/001",
  "department": { "_id": "...", "name": "Computer Science & Engineering" },
  "designation": "Assistant Professor Grade-II",
  "grade": "Grade-II",
  "payLevel": "10",
  "positions": 3,
  "recruitmentType": "external",
  "categories": ["GEN", "SC", "OBC"],
  "applicationFee": { "general": 1000, "sc_st": 0, "obc": 500, "isRequired": true },
  "eligibilityCriteria": {
    "minAge": 21, "maxAge": 60, "nationality": ["Indian"],
    "minExperience": 0, "requiredDegrees": [{ "level": "PhD", "field": "CSE" }]
  },
  "description": "...",
  "requiredSections": [
    { "sectionType": "personal", "isMandatory": true, "requiresPDF": false },
    { "sectionType": "education", "isMandatory": true, "requiresPDF": true, "pdfLabel": "Degree Certificates", "maxPDFSize": 5 }
  ],
  "publishDate": "2026-02-01T...",
  "applicationStartDate": "2026-03-01T...",
  "applicationEndDate": "2026-04-30T...",
  "status": "published"
}
```

> **Key**: `requiredSections` is what drives the dynamic application form. Use this array to know which steps to render.

---

## 5. Applications (Applicant) — `/applications`

All routes require authentication (`applicant` role).

### 5.1 Application CRUD

| Method | Path | Body / Query | Notes |
|---|---|---|---|
| `POST` | `/applications` | `{ jobId }` | Create draft. Returns full application object |
| `GET` | `/applications` | `?status&jobId&page&limit` | List user's own applications |
| `GET` | `/applications/:id` | — | Full application (populates job + user) |
| `DELETE` | `/applications/:id` | — | Delete — **only works on drafts** |

**Application object shape**:
```json
{
  "_id": "...",
  "applicationNumber": "APP-2026-A3F2D8E1",
  "userId": "...",
  "jobId": { "title": "...", "advertisementNo": "...", "applicationEndDate": "..." },
  "status": "draft",
  "jobSnapshot": {
    "title": "...",
    "jobCode": "NITK/FAC/2026/CSE/001",
    "department": "Computer Science & Engineering",
    "requiredSections": [...]
  },
  "sections": {
    "personal": { "data": {...}, "savedAt": "...", "isComplete": true },
    "education": { "data": {...}, "pdfUrl": "...", "savedAt": "...", "isComplete": true },
    "photo": { "imageUrl": "...", "savedAt": "...", "isComplete": true }
  },
  "isLocked": false,
  "submittedAt": null,
  "createdAt": "..."
}
```

**Application status values**: `draft` | `submitted` | `under_review` | `shortlisted` | `rejected` | `selected` | `withdrawn`

---

### 5.2 Section Data Save

```
PATCH /applications/:id/sections/:sectionType
Content-Type: application/json
Body: { "data": { ... section fields ... } }
```

The `sectionType` must match one of the types in `jobSnapshot.requiredSections`.

Returns the updated section object:
```json
{
  "data": { "firstName": "Kunal", ... },
  "savedAt": "2026-02-26T...",
  "isComplete": true
}
```

---

### 5.3 Section Validation

```
POST /applications/:id/sections/:sectionType/validate
```

Call before advancing to the next step. Returns:
```json
{
  "isValid": false,
  "errors": [
    { "field": "phone", "message": "Phone number is required" },
    { "field": "pdf", "message": "PDF upload is required" }
  ]
}
```

---

### 5.4 Section PDF Upload/Delete

```
POST   /applications/:id/sections/:sectionType/pdf
       Content-Type: multipart/form-data
       Field: "pdf" (PDF file, max 10MB)

DELETE /applications/:id/sections/:sectionType/pdf
```

> Use this for sections with `requiresPDF: true` in the job config.

---

### 5.5 Photo & Signature Upload/Delete

```
POST   /applications/:id/sections/photo/image
       Content-Type: multipart/form-data
       Field: "image" (JPEG only, max 200KB)

DELETE /applications/:id/sections/photo/image

POST   /applications/:id/sections/signature/image
       Content-Type: multipart/form-data
       Field: "image" (JPEG only, max 50KB)

DELETE /applications/:id/sections/signature/image
```

Returns:
```json
{ "sectionType": "photo", "imageUrl": "https://res.cloudinary.com/..." }
```

---

### 5.6 Final Documents Upload

```
POST /applications/:id/sections/final_documents/pdf
     Content-Type: multipart/form-data
     Field: "pdf" (PDF file, max 3MB — server enforces this)
```

Returns:
```json
{ "pdfUrl": "https://res.cloudinary.com/..." }
```

---

### 5.7 Credit Points Summary

```
GET /applications/:id/sections/credit_points/summary
```

Returns:
```json
{
  "autoCredits": {
    "journalPublications": 8,
    "conferencePublications": 4,
    "sponsoredProjects": 5,
    "autoTotal": 17
  },
  "manualTotal": 8,
  "grandTotal": 25,
  "manualActivities": [
    { "activityName": "Faculty Development", "points": 4 }
  ]
}
```

Auto-credits are computed by the server from other saved sections. You only need to save `manualActivities` via the standard section save API.

---

### 5.8 Submission

**Pre-submission check** (validates all mandatory sections):
```
POST /applications/:id/validate-all
```

Returns:
```json
{
  "isValid": false,
  "incompleteSections": [
    { "section": "referees", "errors": [{ "field": "data", "message": "Section data is required" }] }
  ]
}
```

**Submit**:
```
POST /applications/:id/submit
```

On success: `status` changes to `"submitted"`, `submittedAt` is set, `isLocked` becomes `true`.

**Withdraw**:
```
POST /applications/:id/withdraw
Body: { "reason": "Found a better opportunity" }
```

Only works if `status` is `submitted`, `under_review`, or `shortlisted`.

---

## 6. Admin — Jobs — `/admin/jobs`

Requires: `admin` or `super_admin` role.

| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/admin/jobs` | Full job JSON | Creates in `draft` status |
| `GET` | `/admin/jobs` | Query filters | Same filters as public + includes draft/closed |
| `GET` | `/admin/jobs/:id` | — | Admin view (includes sensitive fields) |
| `PATCH` | `/admin/jobs/:id` | Partial job JSON | Cannot update closed jobs |
| `DELETE` | `/admin/jobs/:id` | — | Soft delete |
| `POST` | `/admin/jobs/:id/publish` | — | Requires ≥1 requiredSection configured |
| `POST` | `/admin/jobs/:id/close` | — | Closes the job early |

---

## 7. Admin — Applications — `/admin/applications`

| Role required | Routes |
|---|---|
| `admin` or `reviewer` | GET (list, single, by-job), PATCH review, PATCH verify-section |
| `admin` or `super_admin` | PATCH status, POST bulk-status, GET export |

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/admin/applications` | `?status&jobId&page&limit` | All applications |
| `GET` | `/admin/applications/export` | `?jobId&status` | Returns downloadable file |
| `GET` | `/admin/applications/job/:jobId` | — | Applications for one job |
| `GET` | `/admin/applications/:id` | — | Full application detail |
| `PATCH` | `/admin/applications/:id/status` | `{ status, note? }` | Change status |
| `PATCH` | `/admin/applications/:id/review` | `{ notes }` | Add review notes |
| `PATCH` | `/admin/applications/:id/verify-section` | `{ sectionType, isVerified, notes? }` | Verify a section |
| `POST` | `/admin/applications/bulk-status` | `{ applicationIds: [...], status, note? }` | Bulk status update |

**Valid status transitions for PATCH status**:
`under_review` → `shortlisted` → `selected` | `rejected`

---

## 8. Admin — Dashboard — `/admin/dashboard`

Requires: `admin` or `reviewer`.

| Method | Path | Returns |
|---|---|---|
| `GET` | `/admin/dashboard/stats` | Aggregate counts across all jobs |
| `GET` | `/admin/dashboard/stats/job/:jobId` | Stats for one specific job |

---

## 9. Admin — Users — `/admin/users`

| Method | Path | Role Required | Body | Notes |
|---|---|---|---|---|
| `POST` | `/admin/users` | `super_admin` or `admin` | `{ email, password, role }` | admin creates reviewer; super_admin creates admin |
| `PATCH` | `/admin/users/:userId/promote` | `super_admin` only | `{ role: "admin" }` | Promote to admin |

---

## 10. Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600.5,
  "environment": "development",
  "timestamp": "2026-02-26T..."
}
```

---

## Axios Usage Examples

```js
import api from '../services/api'; // configured with baseURL and credentials

// GET with query params
const { data } = await api.get('/jobs', { params: { designation: 'Assistant Professor Grade-II', page: 1, limit: 10 } });
const jobs = data.data.jobs;

// POST JSON
const { data } = await api.post('/applications', { jobId: '...' });
const application = data.data;

// PATCH section
await api.patch(`/applications/${appId}/sections/personal`, { data: { firstName: 'Kunal', ... } });

// Upload image (multipart)
const formData = new FormData();
formData.append('image', file);  // file is a File object from <input type="file">
await api.post(`/applications/${appId}/sections/photo/image`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Upload PDF
const formData = new FormData();
formData.append('pdf', file);
await api.post(`/applications/${appId}/sections/education/pdf`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Admin multipart (notice with PDF)
const formData = new FormData();
formData.append('heading', 'Recruitment Notice 2026');
formData.append('category', 'Faculty Recruitment');
formData.append('file', file);  // notice PDF
await api.post('/notices', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

---

## File Upload Constraints (enforced server-side)

| Upload Type | Field Name | Format | Max Size |
|---|---|---|---|
| Notice PDF | `file` | PDF | 10 MB |
| Section PDF (any) | `pdf` | PDF | 10 MB |
| Final Documents | `pdf` | PDF | 3 MB |
| Photo | `image` | JPEG only | 200 KB |
| Signature | `image` | JPEG only | 50 KB |

> Always validate these client-side before uploading to give instant feedback.

---

## Role Summary

| Feature | applicant | reviewer | admin | super_admin |
|---|---|---|---|---|
| Browse jobs/notices | ✅ | ✅ | ✅ | ✅ |
| Apply for a job | ✅ | — | — | — |
| View own applications | ✅ | — | — | — |
| View all applications | — | ✅ | ✅ | ✅ |
| Add review notes | — | ✅ | ✅ | ✅ |
| Change application status | — | — | ✅ | ✅ |
| Create/edit/publish jobs | — | — | ✅ | ✅ |
| Create reviewer accounts | — | — | ✅ | ✅ |
| Create admin accounts | — | — | — | ✅ |
| Promote users | — | — | — | ✅ |
