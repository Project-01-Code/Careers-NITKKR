import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Lazy load components for performance
const Home = lazy(() => import('./pages/Home'));
const Jobs = lazy(() => import('./pages/Jobs'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
const Notices = lazy(() => import('./pages/Notices'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs'));
const AdminJobForm = lazy(() => import('./pages/admin/AdminJobForm'));
const AdminNotices = lazy(() => import('./pages/admin/AdminNotices'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'));
const AdminUserManagement = lazy(() => import('./pages/admin/AdminUserManagement'));
const AdminFeeExemption = lazy(() => import('./pages/admin/AdminFeeExemption'));
const ApplicationReview = lazy(() => import('./pages/admin/ApplicationReview'));
const ReviewerQueue = lazy(() => import('./pages/admin/ReviewerQueue'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Help = lazy(() => import('./pages/Help'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/by-advertisement" element={<JobDetail />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/help" element={<Help />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes — Authenticated Users */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/application/:jobId"
              element={
                <ProtectedRoute>
                  <ApplicationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:id/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:id/payment-cancel"
              element={
                <ProtectedRoute>
                  <PaymentCancel />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes — Admin / Super Admin / Reviewer */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={['admin', 'super_admin', 'reviewer']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <AdminJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs/new"
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <AdminJobForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs/:id/edit"
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <AdminJobForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notices"
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <AdminNotices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queue"
              element={
                <ProtectedRoute roles={['admin', 'super_admin', 'reviewer']}>
                  <ReviewerQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applicants"
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <AdminApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applicants/:id/review"
              element={
                <ProtectedRoute roles={['admin', 'super_admin', 'reviewer']}>
                  <ApplicationReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <AdminUserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fee-exemption"
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <AdminFeeExemption />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}

export default App;

