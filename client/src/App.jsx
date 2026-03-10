import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import ApplicationForm from './pages/ApplicationForm';
import Notices from './pages/Notices';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminJobs from './pages/admin/AdminJobs';
import AdminJobForm from './pages/admin/AdminJobForm';
import AdminNotices from './pages/admin/AdminNotices';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApplications from './pages/admin/AdminApplications';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import ApplicationReview from './pages/admin/ApplicationReview';
import ProtectedRoute from './components/ProtectedRoute';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

import ForgotPassword from './pages/ForgotPassword';
import Help from './pages/Help';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
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
          path="/admin/applicants"
          element={
            <ProtectedRoute roles={['admin', 'super_admin', 'reviewer']}>
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

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
