# Careers-NITKKR — Future Roadmap & TODO

This document outlines the remaining work for the recruitment portal.

## 🔧 Stubs & Reminders to Replace

These are placeholder implementations, TODOs, and known shortcuts left in the codebase that must be resolved before production.

- [ ] **`department` field in Job creation**: The `department` field in the "Create Job Draft" Postman request uses a hardcoded placeholder ObjectId (`507f1f77bcf86cd799439011`). Replace with a real `deptId` from the List Departments call once departments are seeded.
- [ ] **Credit Points manual-entry**: Activities 5–22 in the credit points section are self-declared by the applicant. No server-side caps or activity-level validation exists yet — add `maxPointsPerActivity` enforcement in `applicationSection.controller.js`.
- [ ] **`refreshToken` in request body**: The Refresh Token endpoint accepts the token in the request body as a fallback. Ensure the primary path (httpOnly cookie) is always used in the frontend; remove the body fallback before production.

---

## 💳 PHASE A: Payment Integration

- [ ] Data Model:
  - [ ] Create Payment model (orderID, txnID, amount, status).
  - [ ] Add paymentStatus to Application model.
- [ ] Integration:
  - [ ] Integrate Razorpay/PayU gateway.
  - [ ] Implement secure webhook for payment confirmation.
- [ ] Logic:
  - [ ] Prevent application submission unless paymentStatus === 'paid' or fee is exempted.

## 📧 Phase B: Email Verification & Notifications

## 📊 Phase C: Admin Insights & Polish

- [ ] Testing:
  - [ ] Add unit tests for validation services.
  - [ ] Add integration tests for the full submission flow.

---

> [!NOTE]
> Notification and Cron features are currently deferred to maintain focus on the core flow.
