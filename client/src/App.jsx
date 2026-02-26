import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import ApplicationForm from './pages/ApplicationForm';
import Notices from './pages/Notices';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AdminJobs from './pages/admin/AdminJobs';
import AdminJobForm from './pages/admin/AdminJobForm';
import AdminNotices from './pages/admin/AdminNotices';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder for pages not yet built
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-6">
    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">construction</span>
    <h1 className="text-3xl font-bold text-gray-400">{title}</h1>
    <p className="text-gray-400 mt-2">This page is coming soon.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/help" element={<Placeholder title="Help Center" />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

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

        {/* Admin Routes — Admin / Super Admin Only */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/jobs" replace />}
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

        {/* 404 */}
        <Route path="*" element={<Placeholder title="404 — Page Not Found" />} />
      </Routes>
    </Router>
  );
}

export default App;
