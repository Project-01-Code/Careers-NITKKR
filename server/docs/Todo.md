# Careers-NITKKR — Future Roadmap & TODO

This document outlines the remaining work for the recruitment portal.

## 🚀 Immediate Next Steps (Pending Your Data)

- [ ] Standard Section Validation: Once you share the field requirements for Personal, Education, Research, Experience, etc., I will update sectionValidation.service.js with strict schema validation.

## 💳 PHASE A: Payment Integration

- [ ] Data Model:
  - [ ] Create Payment model (orderID, txnID, amount, status).
  - [ ] Add paymentStatus to Application model.
- [ ] Integration:
  - [ ] Integrate Razorpay/PayU gateway.
  - [ ] Implement secure webhook for payment confirmation.
- [ ] Logic:
  - [ ] Prevent application submission unless paymentStatus === 'paid' or fee is exempted.

## 📧 PHASE B: Email Verification & Notifications

- [ ] Identity:
  - [ ] Implement OTP/Token based email verification on register.
  - [ ] Block application creation for unverified accounts.
- [ ] Notifications:
  - [ ] Send submission confirmation emails with application Number.
  - [ ] Send password reset emails.

## 📊 Phase C: Admin Insights & Polish

- [ ] Dashboard:
  - [ ] GET /api/v1/admin/dashboard/stats: Summary counts of applications by status and job.
- [ ] Documents:
  - [ ] Generate a PDF "Application Receipt" for users after submission.
- [ ] Search:
  - [ ] Implement full-text search across application data using MongoDB indexes.
- [ ] Testing:
  - [ ] Add unit tests for validation services.
  - [ ] Add integration tests for the full submission flow.

---

> [!NOTE]
> Notification and Cron features are currently deferred to maintain focus on the core flow.