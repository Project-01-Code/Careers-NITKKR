# Careers NIT Kurukshetra — Roadmap

> Backend feature development is complete. This file tracks known stubs, deferred work, and future enhancements.

---

## Known Stubs and Shortcuts to Fix Before Production

- [ ] **Atomic Submission Guard**: In `applicationSubmission.controller.js`, the code should re-verify the `DRAFT` status _inside_ the MongoDB transaction to prevent race conditions if a user clicks submit twice.
- [ ] **Consolidate Validation Logic**: Merge the overlapping logic between `application.service.js` (`checkAllMandatorySections`) and `submissionValidation.service.js` (`validateAllSections`).
- [ ] **Check Application Number Collisions**: Add a retry/check loop in `createApplication` service for the rare case of a random hex collision.
- [ ] **`department` in Job creation**: The Postman collection uses a hardcoded placeholder ObjectId (`507f1f77bcf86cd799439011`) for `department`. Replace with a real ID from `GET /departments` after running `seedDepartments.js`.
- [ ] **Credit Points validation**: Activities 5–22 are self-declared by the applicant. No per-activity cap enforcement exists on the server yet. Add `maxPointsPerActivity` checks in `applicationSection.controller.js`.
- [ ] **Refresh token body fallback**: `POST /auth/refresh-token` accepts `refreshToken` in the request body as a development convenience. Remove this fallback before going to production — the httpOnly cookie should be the only path.

---

## Completed

- [x] **Foundation** — Auth, RBAC, audit logging, error handling, Cloudinary uploads
- [x] **Job Management** — Job model, admin CRUD, publish/close lifecycle, public listing
- [x] **Application System** — Application model, section saves/validates/uploads, submission flow
- [x] **Payment** — Stripe integration, webhook, fee exemption, payment-gated submission
- [x] **Email** — OTP-based email verification, password reset, application submission receipt

---

## Deferred / Future

- [ ] **Unit tests** — Validation service unit tests
- [ ] **Integration tests** — Full submission flow E2E tests
- [ ] **Notification system** — Email notifications for status changes (shortlisted, rejected, etc.)
- [ ] **Cron jobs** — Auto-close jobs past their end date
- [ ] **Admin analytics** — More detailed dashboard stats (trends, category breakdowns)
- [ ] **TypeScript migration** — Deferred to a later phase
- [ ] **Frontend** — Not in scope for this phase
