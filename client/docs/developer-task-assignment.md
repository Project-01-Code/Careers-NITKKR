# Developer Task Assignment — Frontend

> **NIT KKR Careers Portal — Two-Developer Split**
> Last updated: February 2026

# Developer Task Assignment — Master Index

This is the high-level coordination hub. For detailed micro-tasks, checklists, and acceptance criteria, please go to the respective developer's private micro-plan.

---

## 🔵 [Developer A — Application Engine & Infra](./DEV-A-MICRO-PLAN.md)
**Focus**: Core state, stepper logic, file uploads, submission engine, and applicant dashboard.
- **Key Deliverable**: `SectionLayout.jsx` (Wrapper needed by Dev B).
- **Core Status**: Pre-submission logic & persistence.

## 🟣 [Developer B — Sections & Admin Portal](./DEV-B-MICRO-PLAN.md)
**Focus**: Individual form UIs, administrative management portal, reviewer workflow, and UX polish.
- **Dependency**: Must wait for `SectionLayout` to be ready before finalized section builds.
- **Core Status**: Data entry forms & internal tools.

---

## 🤝 Coordination & Sync Rules

### Daily Standup Checklist
1.  **Developer A**: Is `SectionLayout` stable? Any changes to Context?
2.  **Developer B**: Any new constants needed? Any UI patterns to be shared?
3.  **Both**: Have we hit a 🔔 **Backend Request Trigger** today?

### Shared Files (Edit with Caution)
- `/src/constants.js` — Enums for statuses and roles.
- `/src/services/api.js` — Global Axios configuration.
- `/src/context/AuthContext.jsx` — User session state.

---

## 🔔 Backend Request Master Timeline
Summarized from individual plans.

| Feature | Triggering Dev | Timing |
|---|---|---|
| **Email Verification** | Dev A | After Task A1 |
| **Payment Gateway** | Dev A | After Task A7 |
| **PDF Receipt & Search** | Dev B | After Wave 2 |

---

> Refer to [ROADMAP.md](./ROADMAP.md) for phase-by-phase delivery dates.
