import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
  archived: 'bg-orange-100 text-orange-700',
};

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get('/admin/jobs', { params });
      const data = res.data.data;
      setJobs(data.jobs || data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [statusFilter, search, page]);

  const handlePublish = async (id) => {
    if (!confirm('Publish this job? It will be visible publicly.')) return;
    try {
      await api.post(`/admin/jobs/${id}/publish`);
      toast.success('Job published successfully');
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    }
  };

  const handleClose = async (id) => {
    if (!confirm('Close this job? It will no longer accept applications.')) return;
    try {
      await api.post(`/admin/jobs/${id}/close`);
      toast.success('Job closed');
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job? This action is permanent.')) return;
    try {
      await api.delete(`/admin/jobs/${id}`);
      toast.success('Job deleted');
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Job Management</h1>
            <p className="text-gray-500 text-sm">Create, publish, and manage job postings</p>
          </div>
          <Link
            to="/admin/jobs/new"
            className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-44 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-sm appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">work_off</span>
            <h3 className="text-lg font-bold text-gray-600">No jobs found</h3>
            <p className="text-gray-400 text-sm mt-1">Create your first job posting to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Advert No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">Deadline</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, idx) => (
                    <motion.tr
                      key={job._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-secondary">{job.title}</p>
                          <p className="text-xs text-gray-400">{typeof job.department === 'object' ? job.department?.name : ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="font-mono text-xs text-gray-500">{job.advertisementNo}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-gray-500">
                        {formatDate(job.applicationEndDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[job.status] || statusColors.draft}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/jobs/${job._id}/edit`}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </Link>
                          {job.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(job._id)}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-gray-500 hover:text-green-600"
                              title="Publish"
                            >
                              <span className="material-symbols-outlined text-lg">publish</span>
                            </button>
                          )}
                          {job.status === 'published' && (
                            <button
                              onClick={() => handleClose(job._id)}
                              className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors text-gray-500 hover:text-orange-600"
                              title="Close"
                            >
                              <span className="material-symbols-outlined text-lg">lock</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(job._id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminJobs;
