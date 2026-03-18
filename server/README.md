# Careers NITKKR — Backend API Engine

This directory contains the core Node.js application that powers the Careers NIT Kurukshetra recruitment portal. It's built on a security-first, reliably-atomic architecture used to manage the full recruitment lifecycle.

---

## 🏗️ Core Architecture & Tech Stack

Our backend focuses on **separation of concerns** and **data integrity**:

- **Runtime**: [Node.js](https://nodejs.org/) (LTS ≥18.x)
- **Framework**: [Express 5](https://expressjs.com/) with a professional Controller-Service-Model architecture.
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for ODM.
- **Security**: [JWT](https://jwt.io/) for stateless authentication and [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing.
- **Storage**: [Cloudinary](https://cloudinary.com/) for media management and cloud CDN optimization.
- **Payments**: [Razorpay](https://razorpay.com/) for category-based fee processing.
- **Validation**: [Zod](https://zod.dev/) for ultra-strict runtime type-safety.

---

## 📂 Folder Structure

```
server/
├── src/
│   ├── config/          # Central connectivity (DB, Cloudinary, Razorpay)
│   ├── controllers/     # Request/Response orchestration
│   ├── models/          # Mongoose schemas with atomic guard methods
│   ├── services/        # Business logic & 3rd party integrations (Email, File, Payment)
│   ├── middlewares/     # Authentication, Security, and Error Handling
│   ├── validators/      # Zod schemas for all input data
│   ├── scripts/         # Seeding, cleanup, and background cron jobs
│   ├── utils/           # Shared helpers and structured logging
│   └── app.js           # Core express initialization
├── docs/                # Comprehensive API & system documentation
└── package.json         # Dependency manifest
```

---

## 🛡️ Enterprise-Grade Features

1. **Secure Authentication**: We use JWT rotation with HttpOnly cookies to provide enterprise-grade protection against browser-based attacks.
2. **Role-Based Access Control (RBAC)**: A clean four-tier permission system (Applicant, Department, Admin, Super Admin) managing distinct data scopes and authorities.
3. **Custom Section Engine**: Support for dynamic application sections based on job requirements, academic backgrounds, and recruitment rules.
4. **Idempotent Application Flow**: We use strict state validation to ensure a "Submit" retry or double-click never creates duplicate data or payments.
5. **Atomic Rollbacks**: Automatic "cleanup" on failure to avoid storage leaks or "orphan" files (integrated with Cloudinary).
6. **JWT Rotation**: Safe refresh-token mechanism to keep security high and UX seamless.
7. **Background Workers**: Dedicated cron jobs for closing jobs and cleaning up orphan data.
8. **Rule-Based Validation**: Hardcoded NIT recruitment point-caps for automated compliance checking.

---

## 🚀 Quick Start (Development)

1.  **Environment Setup**:
    ```bash
    cp .env.example .env # Then fill in your keys
    ```

2.  **Dependencies**:
    ```bash
    npm install
    ```

3.  **Seed Database**:
    ```bash
    npm run seed
    ```

4.  **Launch**:
    ```bash
    npm run dev
    ```

---

## 📖 Further Documentation

- [Frontend API Reference](./docs/frontend_api_reference.md): Detailed endpoint and data-shape documentation.

---

**NIT Kurukshetra • Faculty Recruitment Portal — Backend Engineering**
