# Frontend-Backend API Integration Testing Guide

This document serves as a comprehensive checklist for testing the integration between the frontend and backend of the Careers NITKKR portal. It details every backend route, what to provide when calling it (including strict validation rules), and step-by-step instructions for testing it from the frontend.

---

## 0. Global API Rules & Constraints

Before testing specific endpoints, ensure your frontend HTTP client (e.g., Axios) accounts for these global backend configurations:

1. **Authentication (JWT & Cookies):** 
   - The backend reads credentials from `httpOnly` cookies (`accessToken`, `refreshToken`) OR the `Authorization: Bearer <token>` header.
   - Frontend requests **must** include `withCredentials: true` for the browser to send cookies cross-origin.

2. **Standardized Error Handling:**
   - All errors return a predictable JSON structure. Ensure your frontend error handler/interceptor parses this format:
     ```json
     {
       "success": false,
       "statusCode": 400,
       "message": "Validation Error",
       "errors": [{ "field": "password", "message": "Password must be at least 8 characters" }]
     }
     ```

3. **File Uploads & Payload Limits:**
   - **PDFs / Images:** Always sent as `multipart/form-data`. Maximum file size is strictly limited to **10MB** default (some config allows up to 20MB). Incorrect MIME types trigger a 400 response.
   - **JSON / URL-Encoded:** Payload body size limits are capped at **10MB**.

4. **Security & Rate Limiting:**
   - **Rate Limit:** The API accepts a maximum of **10,000 requests per 15 minutes** per IP to prevent abuse.
   - **CORS:** Defined explicitly. If testing from a new port, it must be added to the allowed origins.

5. **Role-Based Access Control (RBAC):**
   - Routes under `/api/v1/admin` require specific roles (`SUPER_ADMIN`, `ADMIN`, or `REVIEWER`). Standard `APPLICANT` tokens will receive a `403 Forbidden` response.

---

## 1. Authentication (`/api/v1/auth`)

