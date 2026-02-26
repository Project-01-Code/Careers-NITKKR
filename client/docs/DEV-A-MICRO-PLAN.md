# 🔵 Developer A — Micro-Operation Plan (Applicant Experience)
## Focus: Public Discovery, Auth, and Application Engine

This plan covers the entire journey of a candidate from finding a job to submitting their application.

---

### PHASE 1 — PUBLIC DISCOVERY & IDENTITY
*   [ ] **Task A1: Job Discovery**: `Jobs.jsx` — Implement search, category filters, and sorting.
*   [ ] **Task A2: Job Details**: `JobDetail.jsx` — Full JD display and "Apply" button logic.
*   [ ] **Task A3: Identity**: Login/Signup flows and the `Profile.jsx` dashboard.

---

### PHASE 2 — THE APPLICATION ENGINE (INFRA)
*   [ ] **Task A4: Application Context**: Create `ApplicationContext.jsx` to manage draft IDs and form state.
*   [ ] **Task A5: Stepper & Layout**: Build the multi-step `SectionLayout` wrapper.
*   [ ] **Task A6: File persistence**: Build `ImageUpload` (Photo/Sig) and `PdfUpload` (Certificates).

---

### PHASE 3 — THE FORMS (APPLICANT FILLING)
Build and integrate all 19 mandatory and optional sections that the applicant must fill:
*   [ ] **Core**: Personal, Education, Experience, Referees.
*   [ ] **Research**: Publications (Journal/Book/Conference), Patents, Projects.
*   [ ] **Academic**: PhD Supervision, Subjects Taught, Organized Programs.
*   [ ] **Misc**: Credit Points entry, Other Info (Custom fields).
*   [ ] **Final**: Documents upload and the Declaration step.

---

### PHASE 4 — SUBMISSION & DASHBOARD
*   [ ] **Task A7: Validation**: `validate-all` logic before allowing submission.
*   [ ] **Task A8: Final Submit**: Payment step integration and locking the application.
*   [ ] **Task A9: My Applications**: List view for applicants to track their progress and withdraw drafts.

---

### 🔔 BACKEND REQUESTS FOR TEAM A
- **Trigger A1**: Request Email Verification API.
- **Trigger A7**: Request Payment Gateway integration.
