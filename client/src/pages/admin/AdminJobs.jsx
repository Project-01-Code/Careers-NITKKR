import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import JobStatsModal from '../../components/admin/JobStatsModal';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

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
  const [designationFilter, setDesignationFilter] = useState('');
  const [payLevelFilter, setPayLevelFilter] = useState('');
  const [recruitmentTypeFilter, setRecruitmentTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [departments, setDepartments] = useState([]);
  const [selectedStatsJob, setSelectedStatsJob] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (designationFilter) params.designation = designationFilter;
      if (payLevelFilter) params.payLevel = payLevelFilter;
      if (recruitmentTypeFilter) params.recruitmentType = recruitmentTypeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (departmentFilter) params.department = departmentFilter;

      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const res = await api.get('/admin/jobs', { params });
      const data = res.data.data;
      
      // Handle different possible backend response structures
      const jobsList = data.jobs || (Array.isArray(data) ? data : []);
      const total = data.totalPages || data.pagination?.totalPages || 1;
      
      setJobs(jobsList);
      setTotalPages(total);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    })();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchJobs(); }, [
    statusFilter,
    search,
    page,
    designationFilter,
    payLevelFilter,
    recruitmentTypeFilter,
    categoryFilter,
    departmentFilter,
    sortBy,
    sortOrder
  ]);

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

        {/* Filters Section */}
        <div className="bg-white px-4 py-3.5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-4 py-2.25 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm transition-all shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">filter_list</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-10 py-2.25 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm appearance-none cursor-pointer shadow-sm"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published / Active</option>
                <option value="closed">Closed / Expired</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center justify-between gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm h-[42px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-lg">sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-[11px] font-bold text-gray-500 cursor-pointer uppercase tracking-widest"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="applicationEndDate">Deadline</option>
                  <option value="payLevel">Pay Level</option>
                </select>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${sortOrder === 'asc' ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
                  title="Ascending"
                >
                  <span className="material-symbols-outlined text-base">north</span>
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${sortOrder === 'desc' ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
                  title="Descending"
                >
                  <span className="material-symbols-outlined text-base">south</span>
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-50/50" />

          {/* Secondary Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">
              <span className="material-symbols-outlined text-sm">tune</span>
              Advanced:
            </div>

            {[
              {
                value: designationFilter,
                setter: setDesignationFilter,
                placeholder: 'All Designations',
                options: [
                  { label: 'Professor', value: 'Professor' },
                  { label: 'Associate Prof.', value: 'Associate Professor' },
                  { label: 'Asst. Prof G-I', value: 'Assistant Professor Grade-I' },
                  { label: 'Asst. Prof G-II', value: 'Assistant Professor Grade-II' }
                ]
              },
              {
                value: departmentFilter,
                setter: setDepartmentFilter,
                placeholder: 'All Departments',
                options: departments.map(d => ({ label: d.name, value: d._id }))
              },
              {
                value: payLevelFilter,
                setter: setPayLevelFilter,
                placeholder: 'All Pay Levels',
                options: ["10", "11", "12", "13A2", "14A"].map(pl => ({ label: `Level ${pl}`, value: pl }))
              },
              {
                value: recruitmentTypeFilter,
                setter: setRecruitmentTypeFilter,
                placeholder: 'All Types',
                options: [{ label: 'External', value: 'external' }, { label: 'Internal', value: 'internal' }]
              },
              {
                value: categoryFilter,
                setter: setCategoryFilter,
                placeholder: 'All Categories',
                options: ["GEN", "SC", "ST", "OBC", "EWS", "PwD"].map(cat => ({ label: cat, value: cat }))
              }
            ].map((f, i) => (
              <div key={i} className="relative min-w-[140px]">
                <select
                  value={f.value}
                  onChange={(e) => { f.setter(e.target.value); setPage(1); }}
                  className={`w-full pl-3 pr-8 py-2 rounded-xl border appearance-none text-[11px] font-medium transition-all cursor-pointer ${f.value ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                >
                  <option value="">{f.placeholder}</option>
                  {f.options.map((opt, idx) => (
                    <option key={idx} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className={`material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none ${f.value ? 'text-primary' : 'text-gray-400'}`}>
                  expand_more
                </span>
              </div>
            ))}

            {(designationFilter || departmentFilter || payLevelFilter || recruitmentTypeFilter || categoryFilter || search || statusFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setDesignationFilter('');
                  setDepartmentFilter('');
                  setPayLevelFilter('');
                  setRecruitmentTypeFilter('');
                  setCategoryFilter('');
                  setPage(1);
                }}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/5 transition-all text-xs font-bold"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reset Filters
              </button>
            )}
          </div>
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
                    <th className="text-right py-3 px-10 font-semibold text-gray-600">Actions</th>
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
                          <Link
                            to={`/admin/applicants?jobId=${job._id}`}
                            className="p-1.5 hover:bg-secondary/5 rounded-lg transition-colors text-gray-500 hover:text-secondary"
                            title="View Applications"
                          >
                            <span className="material-symbols-outlined text-lg">group</span>
                          </Link>
                          <button
                            onClick={() => setSelectedStatsJob(job)}
                            className="p-1.5 hover:bg-primary/5 rounded-lg transition-colors text-gray-500 hover:text-primary"
                            title="Job Stats"
                          >
                            <span className="material-symbols-outlined text-lg">monitoring</span>
                          </button>
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

        {/* Modal */}
        {selectedStatsJob && (
          <JobStatsModal
            jobId={selectedStatsJob._id}
            jobTitle={selectedStatsJob.title}
            onClose={() => setSelectedStatsJob(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminJobs;
