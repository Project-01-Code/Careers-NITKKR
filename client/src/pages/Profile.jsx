import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    nationality: 'Indian',
  });
  const [submitting, setSubmitting] = useState(false);

  // Real applications data
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch user's applications from the server
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await api.get('/applications', { params: { page, limit: 10 } });
      const data = res.data.data;
      setMyApplications(data.applications || data || []);
      setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  }, [page]);

  useEffect(() => {
    if (user?.profile) {
      setForm({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || '',
        dateOfBirth: user.profile.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : '',
        nationality: user.profile.nationality || 'Indian',
      });
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
    if (location.state?.refresh) {
      setActiveTab('applications');
    }
  }, [fetchApplications, location.state]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        phone: form.phone.replace(/[\s-]/g, ''),
      };
      await updateProfile(payload);
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  // Delete a draft application
  const handleDelete = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this draft application? This cannot be undone.')) return;
    try {
      await api.delete(`/applications/${appId}`);
      toast.success('Application deleted');
      setMyApplications((prev) => prev.filter((a) => a._id !== appId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete application');
    }
  };

  // Download summary PDF
  const handleDownloadSummary = async (appId) => {
    try {
      const res = await api.get(`/applications/${appId}/docket`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `summary-${appId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download summary');
    }
  };

  // Resume a draft application
  const handleResume = (app) => {
    const jobId = app.jobId?._id || app.jobId;
    navigate(`/application/${jobId}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      submitted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Submitted' },
      under_review: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Under Review' },
      shortlisted: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Shortlisted' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
      selected: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Selected' },
      withdrawn: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Withdrawn' },
    };
    const badge = badges[status] || badges.draft;
    return <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold`}>{badge.label}</span>;
  };

  return (
    <MainLayout>
      <div className="bg-secondary text-white py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-3xl font-bold mb-1">My Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage your applications and profile</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar / Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-primary/20">
                {form.firstName ? form.firstName[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <h3 className="font-bold text-lg text-secondary">
                {form.firstName && form.lastName
                  ? `${form.firstName} ${form.lastName}`
                  : user?.email || 'User'}
              </h3>
              <p className="text-gray-500 text-sm">{user?.email}</p>

              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 px-4 ${activeTab === 'applications' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="material-symbols-outlined text-lg">description</span>
                  My Applications
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 px-4 ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="material-symbols-outlined text-lg">person</span>
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 px-4 mt-4"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[500px]">

              <AnimatePresence mode="wait">
                {activeTab === 'applications' && (
                  <motion.div
                    key="applications"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">folder_open</span>
                        My Applications
                      </h2>
                      <Link to="/jobs" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                        Find Jobs <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>

                    {loadingApps ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : myApplications.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">inventory_2</span>
                        <h3 className="text-lg font-medium text-gray-700 mb-1">No Applications Found</h3>
                        <p className="text-gray-500 text-sm mb-6">You haven't started any job applications yet.</p>
                        <Link to="/jobs" className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors inline-block text-sm">
                          Browse Openings
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {myApplications.map((app) => (
                            <div key={app._id} className="border border-gray-200 rounded-xl p-5 hover:border-primary/30 transition-colors bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-bold text-gray-800 text-lg">
                                    {app.jobSnapshot?.title || app.jobId?.title || 'Application'}
                                  </h3>
                                  {getStatusBadge(app.status)}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {app.jobSnapshot?.department || 'Department'} • Ref: {app.applicationNumber}
                                </p>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                                  {app.submittedAt
                                    ? `Submitted: ${new Date(app.submittedAt).toLocaleDateString()}`
                                    : `Last updated: ${new Date(app.updatedAt).toLocaleDateString()}`
                                  }
                                </p>
                              </div>

                              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                    {app.status === 'draft' ? (
                                      <>
                                        <button
                                          onClick={() => handleResume(app)}
                                          className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">edit</span>
                                          Resume
                                        </button>
                                        <button
                                          onClick={() => handleDelete(app._id)}
                                          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors flex items-center gap-1.5"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">delete</span>
                                          Delete
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        {/* View Application (Read-only) */}
                                        {['submitted', 'under_review', 'shortlisted', 'rejected', 'selected', 'withdrawn'].includes(app.status) && (
                                          <button
                                            onClick={() => handleResume(app)}
                                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                            View Application
                                          </button>
                                        )}                                    {/* Summary only for non-draft */}
                                    <button
                                      onClick={() => handleDownloadSummary(app._id)}
                                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">download</span>
                                      Summary
                                    </button>

                                    {app.status === 'withdrawn' && (
                                      <span className="text-sm text-gray-400 italic px-4 py-2">Withdrawn</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                              disabled={page === 1}
                              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                            <button
                              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                              disabled={page === totalPages}
                              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-xl font-bold text-secondary mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">edit</span>
                      Edit Profile
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">First Name</label>
                          <input
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">Last Name</label>
                          <input
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={form.dateOfBirth}
                            onChange={handleChange}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-sm font-medium text-gray-700">Nationality</label>
                          <input
                            name="nationality"
                            value={form.nationality}
                            onChange={handleChange}
                            placeholder="Indian"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-primary text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-lg">save</span>
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
