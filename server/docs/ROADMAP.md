# Careers NIT Kurukshetra — Roadmap

> This document tracks the status of server hardening, implemented production features, and the future development roadmap.

---

## ✅ Implemented & Hardened Features

These features have been implemented, tested, and are ready for production use.

### Security & Reliability

- **Atomic Submission Guard**: MongoDB transaction-based locks to prevent double-submission race conditions.
- **Atomic Upload Rollback**: Automatic cleanup of Cloudinary orphan files if database save fails.
- **Refresh Token Hardening**: Strictly enforced `httpOnly` cookies with no request body fallback for increased XSS protection.
- **Credit Point Caps**: Backend validation for NIT recruitment rule compliance (Activities 5–22).

### Automation & Tools

- **Automated Job Closing**: Background worker that closes job postings exactly at their expiration date.
- **Cloudinary Orphan Cleanup**: Daily scheduled task to identify and remove unreferenced application files (scoped to `applications/` folder only).
- **Admin PDF Export**: Functionality for administrators to export comprehensive application reports.
- **Notification System (v1)**: Automated email alerts for applicant status updates (Shortlisted/Rejected).
- **Seed Script Data Alignment**: Fully aligned database seeding with Postman collections for comprehensive testing of all application sections.
- **Image Upload Stabilization**: Robust validation for image file types and sizes with proper state management for previews and error handling.
- **Malware Scanning**: Full ClamAV integration for document uploads, equipped with fail-open logic to safely bypass scanning during AV downtime.
- **Background Worker Scaling**: Dedicated workers for automated job closing and cron jobs cleanup.

---

## ⚠️ Pending / Partially Implemented

These features exist in the codebase but are not yet fully functional and require additional setup.

*(Currently all priority security hardening tasks and features are implemented.)*

---

## 🗺️ Planned Enhancements & Technical Debt

The following items are prioritized for future development phases.

### Phase 2: Testing & Stability

- [ ] **Unit Test Suite**: Comprehensive coverage for credit point calculations and complex business logic.
- [ ] **Integration Tests**: End-to-end verification of the multi-step application submission flow.
- [ ] **TypeScript Migration**: Incremental migration to full type safety across the backend.

### Phase 3: Advanced Features

- [ ] **Notification Delivery Tracking**: Email outbox pattern — persist email state to DB for retry and audit trail.
- [ ] **Administrative Dashboard**: Visual analytics for application trends and audit trail visualization.
- [ ] **Direct File Scanning**: Replace `node-clam` TCP scanning with ClamAV Unix socket for higher performance.
- [ ] **Background Worker Extraction**: Migrate cron jobs to BullMQ queue for robust horizontal scaling.
