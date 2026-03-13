import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminFeeExemption = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exempting, setExempting] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/applications', {
        params: { limit: 100, status: 'submitted' }
      });
      const list = res.data.data.applications || [];
      setApplications(list.filter((a) => a.paymentStatus === 'pending' || a.paymentStatus === 'failed'));
    } catch {
      toast.error('Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleExempt = async (appId) => {
    const reason = prompt('Enter reason for fee exemption (min 5 characters):', 'Administrative exemption');
    if (!reason || reason.trim().length < 5) {
      toast.error('Reason must be at least 5 characters');
      return;
    }
    setExempting(appId);
    try {
      await api.post(`/admin/applications/${appId}/exempt-fee`, { reason: reason.trim() });
      toast.success('Fee exempted successfully');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to exempt fee');
    } finally {
      setExempting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Fee Exemption</h1>
          <p className="text-gray-500 text-sm">
            Exempt application fees for pending payment applications (Admin only)
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">payments</span>
            <h3 className="text-lg font-bold text-secondary mb-2">No Pending Fees</h3>
            <p className="text-gray-500 text-sm">
              All submitted applications have paid or exempted fees.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-600">Application</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Applicant</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Job</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Payment</th>
                  <th className="p-4 text-right font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-bold text-secondary">{app.applicationNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-secondary">{app.userId?.profile?.fullName || app.userId?.email}</p>
                      <p className="text-xs text-gray-400">{app.userId?.email}</p>
                    </td>
                    <td className="p-4 text-gray-600 truncate max-w-[200px]">{app.jobId?.title}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        {app.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleExempt(app._id)}
                        disabled={exempting === app._id}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        {exempting === app._id ? 'Processing...' : 'Exempt Fee'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link to="/admin/applicants" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Applicants
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminFeeExemption;
