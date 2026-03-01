# Project Flow & Architecture: Applicant Experience (Frontend)

This document provides a comprehensive overview of the Applicant Experience flow in the NIT KKR regular recruitment portal. It explains how a candidate navigates the system from discovering a job to finally submitting their application.

---

## 1. Public Discovery & Identity (Phase 1)

### A. Landing & Job Discovery (`/jobs`)
When a candidate visits the portal, they land on the Job Discovery page.
- **Component**: `client/src/pages/Jobs.jsx`
- **Functionality**: Displays a list of open job positions (e.g., Assistant Professor, Associate Professor) retrieved from the backend. Candidates can filter, sort, and search for relevant jobs.

### B. Job Details (`/jobs/:id`)
Clicking on a specific job card takes the candidate to the Job Details page.
- **Component**: `client/src/pages/JobDetail.jsx`
- **Functionality**: Shows the full Job Description (JD), eligibility criteria, pay scale, and important dates.
- **Action**: The primary action here is the **"Apply Now"** button. If the user is not logged in, clicking this will redirect them to the Login page.

### C. Authentication Flow (`/login`, `/signup`)
To apply, a candidate must have an account.
- **Components**: `client/src/pages/Login.jsx`, `client/src/pages/Signup.jsx`
- **Functionality**: Standard JWT-based authentication. 
- **Context**: Managed by `AuthContext.jsx` which stores the `user` object and a `token` in LocalStorage.

### D. User Dashboard (`/profile`)
Once logged in, candidates land on their Dashboard/Profile.
- **Component**: `client/src/pages/Profile.jsx`
- **Functionality**: 
  - **Edit Profile**: Update basic details (Name, DOB, Phone).
  - **My Applications**: View the status of ongoing and submitted applications (e.g., Draft, Submitted, Under Review). Candidates can resume "Draft" applications from here.

---

## 2. The Application Engine (Phase 2 & 3)

When a candidate clicks "Apply Now" (and is logged in) or "Resume", they enter the core Application Form.

### A. State Management (`ApplicationContext`)
Due to the sheer size of the academic application (13+ sections), we use a React Context to manage a global state object rather than passing props deeply.
- **Context**: `client/src/context/ApplicationContext.jsx`
- **Role**: Holds the unified `formData` object containing everything from Personal Details to Referees. It provides an `updateSection(sectionName, data)` function that every step calls before navigating to the next.

### B. The Form Shell (`ApplicationForm.jsx`)
The main wrapper for the routing of the multi-step form.
- **Component**: `client/src/pages/ApplicationForm.jsx`
- **Functionality**: Renders a top `Stepper` component and a dynamic content area based on the current step index.

### C. Standardized Layout (`SectionLayout.jsx`)
Every single form step uses a unified layout wrapper to ensure consistent UI.
- **Component**: `client/src/components/SectionLayout.jsx`
- **Functionality**: Wraps the form content, providing a common Title, Subtitle, and the standard "Back" & "Save & Next" buttons at the bottom.

### D. Form Sections Breakdown
The application is split into logical categories, built within `client/src/components/application-steps/`:

1.  **Core Information**:
    - `PersonalDetails.jsx`: Basic info, category, disability status.
    - `Education.jsx`: Dynamic rows for Bachelor's, Master's, PhD.
    - `Experience.jsx`: Dynamic rows for past academic/industry jobs.
    - `Referees.jsx`: Details of 2-3 academic referees.
2.  **Research Output**:
    - `Publications.jsx`: Journals, Books, Conferences.
    - `Patents.jsx`: Patents granted or filed.
    - `Projects.jsx`: Sponsored projects and consultancy.
3.  **Academic Experience**:
    - `PhdSupervision.jsx`: Details of PhD students supervised.
    - `SubjectsTaught.jsx`: Table of UG/PG courses taught.
    - `OrganizedPrograms.jsx`: Workshops, FDPs, Seminars organized.
4.  **Miscellaneous**:
    - `CreditPoints.jsx`: Self-assessment scoring input matrix.
    - `OtherInfo.jsx`: Rich text areas for Awards, Memberships, and Statement of Purpose.

### E. File Uploads
- **Components**: `client/src/components/ImageUpload.jsx` and `PdfUpload.jsx`
- **Component**: `DocumentUpload.jsx` step utilizes these to capture Passport photos, signatures, and mandatory certificates.

---

## 3. Review & Submission (Phase 4)

### A. Validation & Summary (`ReviewSubmit.jsx`)
The penultimate step before payment.
- **Component**: `client/src/components/application-steps/ReviewSubmit.jsx`
- **Functionality**: 
  - Gathers all data from `ApplicationContext`.
  - Runs a **`validate-all`** check to mathematically ensure no required field or document is missing across the 13 steps.
  - If validation fails, it throws Toast errors prompting the user to go back.
  - Generates a read-only summary of the application.

### B. Final Declaration & Submit
- **Component**: `Declaration.jsx` enforces legal agreement.
- **Submit/Payment**: Currently, `ReviewSubmit.jsx` includes a Mock Payment gateway. Upon clicking "Pay Now", it simulates an API request, changes the application status to "Submitted", and redirects the candidate heavily back to their Profile Dashboard (`/profile`) where they can download their final PDF.

---

## 4. Backend Expectations (Future Integration)

While the Frontend flow is complete, it expects the following endpoints from the Backend:
- `POST /api/auth/login`, `/signup`: JWT generation.
- `GET /api/applications/my-applications`: Fetch list of drafted/submitted apps for the Profile.
- `POST /api/upload`: Endpoint that accepts FormData and returns an S3 or static URL for the Image/Pdf uploads.
- `PUT /api/applications/:id`: Auto-save endpoint for saving drafts.
- `POST /api/applications/:id/submit`: Final submission endpoint hooked to a Payment Gateway.
