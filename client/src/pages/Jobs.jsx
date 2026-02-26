import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import JobCard from '../components/JobCard';
import api from '../services/api';

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [designation, setDesignation] = useState(searchParams.get('designation') || 'All');
  const [department, setDepartment] = useState(searchParams.get('department') || 'All');
  const [departments, setDepartments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch departments for filter dropdown
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data.data || []);
      } catch {
        setDepartments([]);
      }
    };
    fetchDepts();
  }, []);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (searchTerm) params.search = searchTerm;
        if (designation !== 'All') params.designation = designation;
        if (department !== 'All') params.department = department;
        const res = await api.get('/jobs', { params });
        const data = res.data.data;
        setJobs(data.jobs || data || []);
        setTotalPages(data.totalPages || 1);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [searchTerm, designation, department, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDesignation('All');
    setDepartment('All');
    setPage(1);
    setSearchParams({});
  };

  return (
    <MainLayout>
      <div className="bg-secondary text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Current Openings</h1>
          <p className="text-gray-300 max-w-2xl">
            Join our team of exceptional faculty members and researchers. Browse through the current opportunities below.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Filters */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-grow relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search by title, department, or keywords..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
            />
          </div>

          {/* Designation Filter */}
          <div className="flex-shrink-0">
            <select
              value={designation}
              onChange={(e) => { setDesignation(e.target.value); setPage(1); }}
              className="w-full md:w-52 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white cursor-pointer shadow-sm appearance-none"
            >
              <option value="All">All Designations</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor Grade-I">Asst. Professor Gr-I</option>
              <option value="Assistant Professor Grade-II">Asst. Professor Gr-II</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex-shrink-0">
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full md:w-52 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white cursor-pointer shadow-sm appearance-none"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </form>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-4xl">search_off</span>
                </div>
                <h3 className="text-xl font-bold text-gray-700">No jobs found</h3>
                <p className="text-gray-500">Try adjusting your search or filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-primary font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  p === page
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'border border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Jobs;