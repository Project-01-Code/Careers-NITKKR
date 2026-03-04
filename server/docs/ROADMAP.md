# Careers NIT Kurukshetra — Roadmap

> This document tracks the status of server hardening, implemented production features, and the future development roadmap.

---

## ✅ Implemented & Hardened Features

These features have been implemented, tested, and are ready for production use.

### Security & Reliability
- **Real Malware Scanning**: Multi-stage scanning using `clamscan` for all file buffers (PDFs/Images).
- **Atomic Submission Guard**: MongoDB transaction-based locks to prevent double-submission race conditions.
- **Atomic Upload Rollback**: Automatic cleanup of Cloudinary orphan files if database save fails.
- **Refresh Token Hardening**: Strictly enforced `httpOnly` cookies with no request body fallback for increased XSS protection.

### Automation & Tools
- **Automated Job Closing**: Background worker that closes job postings exactly at their expiration date.
- **Cloudinary Orphan Cleanup**: Daily scheduled task to identify and remove unreferenced cloud files.
- **Admin PDF Export**: Functionality for administrators to export comprehensive application reports.
- **Notification System (v1)**: Automated email alerts for applicant status updates (Shortlisted/Rejected).
- **Credit Point Caps**: Backend validation for NIT recruitment rule compliance (Activities 5–22).

---

## �️ Planned Enhancements & Technical Debt

The following items are prioritized for future development phases.

### Phase 2: Testing & Stability
- [ ] **Unit Test Suite**: Comprehensive coverage for credit point calculations and complex business logic.
- [ ] **Integration Tests**: End-to-end verification of the multi-step application submission flow.
- [ ] **TypeScript Migration**: Incremental migration to full type safety across the backend.

### Phase 3: Advanced Features
- [ ] **Notification Delivery Tracking**: Database model to track email delivery status and history.
- [ ] **Administrative Dashboard**: Visual analytics for application trends and audit trail visualization.
- [ ] **Direct File Scanning**: Integration with ClamAV daemon socket for higher performance scanning.
