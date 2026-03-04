# Careers NIT Kurukshetra — Roadmap

> Backend development is transitioning from implementation to production hardening. This file tracks known stubs, technical debt, and future enhancements.

---

## 🛠️ Production Hardening (Required before Launch)

- [ ] **Real Malware Scan Implementation**: In `sectionValidation.service.js`, replace the `scanForMalware` stub with a real engine (e.g., ClamAV) to scan all PDF and Image buffers.
- [ ] **Atomic Submission Guard**: In `applicationSubmission.controller.js`, re-verify `DRAFT` status _inside_ a MongoDB transaction to prevent double-submission race conditions.
- [ ] **Cloudinary Orphan Cleanup**: Implement a scheduled task (Cron) to identify and delete files in Cloudinary that have no corresponding `cloudinaryId` in MongoDB.
- [ ] **Refresh Token Security**: Remove the request body fallback for `POST /auth/refresh-token`; enforce `httpOnly` cookies as the sole source of truth.
- [ ] **Credit Points Caps**: Activities 5–22 are currently self-declared. Need `maxPointsPerActivity` enforcement in the backend to match the recruitment rules.
- [ ] **Atomic Upload Cleanup**: If a Cloudinary upload succeeds but the database `save()` fails, implement a rollback to delete the "phantom" file.

---

## 🚀 Post-Launch

- [ ] **Unit tests** — Core validation and credit point calculation test suite.
- [ ] **Notification System** — Trigger automated emails when an application status moves to "Shortlisted" or "Rejected".
- [ ] **Auto-Close Jobs**: Cron job to move jobs to "Closed" status exactly at midnight of their end date.
- [ ] **Export Enhancements**: Add PDF export for full applications (Admin view).
- [ ] **TypeScript Migration**: Full type safety for the backend services.
