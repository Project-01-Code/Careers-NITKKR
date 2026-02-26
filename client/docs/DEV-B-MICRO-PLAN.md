# 🟣 Developer B — Micro-Operation Plan (Admin & Reviewer)
## Focus: Admin Portal, Reviewer Workflow, and Recruitment Control

This plan covers the internal tools used by the NIT Staff to manage the recruitment lifecycle.

---

### PHASE 1 — ADMIN INFRASTRUCTURE
*   [ ] **Task B1: Admin Layout**: Build the secure sidebar and role-guarded navigation.
*   [ ] **Task B2: RBAC Gates**: UI-level logic to hide "Admin-only" features from "Reviewers".

---

### PHASE 2 — CONTENT MANAGEMENT
*   [ ] **Task B3: Job Manager**: CRUD interface for creating and publishing Job Postings.
*   [ ] **Task B4: Notice Manager**: Management of public notices and PDF document links.

---

### PHASE 3 — APPLICATION MONITORING (THE REGISTRY)
*   [ ] **Task B5: Master Registry**: Paginated list of all applications across all jobs.
*   [ ] **Task B6: Filter Lab**: Advanced search and multi-select filtering (by Status, Dept, etc.).
*   [ ] **Task B7: Bulk Operations**: Mass status updates (e.g., Selecting 20 people at once).
*   [ ] **Task B8: Data Export**: CSV export functionality for all candidate data.

---

### PHASE 4 — THE REVIEWER WORKSPACE (DETAILS)
Build the detailed evaluation interface for individual applications:
*   [ ] **Snapshot View**: Read-only display of the Applicant's forms (Education, Research, etc.).
*   [ ] **Verification Panel**: Per-section approval/rejection with reviewer notes.
*   [ ] **Evaluation Tools**: Internal review notes and final status scoring.
*   [ ] **Audit Trail**: Visual timeline of all status changes for that applicant.

---

### PHASE 5 — USER & SYSTEM GOVERNANCE
*   [ ] **Task B9: User Mgmt**: Internal user list and promotion to Reviewer/Admin roles.
*   [ ] **Task B10: System Dashboard**: High-level visual counters and metrics.

---

### 🔔 BACKEND REQUESTS FOR TEAM B
- **Trigger B5**: Request PDF Receipt generation and Full-text Search indexing.
