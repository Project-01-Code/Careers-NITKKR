import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminFeeExemption = () => {
  const [searchId, setSearchId] = useState('');
  const [application, setApplication] = useState(null);
  const [searching, setSearching] = useState(false);
  const [exempting, setExempting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) {
      toast.error('Please enter an Application ID');
      return;
    }

    setSearching(true);
    setApplication(null);
    try {
      const res = await api.get(`/admin/applications/by-number/${encodeURIComponent(trimmed)}`);
      setApplication(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application not found');
    } finally {
      setSearching(false);
    }
  };

  const handleExempt = async () => {
    if (!application) return;
    const reason = prompt('Enter reason for fee exemption (min 5 characters):', 'Administrative exemption');
    if (!reason || reason.trim().length < 5) {
      toast.error('Reason must be at least 5 characters');
      return;
    }
    setExempting(true);
    try {
      await api.post(`/admin/applications/${application._id}/exempt-fee`, { reason: reason.trim() });
      toast.success('Fee exempted successfully');
      // Refresh application data
      const res = await api.get(`/admin/applications/by-number/${encodeURIComponent(application.applicationNumber)}`);
      setApplication(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to exempt fee');
    } finally {
      setExempting(false);
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    exempted: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Fee Exemption</h1>
          <p className="text-gray-500 text-sm">
            Exempt application fees using the applicant's Application ID
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">search</span>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Application ID (e.g. APP-2026-A3F2D8E1)"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-secondary text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-lg">manage_search</span>
              )}
              Search
            </button>
          </form>
        </div>

        {/* Result */}
        {application && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            {/* Application Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Application ID</p>
                <p className="text-lg font-bold text-secondary font-mono">{application.applicationNumber}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${statusColors[application.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                {application.paymentStatus}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Applicant</p>
                <p className="text-sm font-semibold text-secondary">
                  {[application.userId?.profile?.firstName, application.userId?.profile?.lastName].filter(n => n && n !== 'N/A').join(' ') || application.userId?.profile?.fullName || application.userId?.email || 'Applicant'}
                </p>
                <p className="text-xs text-gray-400">{application.userId?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Job Posting</p>
                <p className="text-sm font-semibold text-secondary truncate">{application.jobId?.title}</p>
                <p className="text-xs text-gray-400 font-mono">{application.jobId?.advertisementNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Application Status</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  application.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  application.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {application.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Submitted At</p>
                <p className="text-sm text-secondary">
                  {application.submittedAt
                    ? new Date(application.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Not submitted yet'}
                </p>
              </div>
            </div>

            {/* Action */}
            {application.paymentStatus === 'pending' || application.paymentStatus === 'failed' ? (
              <button
                onClick={handleExempt}
                disabled={exempting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exempting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">money_off</span>
                )}
                {exempting ? 'Processing...' : 'Exempt Fee'}
              </button>
            ) : (
              <div className={`text-center py-3 rounded-xl text-sm font-bold ${
                application.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' :
                application.paymentStatus === 'exempted' ? 'bg-blue-50 text-blue-700' :
                'bg-gray-50 text-gray-600'
              }`}>
                {application.paymentStatus === 'paid' && '✓ Fee Already Paid'}
                {application.paymentStatus === 'exempted' && '✓ Fee Already Exempted'}
              </div>
            )}
          </div>
        )}

        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Dashboard
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminFeeExemption;