| Method   | Endpoint                  | Description                 | Payload/Params & Validation Rules                                                                                                                                                           | Frontend Testing Steps                                                                                                                         |
| :------- | :------------------------ | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/register`               | Register new applicant      | [email](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/validators/auth.validator.js#5-15) (valid format)<br>`password` (8-100 chars, ≥1 uppercase, ≥1 lowercase, ≥1 number)<br>`firstName` (2-50 chars)<br>`lastName` (2-50 chars)                                            | 1. Go to Signup page. 2. Enter details and submit. 3. Verify user is registered and redirect to verify email.                                  |
| `POST`   | `/login`                  | Login user                  | [email](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/validators/auth.validator.js#5-15) (valid format)<br>`password` (cannot be empty)                                                                                                                                      | 1. Go to Login page. 2. Enter credentials. 3. Verify access token is received and user profile is loaded.                                      |
| `DELETE` | `/logout`                 | Logout user (Auth Required) | _None_                                                                                                                                                                                      | 1. Click Logout in Navbar. 2. Verify cookies are cleared and user is redirected to home/login.                                                 |
| `POST`   | `/refresh-token`          | Get new access token        | Cookie or Body: `refreshToken`                                                                                                                                                              | 1. Let access token expire (or clear from memory). 2. Make any authenticated request. 3. Interceptor should automatically call this and retry. |
| `GET`    | `/profile`                | Get current user profile    | _None_ (Auth Required)                                                                                                                                                                      | 1. Navigate to Profile page. 2. Verify user details are correctly fetched and displayed.                                                       |
| `PATCH`  | `/profile`                | Update user profile         | **At least one required:**<br>`firstName` (2-50 chars)<br>`lastName` (2-50 chars)<br>`phone` (E.164 format, e.g. +919876543210)<br>`dateOfBirth` (valid date)<br>`nationality` (2-50 chars) | 1. Edit details on Profile page. 2. Click Save. 3. Verify details update without page reload.                                                  |
| `POST`   | `/verify-email/send`      | Send OTP                    | [email](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/validators/auth.validator.js#5-15) (valid format)                                                                                                                                                                      | 1. Access Verify Email page. 2. Click "Send OTP". 3. Verify success message.                                                                   |
| `POST`   | `/verify-email/confirm`   | Verify OTP                  | [email](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/validators/auth.validator.js#5-15) (valid format)<br>`otp` (must not be empty)                                                                                                                                         | 1. Enter received OTP. 2. Submit. 3. Verify account becomes fully active.                                                                      |
| `POST`   | `/reset-password/send`    | Send pswd reset OTP         | [email](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/validators/auth.validator.js#5-15) (valid format)                                                                                                                                                                      | 1. Go to Forgot Password. 2. Enter email, click Send. 3. Verify success message.                                                               |
| `POST`   | `/reset-password/confirm` | Reset password              | [email](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/validators/auth.validator.js#5-15) (valid format)<br>`otp` (must not be empty)<br>`newPassword` (same rules as registration)                                                                                           | 1. Enter OTP and new password. 2. Submit. 3. Try logging in with new password.                                                                 |

---

## 2. Public Endpoints (`/api/v1`)

### Jobs & Departments

| Method | Endpoint                 | Description              | Payload/Params & Validation Rules                                                                                                                                                                                                                 | Frontend Testing Steps                                                        |
| :----- | :----------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------- |
| `GET`  | `/jobs`                  | List active jobs         | Query:<br>`page` (>0, def: 1)<br>`limit` (1-100, def: 10)<br>`department` (valid 24-char ObjectId)<br>Filters: `status`, `designation`, `payLevel`, `recruitmentType`, `category`, `isActive`, `search`<br>Sort: `sortBy`, `sortOrder` (asc/desc) | 1. Visit Jobs page. 2. Verify list populates. 3. Test pagination and filters. |
| `GET`  | `/jobs/by-advertisement` | Get job by advt no.      | Query:<br>`advertisementNo` (e.g. INIT/FAC/...)                                                                                                                                                                                                   | _Not implemented in UI currently. Custom test via Postman/Browser required._  |
| `GET`  | `/jobs/:id`              | Get specific job details | Param: `id` (valid 24-char ObjectId)                                                                                                                                                                                                              | 1. Click a job card. 2. Verify deep-dive details load correctly.              |
| `GET`  | `/departments`           | List all departments     | _None_                                                                                                                                                                                                                                            | 1. Open Admin Create Job form. 2. Verify department dropdown is populated.    |

### Notices

| Method | Endpoint   | Description         | Payload/Params & Validation Rules                                                                   | Frontend Testing Steps                                                    |
| :----- | :--------- | :------------------ | :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `GET`  | `/notices` | List public notices | Query:<br>`page` (>0, def: 1)<br>`limit` (1-100, def: 4)<br>`category` (valid notice category enum) | 1. Visit Home or Notices page. 2. Verify notices list shows up correctly. |

---

## 3. Applicant Features (`/api/v1/applications`)

### Application Management (Auth Required)

| Method   | Endpoint | Description              | Payload/Params & Validation Rules                                        | Frontend Testing Steps                                                            |
| :------- | :------- | :----------------------- | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| `POST`   | `/`      | Create new application   | `jobId` (valid 24-char hex ObjectId)                                     | 1. Click "Apply" on Job Detail. 2. Verify redirected to Form Step 1.              |
| `GET`    | `/`      | Get user's applications  | Query: `page` (def: 1), `limit` (max: 100), `status`, `jobId` (ObjectId) | 1. Visit Profile page. 2. Verify list of active/past applications.                |
| `GET`    | `/:id`   | Get full app details     | Param: `id` (valid 24-char ObjectId)                                     | 1. Click "Continue" on an application. 2. Verify form rehydrates with saved data. |
| `DELETE` | `/:id`   | Delete draft application | Param: `id` (valid 24-char ObjectId)                                     | 1. Click "Delete" on draft in Profile. 2. Confirm modal. 3. Verify removal.       |

### Sections Management (Auth Required, Editable Application)

_Note: Replace `:sectionType` with actual step (e.g., `personal`, `education`, `experience`...)_

| Method   | Endpoint                              | Description           | Payload/Params & Validation Rules                                                                                | Frontend Testing Steps                                                                                |
| :------- | :------------------------------------ | :-------------------- | :--------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `PATCH`  | `/:id/sections/:sectionType`          | Save text/data        | _JSON data conforming to section schema (e.g., proper dates 1950+, numeric pincodes, E.164 phones, valid enums)_ | 1. Fill form step. 2. Click Save/Next. 3. Verify Toast success. 4. Refresh page, data should persist. |
| `POST`   | `/:id/sections/:sectionType/validate` | Validate section data | Param: `sectionType` (valid enum)                                                                                | 1. (Optional UI step) Triggered when validating a specific section.                                   |
| `POST`   | `/:id/sections/:sectionType/pdf`      | Upload PDF cert       | Form-Data: [pdf](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/middlewares/pdfUpload.middleware.js#29-40) (File ≤20MB)                                                                                    | 1. Select a PDF file. 2. Verify upload progress. 3. Check for success & returned file URL.            |
| `DELETE` | `/:id/sections/:sectionType/pdf`      | Remove PDF cert       | Param: `sectionType`                                                                                             | 1. Click trash icon next to uploaded PDF. 2. Verify removal.                                          |
| `POST`   | `/:id/sections/:sectionType/image`    | Upload Photo/Sig      | Form-Data: `image` (JPEG/PNG)                                                                                    | 1. In Photo/Sig step, select format. 2. Verify preview and successful upload.                         |
| `DELETE` | `/:id/sections/:sectionType/image`    | Remove Photo/Sig      | Param: `sectionType`                                                                                             | 1. Click trash on image preview. 2. Verify deletion.                                                  |
| `POST`   | `/:id/sections/final_documents/pdf`   | Upload Merged Docs    | Form-Data: [pdf](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/middlewares/pdfUpload.middleware.js#29-40) (File ≤3MB)                                                                                     | 1. Go to Final Docs step. 2. Upload combined PDF. 3. Verify successful upload.                        |
| `GET`    | `/:id/sections/credit_points/summary` | Get calculated points | _None_                                                                                                           | 1. Visit Credit Points step. 2. Verify breakdown of calculated points.                                |

### Submission & Payments (Auth Required)

| Method | Endpoint                        | Description          | Payload/Params & Validation Rules | Frontend Testing Steps                                                                             |
| :----- | :------------------------------ | :------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------- |
| `POST` | `/:id/validate-all`             | Validate total form  | _None_                            | 1. Reach final step. 2. UI checks if all steps are complete. Backend reinforces this.              |
| `POST` | `/api/v1/payments/create-order` | Init Stripe Session  | _Token identity used_             | 1. Click "Proceed to Payment". 2. Verify redirect to Stripe checkout.                              |
| `POST` | `/api/v1/payments/webhook`      | Stripe Webhook       | _Raw body_                        | 1. Complete mock payment. 2. Verify backend receives webhook and marks app PAID.                   |
| `POST` | `/:id/submit`                   | Final submission     | _None_                            | 1. Return from Stripe. 2. System auto-polls and calls this. 3. Verify status changes to Submitted. |
| `POST` | `/:id/withdraw`                 | Withdraw application | `reason` (string, max len varies) | 1. On Profile, click Withdraw for a submitted app. 2. Enter reason. 3. Verify status.              |
| `GET`  | `/:id/receipt`                  | Download PDF receipt | _None_                            | 1. On Profile, click "Download Receipt". 2. Verify PDF download initiates.                         |

---

## 4. Admin Features (Auth + Admin/Reviewer Roles)

### Jobs (`/api/v1/admin/jobs`)

| Method   | Endpoint       | Description     | Payload/Params & Validation Rules                                                                                                                                         | Frontend Testing Steps                                                   |
| :------- | :------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------- |
| `GET`    | `/`            | List all jobs   | Query filters `status`, `designation` etc                                                                                                                                 | 1. Access Admin Jobs page. 2. Verify draft, active, closed jobs.         |
| `POST`   | `/`            | Create job      | `title` (5-200), `advertisementNo` (A-Z/0-9), `department` (ObjectId), `designation`, `payLevel`, `positions` (≥1), `fee` (≥0), `eligAge` (≥18), `desc` (≥50), `sections` | 1. Click New Job. 2. Fill form and save. 3. Verify job appears as Draft. |
| `GET`    | `/:id`         | Get job details | Param: `id` (ObjectId)                                                                                                                                                    | 1. Edit job. 2. Verify existing fields populate.                         |
| `PATCH`  | `/:id`         | Update job      | Modifiable fields (strict validation)                                                                                                                                     | 1. Change job title. 2. Save. 3. Verify changes persist.                 |
| `POST`   | `/:id/publish` | Publish job     | _None_                                                                                                                                                                    | 1. Click Publish on draft job. 2. Verify appears on public Jobs board.   |
| `POST`   | `/:id/close`   | Close job       | _None_                                                                                                                                                                    | 1. Click Close on active job. 2. Verify no longer accepts applications.  |
| `DELETE` | `/:id`         | Delete job      | _None_                                                                                                                                                                    | 1. Delete a draft job. 2. Verify it vanishes from list.                  |

### Notices & Users

| Method  | Endpoint                       | Description      | Payload/Params & Validation Rules                                                                                                     | Frontend Testing Steps                                                    |
| :------ | :----------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| `POST`  | `/notices`                     | Create Notice    | Form-Data:<br>`heading` (5-200 chars)<br>`category` (valid enum)<br>`advtNo` (optional)<br>`externalLink` (valid URL)<br>[file](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/middlewares/pdfUpload.middleware.js#23-27) (PDF) | 1. Admin Notices page -> Add. 2. Upload PDF. 3. Verify appears in list.   |
| `PATCH` | `/notices/:id`                 | Update Notice    | Modifiable fields (`heading`, `isActive`)                                                                                             | 1. Edit notice. 2. Verify changes reflect.                                |
| `PATCH` | `/notices/:id/archive`         | Archive Notice   | Param: `id` (ObjectId)                                                                                                                | 1. Click Archive. 2. Verify removed from public view.                     |
| `POST`  | `/admin/users`                 | Create Admin/Rev | [email](file:///c:/Users/risha/OneDrive/Documents/Padhai/Development/Careers-NITKKR/server/src/validators/auth.validator.js#5-15), `role`, etc.                                                                                                                 | 1. Admin Users page. 2. Create Reviewer. 3. Attempt login with new creds. |
| `PATCH` | `/admin/users/:userId/promote` | Promote to Admin | Param: `userId`                                                                                                                       | 1. (Super-Admin only) Promote Reviewer. 2. Verify role update.            |

### Applications (`/api/v1/admin/applications`)

| Method  | Endpoint              | Description         | Payload/Params & Validation Rules                                                          | Frontend Testing Steps                                               |
| :------ | :-------------------- | :------------------ | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| `GET`   | `/`                   | List all            | Query filters                                                                              | 1. Admin Applications page. 2. Test status/job filters.              |
| `GET`   | `/job/:jobId`         | View by job         | Param: `jobId`                                                                             | 1. Access via "View Apps" from Jobs page. 2. Verify filtered list.   |
| `GET`   | `/:id`                | Review Application  | Param: `id` (ObjectId)                                                                     | 1. Click an application. 2. Verify side-by-side review view opens.   |
| `GET`   | `/export`             | CSV Export basic    | Query filters                                                                              | 1. Click Export. 2. Verify downloaded CSV.                           |
| `GET`   | `/:id/export-full`    | Export specific app | Param: `id` (ObjectId)                                                                     | 1. On single app review, click Export Full PDF. 2. Verify download.  |
| `PATCH` | `/:id/status`         | Change status       | `status` (valid enum - Draft, Submitted, etc.)<br>`remarks` (max 500 chars)                | 1. Change status dropdown to Shortlisted. 2. Verify updates in list. |
| `POST`  | `/bulk-status`        | Bulk update         | `applicationIds` (ObjectId[], max 100)<br>`status` (enum)<br>`remarks` (max 500)           | 1. Check multiple boxes. 2. Apply status. 3. Verify all update.      |
| `PATCH` | `/:id/review`         | Add notes           | `reviewNotes` (1-2000 chars)                                                               | 1. In review view, add note. 2. Verify timestamped note saves.       |
| `PATCH` | `/:id/verify-section` | Verify section      | `sectionType` (valid section string)<br>`isVerified` (boolean)<br>`notes` (max 1000 chars) | 1. Mark 'Experience' as Verified. 2. Verify green tick appears.      |
| `POST`  | `/:id/exempt-fee`     | Exempt payment      | _None_                                                                                     | 1. Click "Exempt Fee". 2. Verify user payment requirement drops.     |

### Dashboard (`/api/v1/admin/dashboard/stats`)

| Method | Endpoint            | Description        | Payload/Params & Validation Rules | Frontend Testing Steps                                                   |
| :----- | :------------------ | :----------------- | :-------------------------------- | :----------------------------------------------------------------------- |
| `GET`  | `/stats`            | Global Stats       | _None_                            | 1. Open Admin Dashboard. 2. Verify top level counts (Total Users, Apps). |
| `GET`  | `/stats/job/:jobId` | Job-specific Stats | Param: `jobId`                    | 1. From Jobs list, click View Stats. 2. Verify modal data accuracy.      |

---

_This artifact includes comprehensive validation rules pulled directly from the Zod schemas in `server/src/validators/`._
