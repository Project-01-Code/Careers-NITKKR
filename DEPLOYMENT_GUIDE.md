# Careers NITKKR - Zero-Cost Deployment Guide

This document provides a high-precision, step-by-step deployment plan for the Careers NITKKR application. This guide outlines a **$0 budget architecture** specifically designed for learning, testing, and handling moderate traffic (e.g., up to 1,000 applicants per year) without incurring monthly server costs.

## Architecture

This zero-cost plan utilizes the following free-tier services:
1.  **Frontend**: Vercel (Free Hobby Plan)
2.  **Backend (API)**: Render (Free Web Service)
3.  **Database**: MongoDB Atlas (Free `M0` Cluster)
4.  **File Storage**: Cloudinary (Free Tier)
5.  **Emails**: Gmail SMTP or Resend (Free Tier)

---

## 🛑 Critical Prerequisite: Removing ClamAV

**Before proceeding with this deployment, the backend codebase MUST be updated to remove ClamAV (`clamscan`).**

*Why?* The official ClamAV daemon requires significantly more RAM (2GB - 3GB) than any free tier service provides. Platforms like Render or Vercel will immediately crash out-of-memory if they attempt to boot ClamAV.

**Code Changes Required Before Deployment (Plannning Phase):**
1.  Uninstall the `clamscan` package: `npm uninstall clamscan`
2.  Remove all references to `clamscan` and Malware scanning in environment variables (`.env`, `config/env.config.js`).
3.  Rewrite the file upload middleware/services. You must bypass the `UPLOAD_TMP_DIR` local disk storage and use `multer-storage-cloudinary` to stream files directly from the request into Cloudinary. This ensures the Node.js server acts only as a proxy.
4.  **Important**: Because malware scanning is removed, enforce extremely strict Multer rules. Validate MIME types and file extensions (e.g., absolutely only allow `application/pdf`, `image/jpeg`, `image/png`).

*(Do not proceed with the steps below until the codebase has been simplified to standard Node/Express over MongoDB/Cloudinary).*

---

## 1. Third-Party Setup checklist

Before deploying any code, ensure you have the following accounts and credentials ready:

### A. MongoDB Atlas
1.  Create a cluster (Shared/Free Tier).
2.  Create a Database User in "Database Access".
3.  In "Network Access", allow access from anywhere (`0.0.0.0/0`) since Render IPs change.
4.  Copy your Connection String (`mongodb+srv://...`).

### B. Cloudinary
1.  Create an account.
2.  From your dashboard, copy the `Cloud Name`, `API Key`, and `API Secret`.

### C. Email Provider (Gmail/Resend)
*   **If Gmail**: Generate an App Password (requires 2FA).
*   **If Resend**: Verify your domain and copy the API key.

### D. Stripe
1.  Copy your `Publishable Key` and `Secret Key`.
2.  *(Optional but required later)*: You will need the Stripe Webhook Secret *after* deploying the backend.

---

## 2. Backend Deployment (Render)

We will deploy the `server/` folder as a Render Web Service.

1.  Push your updated codebase (without ClamAV) to GitHub.
2.  Log into [Render](https://render.com) and create a new **Web Service**.
3.  Connect your GitHub repository.
4.  **Configuration Settings**:
    *   **Name**: `careers-nitkkr-api` (or similar)
    *   **Language**: `Node`
    *   **Branch**: `main`
    *   **Root Directory**: `server` (Important: Tell Render that the backend lives inside the `/server` folder).
    *   **Build Command**: `npm install` (or `npm ci` for lockfiles).
    *   **Start Command**: `npm run start` (or `node src/index.js`).
    *   **Instance Type**: `Free` (0.1 CPU, 512 MB RAM).

5.  **Environment Variables**: Add all the variables from your local `server/.env` file into Render's Environment panel.
    *   `PORT=8000` (Render will automatically detect this or assign one).
    *   `NODE_ENV=production`
    *   `CORS_ORIGIN=https://careers-nitkkr.vercel.app` (This will be your Vercel frontend URL, update this later if it changes).
    *   `MONGODB_URI=...`
    *   `ACCESS_TOKEN_SECRET=...`
    *   `REFRESH_TOKEN_SECRET=...`
    *   *...and all Cloudinary, SMTP, and Stripe secrets.*

6.  Click **Create Web Service**. Render will install dependencies and start your app.
7.  Once deployed, copy the Render URL (e.g., `https://careers-nitkkr-api.onrender.com`).

*Note: Render's free tier spins down after 15 minutes of inactivity. The first request after a period of dormancy will take ~10-15 seconds.*

---

## 3. Frontend Deployment (Vercel)

We will deploy the `client/` folder as a Vercel project.

1.  Log into [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2.  Import your GitHub repository.
3.  **Configuration Settings**:
    *   **Project Name**: `careers-nitkkr`
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: Click "Edit" and choose `client`.

4.  **Environment Variables**: Add your frontend variables here.
    *   `VITE_API_BASE_URL=https://careers-nitkkr-api.onrender.com/api/v1` (Use the URL you got from Render in Step 2).
    *   `VITE_STRIPE_PUBLIC_KEY=...`
    *   `VITE_SUPPORT_EMAIL=...`
    *   `VITE_APP_NAME=...`

5.  Click **Deploy**. Vercel will build the React app and deploy it on their global edge network.

---

## 4. Final Wiring & Configuration

1.  **CORS Update (Render)**: If Vercel assigned you a specific `.vercel.app` domain (or if you buy a custom domain later), go back to Render's Environment settings and ensure `CORS_ORIGIN` precisely matches your frontend URL.
2.  **Stripe Webhooks**:
    *   Go to your Stripe Dashboard -> Developers -> Webhooks.
    *   Add an endpoint: `https://careers-nitkkr-api.onrender.com/api/v1/payments/webhook`.
    *   Select the events you process (e.g., `checkout.session.completed`).
    *   Copy the **Signing Secret** provided by Stripe.
    *   Go back to Render, add `STRIPE_WEBHOOK_SECRET=...` to the Environment Variables, and redeploy or restart the latest commit.

## 5. Seeding the Database in Production

You may need your initial admin accounts created in production. Render allows you to connect to the shell of your free instance.

1.  In the Render dashboard for your Web Service, go to the **Shell** tab.
2.  Run your seed script (assuming it's defined in your `package.json`):
    ```bash
    npm run seed
    ```
    *Alternatively:* `node src/scripts/seed.js`

You are now live!
