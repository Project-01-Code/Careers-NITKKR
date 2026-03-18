# Careers NIT Kurukshetra — Roadmap

> This document tracks the status of server hardening, implemented production features, and the future development roadmap.

---

## ✅ Implemented & Hardened Features

These features have been implemented, tested, and are ready for production use.

### Security & Reliability

- **State-Based Submission Guard**: Strict status-based validation and read-only locks to prevent double-submission race conditions.
- **Atomic Upload Rollback**: Automatic cleanup of Cloudinary orphan files if database save fails.
- **Refresh Token Hardening**: Strictly enforced `httpOnly` cookies with no request body fallback for increased XSS protection.
- **Credit Point Caps**: Backend validation for NIT recruitment rule compliance (Activities 5–22).
- **Payment & Application Integrity**: Fixed duplicate payment key errors and implemented read-only locks for submitted applications.

### Automation & Tools

- **Automated Job Closing**: Background worker that closes job postings exactly at their expiration date.
- **Cloudinary Orphan Cleanup**: Daily scheduled task to identify and remove unreferenced application files (scoped to `applications/` folder only).
- **Application Report System**: Standardized "Application Report" (Admin) and "Application Summary" (Applicant) PDF export system.
- **Notification System (v1)**: Automated SendGrid cloud-integration for applicant status updates (Shortlisted/Rejected).
- **Seed Script Data Alignment**: Fully aligned database seeding with Postman collections for comprehensive testing of all application sections.
- **Image Upload Stabilization**: Robust validation for image file types and sizes with proper state management for previews and error handling.
- **Vercel SPA Optimization**: Catch-all rewrite rules for full Single Page Application routing support.

---

## ⚠️ Pending / Partially Implemented

*(Currently all priority security hardening tasks and features are implemented.)*

---

## 🗺️ Planned Enhancements & Technical Debt

The following items are prioritized for future development phases.

### Phase 2: Testing & Stability

- [ ] **Unit Test Suite**: Comprehensive coverage for credit point calculations and complex business logic.
- [ ] **Integration Tests**: End-to-end verification of the multi-step application submission flow.
- [ ] **TypeScript Migration**: Incremental migration to full type safety across the backend.
- [ ] **Data Integrity**: Implement MongoDB Sessions/Transactions for all critical multi-document updates.

### Phase 3: Advanced Features

- [ ] **Notification Delivery Tracking**: Email outbox pattern — persist email state to DB for retry and audit trail.
- [ ] **Administrative Dashboard**: Visual analytics for application trends and audit trail visualization.
- [ ] **Background Worker Extraction**: Migrate cron jobs to BullMQ queue for robust horizontal scaling.
