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

---

## ⚠️ Pending / Partially Implemented

These features exist in the codebase but are not yet fully functional and require additional setup.

- **Malware Scanning**: `scanForMalware` is currently a stub returning `true`. Full ClamAV integration is commented out pending:
  - Installation of `node-clam` npm package (`npm install node-clam`).
  - A running ClamAV daemon (recommended via Docker: `clamav/clamav:latest` on port 3310).
  - Setting `ENABLE_MALWARE_SCAN=true`, `CLAMAV_HOST`, and `CLAMAV_PORT` in `.env`.
  - **Note**: Fail-open vulnerability has been fixed in the commented-out implementation (returns `false` on scanner error).

- **Background Worker Scaling**: Cron jobs (`closeExpiredJobs`, `cleanupOrphanFiles`) run inside the main server process via `setInterval`. Safe for single-server deployments. If scaling horizontally, must be extracted to a dedicated worker or use Redis/BullMQ to prevent duplicate execution.

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
- [ ] **Background Worker Extraction**: Migrate cron jobs to a dedicated worker process or BullMQ queue for horizontal scaling.
