import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminApplications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const jobId = searchParams.get('jobId') || '';
  const search = searchParams.get('search') || '';
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/admin/jobs', { params: { limit: 100 } });
        setJobs(res.data.data.jobs || []);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/applications', {
          params: { page, status, jobId, search, limit: 15 }
        });
        setApplications(res.data.data.applications);
        setTotalPages(res.data.data.pagination.totalPages);
      } catch (err) {
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [page, status, jobId, search]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/applications/export', {
        params: { status, jobId },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Applications</h1>
            <p className="text-gray-500 text-sm">Review and manage recruitment applications</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap gap-4 items-center shadow-sm">
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Search ID, Name or Email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded-xl border border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            value={jobId}
            onChange={(e) => handleFilterChange('jobId', e.target.value)}
          >
            <option value="">All Jobs</option>
            {jobs.map(j => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 rounded-xl border border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            value={status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="selected">Selected</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-20 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-2">description</span>
              <p className="text-gray-500">No applications found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Application</th>
                    <th className="p-4 font-semibold text-gray-600">Applicant</th>
                    <th className="p-4 font-semibold text-gray-600">Job Posting</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app, idx) => (
                    <motion.tr
                      key={app._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-secondary">{app.applicationNumber}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                            {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-secondary">{app.userId?.profile?.fullName || 'Untitled'}</span>
                          <span className="text-xs text-gray-400">{app.userId?.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col max-w-[250px]">
                          <span className="text-secondary font-medium truncate">{app.jobId?.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono italic">{app.jobId?.advertisementNo}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          app.status === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                          app.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'selected' ? 'bg-green-100 text-green-700' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/admin/applicants/${app._id}/review`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all text-xs font-bold"
                        >
                          <span className="material-symbols-outlined text-base">rate_review</span>
                          Review
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => handleFilterChange('page', page - 1)}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-sm font-medium text-gray-500">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => handleFilterChange('page', page + 1)}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminApplications;
