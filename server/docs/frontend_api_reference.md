# Careers NIT Kurukshetra - Frontend API Reference

> **Base URL:** `http://localhost:8000/api/v1` (development)
>
> **All responses follow the same envelope:**
>
> ```json
> { "statusCode": 200, "data": { ... }, "message": "...", "success": true }
> ```
>
> Errors return `"success": false` and no `data`.

---

## Table of Contents

1. [Authentication Setup](#1-authentication-setup)
2. [Auth Endpoints](#2-auth-endpoints)
3. [Public Endpoints](#3-public-endpoints)
4. [Application Endpoints](#4-application-endpoints)
5. [Application Sections](#5-application-sections)
6. [Submission & Payment](#6-submission--payment)
7. [Admin Endpoints](#7-admin-endpoints)
8. [Error Reference](#8-error-reference)
9. [Enums & Allowed Values](#9-enums--allowed-values)

---

## 1. Authentication Setup

### How Auth Works

Tokens are returned **both** as HTTP-only cookies and in the JSON body.

- **Cookies (recommended for browser apps):** Automatically attached on every request if you set `credentials: 'include'` on `fetch` / `withCredentials: true` on Axios.
- **Header fallback:** Send `Authorization: Bearer <accessToken>` if you choose to manage tokens manually (e.g., mobile, SSR).

### Token Lifetimes

| Token          | Lifetime                                       |
| -------------- | ---------------------------------------------- |
| `accessToken`  | Short-lived (set in `.env` — typically 15 min) |
| `refreshToken` | Long-lived (set in `.env` — typically 7 days)  |

### Refreshing Tokens

When any request returns **401**, call `POST /auth/refresh-token` to get a new access token, then retry the original request.

```js
// Axios interceptor example
axios.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retried) {
    error.config._retried = true;
    await axios.post('/auth/refresh-token'); // cookies handle the rest
    return axios(error.config);
  }
  return Promise.reject(error);
});
```

---

## 2. Auth Endpoints

### Register

```
POST /auth/register
Auth: None
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

**Response 201**

```json
{
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "role": "applicant",
    "isEmailVerified": false,
    "profile": {},
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "message": "User registered successfully. Please check your email for a verification OTP."
}
```

> An email verification OTP is sent automatically after registration. The account is not fully functional until the email is verified.

---

### Login

```
POST /auth/login
Auth: None
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

**Response 200**

```json
{
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "role": "applicant",
      "isEmailVerified": true,
      "profile": { "firstName": "...", "lastName": "..." }
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

> Tokens are also set as `httpOnly` cookies. The `role` field determines which UI views to show.

---

### Logout

```
DELETE /auth/logout
Auth: Required
```

**Response 200** — Clears both cookies, invalidates refreshToken in DB.

---

### Refresh Token

```
POST /auth/refresh-token
Auth: None (uses cookie automatically, or pass in body)
```

**Request Body** (only needed if NOT using cookies)

```json
{ "refreshToken": "<jwt>" }
```

**Response 200**

```json
{
  "data": { "accessToken": "<new_jwt>", "refreshToken": "<new_jwt>" }
}
```

---

### Get Profile

```
GET /auth/profile
Auth: Required
```

**Response 200** — Returns the full authenticated user object (no password/refreshToken).

---

### Update Profile

```
PATCH /auth/profile
Auth: Required
Content-Type: application/json
```

**Request Body** — All fields optional:

```json
{
  "firstName": "Ravi",
  "lastName": "Kumar",
  "phone": "9876543210"
}
```

**Response 200** — Returns updated user object.

---

### Email Verification

```
POST /auth/verify-email/send
Auth: None
```

```json
{ "email": "user@example.com" }
```

```
POST /auth/verify-email/confirm
Auth: None
```

```json
{ "email": "user@example.com", "otp": "123456" }
```

> OTP is **6 digits**, expires in **10 minutes**. Always return 200 even on re-send to prevent enumeration.

---

### Password Reset

```
POST /auth/reset-password/send
Auth: None
```

```json
{ "email": "user@example.com" }
```

```
POST /auth/reset-password/confirm
Auth: None
```

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword@123"
}
```

---

## 3. Public Endpoints

No authentication required for any of these.

### List Active Jobs

```
GET /jobs?page=1&limit=10&designation=Assistant Professor Grade-I&search=
Auth: None
```

| Query Param   | Type   | Description               |
| ------------- | ------ | ------------------------- |
| `page`        | number | Default: `1`              |
| `limit`       | number | Default: `10`, Max: `100` |
| `designation` | string | Filter by designation     |
| `search`      | string | Full-text search          |

**Response 200**

```json
{
  "data": {
    "jobs": [
      {
        "_id": "...",
        "title": "...",
        "advertisementNo": "NITKKR/FAC/2026/CSE/001",
        "designation": "Assistant Professor Grade-I",
        "department": { "_id": "...", "name": "CSE", "code": "CSE" },
        "positions": 3,
        "categories": ["GEN", "OBC", "SC"],
        "applicationStartDate": "2026-06-01T00:00:00.000Z",
        "applicationEndDate": "2026-07-01T00:00:00.000Z",
        "status": "published"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### Get Job by ID

```
GET /jobs/:id
Auth: None
```

**Response 200** — Full job object.

---

### Get Job by Advertisement Number

```
GET /jobs/by-advertisement?advertisementNo=NITKKR/FAC/2026/CSE/001
Auth: None
```

> Uses a query parameter, not a path parameter.

---

### List Departments

```
GET /departments
Auth: None
```

**Response 200**

```json
{
  "data": [
    { "_id": "...", "name": "Computer Science & Engineering", "code": "CSE" }
  ]
}
```

---

### List Public Notices

```
GET /notices?page=1&limit=10&category=Faculty Recruitment
Auth: None
```

**Response 200**

```json
{
  "data": {
    "notices": [
      {
        "_id": "...",
        "heading": "Recruitment Advertisement 2026",
        "advtNo": "NITKKR/2026/01",
        "category": "Faculty Recruitment",
        "fileUrl": "https://res.cloudinary.com/...",
        "isActive": true,
        "createdAt": "2026-01-15T00:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 3, "pages": 1 }
  }
}
```

---

## 4. Application Endpoints

> **Prerequisite:** User must be logged in as `applicant` AND have a verified email.
> Creating an application without a verified email returns **403**.

### Create Application

```
POST /applications
Auth: Required (applicant)
Content-Type: application/json
```

**Request Body**

```json
{ "jobId": "<mongoId>" }
```

**Response 201**

```json
{
  "data": {
    "_id": "<appId>",
    "userId": "...",
    "jobId": "...",
    "status": "draft",
    "paymentStatus": "pending",
    "sections": [],
    "createdAt": "..."
  },
  "message": "Application created successfully"
}
```

> Save the returned `_id` as your `appId` — used in all subsequent section calls.

---

### List My Applications

```
GET /applications?page=1&limit=10&status=draft
Auth: Required (applicant)
```

| Query Param | Allowed values                                                                     |
| ----------- | ---------------------------------------------------------------------------------- |
| `status`    | `draft` `submitted` `under_review` `shortlisted` `rejected` `selected` `withdrawn` |

**Response 200**

```json
{
  "data": {
    "applications": [
      {
        "_id": "...",
        "status": "draft",
        "paymentStatus": "pending",
        "jobId": {
          "_id": "...",
          "title": "...",
          "advertisementNo": "...",
          "applicationEndDate": "...",
          "status": "published"
        },
        "createdAt": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "pages": 1 }
  }
}
```

---

### Get Application by ID

```
GET /applications/:id
Auth: Required (owner only)
```

**Response 200** — Full application with populated `jobId` and `userId`.

---

### Delete Draft Application

```
DELETE /applications/:id
Auth: Required (owner only)
```

> Only works on `status: "draft"` applications. **Response 200**, `data: null`.

---

## 5. Application Sections

All section endpoints follow the pattern:

```
PATCH  /applications/:id/sections/:sectionType          — Save section data
POST   /applications/:id/sections/:sectionType/validate — Validate saved data
POST   /applications/:id/sections/:sectionType/pdf      — Upload PDF (multipart)
DELETE /applications/:id/sections/:sectionType/pdf      — Delete PDF
POST   /applications/:id/sections/:sectionType/image    — Upload image (multipart)
DELETE /applications/:id/sections/:sectionType/image    — Delete image
```

> **Ownership enforced:** You can only save sections on your own applications.
> **Editability enforced:** Only `draft` applications can be modified.

### Section Types

| `sectionType`             | Has Validate | Has PDF       | Has Image             |
| ------------------------- | ------------ | ------------- | --------------------- |
| `personal`                | Yes          | No            | No                    |
| `photo`                   | No           | No            | Yes (JPEG, max 200KB) |
| `signature`               | No           | No            | Yes (JPEG, max 50KB)  |
| `education`               | Yes          | Yes           | No                    |
| `experience`              | Yes          | Yes           | No                    |
| `publications_journal`    | No           | No            | No                    |
| `publications_conference` | No           | No            | No                    |
| `phd_supervision`         | No           | No            | No                    |
| `patents`                 | No           | No            | No                    |
| `publications_books`      | No           | No            | No                    |
| `organized_programs`      | No           | No            | No                    |
| `sponsored_projects`      | No           | No            | No                    |
| `consultancy_projects`    | No           | No            | No                    |
| `subjects_taught`         | No           | No            | No                    |
| `credit_points`           | No           | No            | No                    |
| `referees`                | No           | No            | No                    |
| `other_info`              | No           | No            | No                    |
| `final_documents`         | No           | Yes (max 3MB) | No                    |
| `declaration`             | No           | No            | No                    |

---

### Save Section (PATCH)

```
PATCH /applications/:id/sections/:sectionType
Auth: Required (owner)
Content-Type: application/json
```

All save requests wrap data in a `data` key:

```json
{ "data": { ...section-specific fields... } }
```

**Response 200** — Returns the updated application.

---

### Personal Section Data Shape

```json
{
  "data": {
    "postAppliedFor": "Assistant Professor Grade-I (Level-12)",
    "departmentDiscipline": "Computer Science & Engineering",
    "category": "GEN",
    "disability": false,
    "name": "Dr. Ravi Kumar",
    "dob": "1985-06-15",
    "fatherName": "Mr. Rajesh Kumar",
    "nationality": "Indian",
    "gender": "Male",
    "maritalStatus": "Married",
    "aadhar": "123456789012",
    "corrAddress": "H.No. 42, Sector 7",
    "corrCity": "Kurukshetra",
    "corrDistrict": "Kurukshetra",
    "corrState": "Haryana",
    "corrPincode": "136118",
    "mobile": "9876543210",
    "sameAsCorrespondence": true,
    "permAddress": "H.No. 42, Sector 7",
    "permCity": "Kurukshetra",
    "permDistrict": "Kurukshetra",
    "permState": "Haryana",
    "permPincode": "136118",
    "specialization": ["Machine Learning", "Computer Vision"],
    "phdTitle": "Deep Learning for Medical Image Segmentation",
    "phdUniversity": "IIT Delhi",
    "phdDate": "2015-05-20",
    "degreeFromTopInstitute": ["PhD Degree", "PG Degree"],
    "scopusId": "57200000000"
  }
}
```

---

### Education Section Data Shape

```json
{
  "data": {
    "items": [
      {
        "examPassed": "PhD",
        "discipline": "Computer Science",
        "boardUniversity": "IIT Delhi",
        "marks": "Excellent",
        "classDivision": "First",
        "yearOfPassing": "2015",
        "nirfRanking": { "rank": "1-10", "rankingYear": "2015" }
      },
      {
        "examPassed": "M.Tech/ME/M.Sc",
        "discipline": "CSE",
        "boardUniversity": "NIT Kurukshetra",
        "marks": "8.9 CGPA",
        "classDivision": "First with Distinction",
        "yearOfPassing": "2010"
      }
    ]
  }
}
```

Allowed `examPassed` values: `Post-Doctoral` `PhD` `M.Tech/ME/M.Sc` `B.Tech/BE/B.Sc` `Intermediate/12th` `Matriculation/10th`

Allowed `nirfRanking.rank` values: `1-10` `11-25` `26-50` `51-100` `101-150` `151-200` `201+` `Not Ranked`

---

### Experience Section Data Shape

```json
{
  "data": {
    "items": [
      {
        "experienceType": ["Teaching", "Research/Post-Doctoral"],
        "employerNameAddress": "IIT Bombay, Powai, Mumbai - 400076",
        "isPresentEmployer": true,
        "designation": "Assistant Professor",
        "appointmentType": "Regular",
        "payScale": "Level 10",
        "fromDate": "2016-07-01",
        "organizationType": "Fully Funded Central Educational Institutions"
      }
    ]
  }
}
```

Allowed `experienceType` values: `Teaching` `Industry` `Research/Post-Doctoral`

Allowed `appointmentType` values: `Regular` `Adhoc` `Contract` `Guest` `Temporary`

Allowed `organizationType` values:

- `Fully Funded Central Educational Institutions`
- `IIMs and Other Management Institutions ranked by NIRF upto 50`
- `State Educational Institutions funded by State Governments`
- `Other Educational Institutions ranked by NIRF upto 100`
- `Any Other Institute / Organization`
- `Institute / University outside India with QS/THE Ranking within 500`

---

### Journal Publications Data Shape

```json
{
  "data": {
    "items": [
      {
        "journalType": "SCI / Scopus Journals",
        "paperTitle": "A Novel Deep Learning Framework",
        "authors": "R. Kumar, A. Sharma",
        "isFirstAuthor": true,
        "coAuthorCount": 1,
        "journalName": "IEEE Transactions on Medical Imaging",
        "isPaidJournal": false,
        "volume": "42",
        "year": "2023",
        "pages": "1245-1258"
      }
    ]
  }
}
```

Allowed `journalType`: `SCI / Scopus Journals` `Non-SCI / Non-Scopus Journals`

---

### Conference Publications Data Shape

```json
{
  "data": {
    "items": [
      {
        "conferenceType": "Scopus Indexed Conference",
        "paperTitle": "Attention Mechanisms in Vision Transformers",
        "authors": "R. Kumar, S. Verma",
        "isFirstAuthor": true,
        "coAuthorCount": 1,
        "conferenceName": "IEEE CVPR 2022",
        "organizer": "IEEE",
        "year": "2022",
        "pages": "5678-5685"
      }
    ]
  }
}
```

Allowed `conferenceType`: `SCI Indexed Conference` `Scopus Indexed Conference` `Web of Science Conference` `Internationally Renowned Conference`

---

### PhD Supervision Data Shape

```json
{
  "data": {
    "items": [
      {
        "scholarName": "Ms. Priya Sharma",
        "researchTopic": "Federated Learning for Healthcare Privacy",
        "universityInstitute": "IIT Bombay",
        "supervisors": "Dr. R. Kumar",
        "isFirstSupervisor": true,
        "coSupervisorCount": 0,
        "year": "2022",
        "status": "Awarded"
      }
    ]
  }
}
```

Allowed `status`: `Awarded` `Submitted` `Ongoing`

---

### Patents Data Shape

```json
{
  "data": {
    "items": [
      {
        "patentTitle": "System for Real-time Image Enhancement",
        "inventors": "R. Kumar, P. Singh",
        "isPrincipalInventor": true,
        "coInventorCount": 1,
        "year": "2021",
        "status": "Granted"
      }
    ]
  }
}
```

Allowed `status`: `Granted` `Applied` `Published` `Under Examination`

---

### Books / Monographs Data Shape

```json
{
  "data": {
    "items": [
      {
        "type": "Book",
        "title": "Introduction to Deep Learning",
        "authors": "R. Kumar",
        "year": "2020",
        "publisher": "Springer"
      }
    ]
  }
}
```

Allowed `type`: `Book` `Monograph` `Book Chapter`

---

### Organized Programs Data Shape

```json
{
  "data": {
    "items": [
      {
        "title": "Workshop on ML Applications",
        "fromDate": "2023-03-10",
        "toDate": "2023-03-14",
        "sponsoringAgency": "DST, Govt. of India"
      }
    ]
  }
}
```

---

### Sponsored Projects Data Shape

```json
{
  "data": {
    "items": [
      {
        "sponsoringAgency": "DST, Govt. of India",
        "title": "AI-based Crop Disease Detection System",
        "period": "2021-2024",
        "amount": 2500000,
        "piCoPI": "Dr. R. Kumar",
        "isPrincipalInvestigator": true,
        "coInvestigatorCount": 0,
        "status": "Ongoing"
      }
    ]
  }
}
```

Allowed `status`: `Completed` `Ongoing` `Sanctioned`

---

### Consultancy Projects Data Shape

```json
{
  "data": {
    "items": [
      {
        "fundingAgency": "Tata Consultancy Services",
        "title": "AI-powered Customer Analytics",
        "period": "2022-2023",
        "amount": 750000,
        "piCoPI": "Dr. R. Kumar",
        "status": "Completed"
      }
    ]
  }
}
```

---

### Subjects Taught Data Shape

```json
{
  "data": {
    "items": [
      { "category": "UG Level", "subjectName": "Data Structures & Algorithms" },
      { "category": "PG Level", "subjectName": "Deep Learning" }
    ]
  }
}
```

Allowed `category`: `UG Level` `PG Level`

---

### Credit Points

#### Get Auto-Calculated Summary

```
GET /applications/:id/sections/credit_points/summary
Auth: Required (owner)
```

Returns auto-calculated activity points from saved sections (Activities 1-4).

#### Save Manual Activities

```json
{
  "data": {
    "manualActivities": [
      {
        "activityId": 5,
        "description": "Conference Papers (Indexed)",
        "claimedPoints": 4
      },
      {
        "activityId": 6,
        "description": "Major Administrative Positions",
        "claimedPoints": 6
      }
    ],
    "totalCreditsClaimed": 68,
    "totalCreditsAllowed": 100
  }
}
```

---

### Referees Data Shape

```json
{
  "data": {
    "items": [
      {
        "name": "Prof. Ashok Gupta",
        "designation": "Professor & Head",
        "departmentAddress": "Dept. of CSE, IIT Delhi, Hauz Khas, New Delhi",
        "city": "New Delhi",
        "pincode": "110016",
        "phone": "011-26591234",
        "officialEmail": "agupta@cse.iitd.ac.in",
        "personalEmail": "ashok.gupta@gmail.com"
      }
    ]
  }
}
```

---

### Other Information Data Shape

```json
{
  "data": {
    "strength": "...",
    "weakness": "...",
    "visionForHigherEd": "...",
    "topThreePriorities": "...",
    "preferredSubjects": ["Machine Learning", "Deep Learning"],
    "labInnovations": ["Edge AI Lab for IoT"],
    "otherInfo": ""
  }
}
```

---

### Declaration Data Shape

```json
{
  "data": {
    "declareInfoTrue": true,
    "agreeToTerms": true,
    "photoUploaded": true,
    "detailsVerified": true
  }
}
```

> All four fields must be `true` before the application can be submitted.

---

### File Uploads

```
POST /applications/:id/sections/:sectionType/pdf
Content-Type: multipart/form-data
```

| Field   | Type        | Max Size                        | Sections                                     |
| ------- | ----------- | ------------------------------- | -------------------------------------------- |
| `pdf`   | file        | 5MB (3MB for final_documents)   | `education`, `experience`, `final_documents` |
| `image` | file (JPEG) | 200KB (photo), 50KB (signature) | `photo`, `signature`                         |

---

## 6. Submission & Payment

### Validate All Sections (Pre-submit Check)

```
POST /applications/:id/validate-all
Auth: Required (owner)
```

Returns which sections are incomplete. Run this before Submit to show the user which sections still need work.

**Response 200** — Returns validation status per section.

---

### Submit Application

```
POST /applications/:id/submit
Auth: Required (owner)
```

> **IRREVERSIBLE.** Once submitted, the application is locked. Status changes from `draft` to `submitted`.

**Pre-conditions checked by the server:**

1. All required sections are complete and valid
2. Payment is complete (or fee is exempted)
3. Declaration is accepted

**Response 200** — Returns updated application with `status: "submitted"`.

---

### Withdraw Application

```
POST /applications/:id/withdraw
Auth: Required (owner)
Content-Type: application/json
```

```json
{ "reason": "Withdrawing due to personal reasons" }
```

**Response 200** — `status` changes to `"withdrawn"`.

---

### Download Receipt

```
GET /applications/:id/receipt
Auth: Required (owner)
```

> Returns a **PDF file** (binary stream). Only available after submission.

```js
// Browser download example
const response = await fetch(`/api/v1/applications/${appId}/receipt`, {
  credentials: 'include',
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url); // opens PDF in new tab
```

---

### Create Payment Order

```
POST /payments/create-order
Auth: Required (applicant)
Content-Type: application/json
```

```json
{ "applicationId": "<appId>" }
```

**Response 200** — Returns the payment order details (Razorpay/Stripe order ID, amount, currency).

---

### Payment Webhook

```
POST /payments/webhook
Auth: None (Stripe signature in header)
```

> This endpoint is for Stripe only. Do not call it from the frontend. Stripe calls it automatically.

---

## 7. Admin Endpoints

> All admin endpoints require `Authorization: Bearer <token>` with an `admin`, `super_admin`, or `reviewer` role as appropriate.

### Role Permissions at a Glance

| Action                    | applicant | reviewer | admin | super_admin |
| ------------------------- | --------- | -------- | ----- | ----------- |
| View applications (admin) | No        | Yes      | Yes   | Yes         |
| Update application status | No        | No       | Yes   | Yes         |
| Create / Edit Jobs        | No        | No       | Yes   | Yes         |
| Publish Jobs              | No        | No       | Yes   | Yes         |
| Exempt Fee                | No        | No       | Yes   | Yes         |
| Create Reviewer account   | No        | No       | Yes   | Yes         |
| Create Admin account      | No        | No       | No    | Yes         |
| Promote user to Admin     | No        | No       | No    | Yes         |

---

### Admin - Applications

```
GET  /admin/applications?page=1&limit=10&status=submitted&jobId=&search=
GET  /admin/applications/:id
GET  /admin/applications/job/:jobId
GET  /admin/applications/export?jobId=          (returns CSV)
PATCH /admin/applications/:id/status            — Update status
PATCH /admin/applications/:id/review            — Add review notes
POST  /admin/applications/bulk-status           — Bulk update status
PATCH /admin/applications/:id/verify-section    — Mark a section as verified
POST  /admin/applications/:id/exempt-fee        — Exempt payment fee
```

**Update Status body:**

```json
{ "status": "shortlisted", "remarks": "Strong research profile" }
```

Allowed status values: `submitted` `under_review` `shortlisted` `rejected` `selected` `withdrawn`

**Bulk Status body:**

```json
{
  "applicationIds": ["<id1>", "<id2>"],
  "status": "under_review",
  "remarks": "Batch move"
}
```

**Verify Section body:**

```json
{
  "sectionType": "education",
  "isVerified": true,
  "verificationNotes": "Degree certificate verified."
}
```

---

### Admin - Jobs

```
POST   /admin/jobs         — Create draft
GET    /admin/jobs         — List all (all statuses)
GET    /admin/jobs/:id
PATCH  /admin/jobs/:id     — Update draft
POST   /admin/jobs/:id/publish  — Draft -> Published
POST   /admin/jobs/:id/close    — Close before end date
DELETE /admin/jobs/:id          — Soft delete
```

**Create Job body** (key fields):

```json
{
  "title": "Assistant Professor Grade-I",
  "advertisementNo": "NITKKR/FAC/2026/CSE/001",
  "department": "<deptId>",
  "designation": "Assistant Professor Grade-I",
  "payLevel": "12",
  "positions": 3,
  "recruitmentType": "external",
  "categories": ["GEN", "OBC", "SC"],
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
  "description": "...",
  "applicationStartDate": "2026-06-01T00:00:00.000Z",
  "applicationEndDate": "2026-07-01T00:00:00.000Z",
  "requiredSections": [
    { "sectionType": "personal", "isMandatory": true },
    { "sectionType": "education", "isMandatory": true }
  ]
}
```

---

### Admin - Users

```
POST  /admin/users                     — Create admin or reviewer
PATCH /admin/users/:id/promote         — Promote to admin (super_admin only)
```

**Create User body:**

```json
{
  "email": "reviewer@nitkkr.ac.in",
  "password": "Secure@123",
  "firstName": "Review",
  "lastName": "Officer",
  "role": "reviewer"
}
```

---

### Admin - Notices

```
POST  /notices                   — Create notice (multipart)
PATCH /notices/:id               — Update notice (multipart)
PATCH /notices/:id/archive       — Archive notice
```

**Create Notice** (`multipart/form-data`):

| Field      | Type     | Required |
| ---------- | -------- | -------- |
| `heading`  | text     | Yes      |
| `advtNo`   | text     | Yes      |
| `category` | text     | Yes      |
| `file`     | PDF file | No       |

---

### Admin - Dashboard

```
GET /admin/dashboard/stats
GET /admin/dashboard/stats/job/:jobId
```

**Dashboard Stats Response:**

```json
{
  "data": {
    "totalJobs": 5,
    "totalApplications": 120,
    "applicationsByStatus": {
      "draft": 20,
      "submitted": 80,
      "shortlisted": 15,
      "rejected": 3,
      "selected": 2
    }
  }
}
```

---

## 8. Error Reference

All errors follow the same structure:

```json
{
  "statusCode": 401,
  "data": null,
  "message": "Invalid credentials",
  "success": false
}
```

| Status | Meaning          | Common Causes                                                   |
| ------ | ---------------- | --------------------------------------------------------------- |
| 400    | Bad Request      | Missing required fields, invalid body                           |
| 401    | Unauthorized     | No token, expired token, invalid credentials                    |
| 403    | Forbidden        | Email not verified, wrong role for route, not application owner |
| 404    | Not Found        | Resource doesn't exist                                          |
| 409    | Conflict         | Email already registered                                        |
| 422    | Validation Error | Schema validation failed (Zod)                                  |
| 429    | Rate Limited     | Too many requests (10,000 per 15 min per IP)                    |
| 500    | Server Error     | Unexpected server failure                                       |

---

## 9. Enums & Allowed Values

Use these for dropdown options in forms:

```js
// Roles
const USER_ROLES = ['applicant', 'reviewer', 'admin', 'super_admin'];

// Application lifecycle
const APPLICATION_STATUS = [
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'rejected',
  'selected',
  'withdrawn',
];

// Job lifecycle
const JOB_STATUS = ['draft', 'published', 'closed', 'archived'];

// Job designations
const JOB_DESIGNATIONS = [
  'Assistant Professor Grade-II',
  'Assistant Professor Grade-I',
  'Associate Professor',
  'Professor',
];

// Pay levels (7th CPC)
const JOB_PAY_LEVELS = ['10', '11', '12', '13A2', '14A'];

// Application fee categories
const RESERVATION_CATEGORIES = ['GEN', 'SC', 'ST', 'OBC', 'EWS', 'PwD'];

// Personal section dropdowns
const GENDER = ['Male', 'Female', 'Transgender'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const DEGREE_FROM_TOP_INSTITUTE = ['UG Degree', 'PG Degree', 'PhD Degree'];

// Education
const EXAM_TYPES = [
  'Post-Doctoral',
  'PhD',
  'M.Tech/ME/M.Sc',
  'B.Tech/BE/B.Sc',
  'Intermediate/12th',
  'Matriculation/10th',
];
const NIRF_RANK_RANGES = [
  '1-10',
  '11-25',
  '26-50',
  '51-100',
  '101-150',
  '151-200',
  '201+',
  'Not Ranked',
];

// Experience
const EXPERIENCE_TYPES = ['Teaching', 'Industry', 'Research/Post-Doctoral'];
const APPOINTMENT_TYPES = [
  'Regular',
  'Adhoc',
  'Contract',
  'Guest',
  'Temporary',
];
const ORGANIZATION_TYPES = [
  'Fully Funded Central Educational Institutions',
  'IIMs and Other Management Institutions ranked by NIRF upto 50',
  'State Educational Institutions funded by State Governments',
  'Other Educational Institutions ranked by NIRF upto 100',
  'Any Other Institute / Organization',
  'Institute / University outside India with QS/THE Ranking within 500',
];

// Publications
const JOURNAL_TYPES = [
  'SCI / Scopus Journals',
  'Non-SCI / Non-Scopus Journals',
];
const CONFERENCE_TYPES = [
  'SCI Indexed Conference',
  'Scopus Indexed Conference',
  'Web of Science Conference',
  'Internationally Renowned Conference',
];
const BOOK_TYPES = ['Book', 'Monograph', 'Book Chapter'];

// PhD / Patents / Projects
const PHD_STATUS = ['Awarded', 'Submitted', 'Ongoing'];
const PATENT_STATUS = ['Granted', 'Applied', 'Published', 'Under Examination'];
const PROJECT_STATUS = ['Completed', 'Ongoing', 'Sanctioned'];

// Subjects
const SUBJECT_LEVELS = ['UG Level', 'PG Level'];

// Payment status
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'exempted'];
```

---

_Last updated: 2026-02-28 | Backend version: v1_
