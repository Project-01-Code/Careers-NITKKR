# Careers-NITKKR — Future Roadmap & TODO

This document outlines the remaining work for the recruitment portal.

## 🔧 Stubs & Reminders to Replace

These are placeholder implementations, TODOs, and known shortcuts left in the codebase that must be resolved before production.

- [ ] **Section Validation Stubs**: `sectionValidation.service.js` contains stub validators for most sections (personal, education, research, experience, etc.). Replace with full schema-based validation once field requirements are finalised.
- [ ] **`department` field in Job creation**: The `department` field in the "Create Job Draft" Postman request uses a hardcoded placeholder ObjectId (`507f1f77bcf86cd799439011`). Replace with a real `deptId` from the List Departments call once departments are seeded.
- [ ] **Credit Points manual-entry**: Activities 5–22 in the credit points section are self-declared by the applicant. No server-side caps or activity-level validation exists yet — add `maxPointsPerActivity` enforcement in `applicationSection.controller.js`.
- [ ] **Applicant Email Verification**: Registration currently does not verify email addresses. This gate must be in place before going live (see Phase B below).
- [ ] **PDF Preview in Cloudinary**: Uploaded PDFs are stored correctly but Cloudinary requires the `resource_type: 'raw'` flag to serve them with the correct MIME type for browser preview. Confirm this is enforced in `pdfUpload.middleware.js`.
- [ ] **`refreshToken` in request body**: The Refresh Token endpoint accepts the token in the request body as a fallback. Ensure the primary path (httpOnly cookie) is always used in the frontend; remove the body fallback before production.

---

## 🚀 Immediate Next Steps (Pending Your Data)

- [ ] Standard Section Validation: Once you share the field requirements for Personal, Education, Research, Experience, etc., update `sectionValidation.service.js` with strict schema validation.

## 💳 PHASE A: Payment Integration

- [ ] Data Model:
  - [ ] Create Payment model (orderID, txnID, amount, status).
  - [ ] Add paymentStatus to Application model.
- [ ] Integration:
  - [ ] Integrate Razorpay/PayU gateway.
  - [ ] Implement secure webhook for payment confirmation.
- [ ] Logic:
  - [ ] Prevent application submission unless paymentStatus === 'paid' or fee is exempted.

## 📧 PHASE B: Email Verification & Notifications

- [ ] Identity:
  - [ ] Implement OTP/Token based email verification on register.
  - [ ] Block application creation for unverified accounts.
- [ ] Notifications:
  - [ ] Send submission confirmation emails with application Number.
  - [ ] Send password reset emails.

## 📊 Phase C: Admin Insights & Polish

- [ ] Dashboard:
  - [ ] GET /api/v1/admin/dashboard/stats: Summary counts of applications by status and job.
- [ ] Documents:
  - [ ] Generate a PDF "Application Receipt" for users after submission.
- [ ] Search:
  - [ ] Implement full-text search across application data using MongoDB indexes.
- [ ] Testing:
  - [ ] Add unit tests for validation services.
  - [ ] Add integration tests for the full submission flow.

---

> [!NOTE]
> Notification and Cron features are currently deferred to maintain focus on the core flow.
