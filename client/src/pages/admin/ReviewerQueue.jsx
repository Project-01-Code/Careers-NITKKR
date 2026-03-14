import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

const ReviewerQueue = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const fetchQueue = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reviews/queue?page=${page}&limit=12`);
      setApplications(res.data.data.applications || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load evaluation queue');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(pagination.page);
  }, [pagination.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Expert Evaluation Portal</h1>
          <p className="text-gray-500 text-sm">
            Applications assigned to you for structured assessment
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[40vh]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">assignment</span>
            <h3 className="text-lg font-bold text-secondary mb-2">No Pending Assessments</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              You have no applications assigned for evaluation. Administrators will assign applications to your queue when they are ready for expert review.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                Evaluation Queue ({pagination.total})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {applications.map((item, idx) => {
                const app = item;
                const review = item.review || null;
                const isSubmitted = review?.status === 'SUBMITTED';
                const submissionDate = new Date(app.submittedAt || app.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* CARD BODY */}
                    <div className="p-6 flex flex-col gap-5 flex-1">
                      {/* TOP: Identity and Badge */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            {app.sections?.photo?.imageUrl ? (
                              <img
                                src={app.sections.photo.imageUrl}
                                alt={app.userId?.profile?.fullName}
                                className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200">
                                <span className="material-symbols-outlined text-2xl">person</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary transition leading-tight line-clamp-2">
                              {app.userId?.profile?.fullName || 'Applicant'}
                            </h3>
                          </div>
                        </div>

                        <span className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                          isSubmitted ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {isSubmitted ? 'COMPLETE' : 'PENDING'}
                        </span>
                      </div>

                      {/* IDENTIFIERS: Dedicated Row to prevent overlap */}
                      <div className="flex items-center px-3 py-2 bg-gray-50/50 rounded-xl border border-gray-100">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-secondary">{app.applicationNumber || 'ID-PENDING'}</span>
                          <span className="w-1 h-3 border-l border-gray-200 mx-1"></span>
                          <span className="text-primary">{app.jobId?.advertisementNo}</span>
                        </div>
                      </div>

                      {/* ROLE */}
                      <div className="flex items-center gap-3 text-gray-600">
                        <span className="material-symbols-outlined text-gray-400 text-xl">work</span>
                        <p className="text-sm font-semibold truncate">
                          {app.jobId?.title || 'Job Posting'}
                        </p>
                      </div>

                      {/* SUBMITTED */}
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="material-symbols-outlined text-gray-400 text-xl">schedule</span>
                        <p className="text-xs font-medium">
                          Submitted: <span className="font-bold text-gray-600 ml-1">{submissionDate}</span>
                        </p>
                      </div>

                      {/* SCORE - Only show if submitted */}
                      {isSubmitted && review?.scorecard ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between mt-auto">
                          <div className="space-y-1">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wide">
                              Assessment Score
                            </p>
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-lg border ${
                              review.scorecard.recommendation === 'RECOMMENDED' ? 'bg-green-100 text-green-700 border-green-200' :
                              review.scorecard.recommendation === 'NOT_RECOMMENDED' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              {review.scorecard.recommendation}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-black text-secondary leading-none">{review.scorecard.totalScore}</span>
                            <span className="text-sm font-black text-gray-300">/100</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50/50 border border-dashed border-blue-100 rounded-2xl p-4 mt-auto">
                           <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest text-center">Pending Expert Review</p>
                        </div>
                      )}
                    </div>

                    {/* ACTION */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                      <Link
                        to={`/admin/applicants/${app._id}/review`}
                        className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          isSubmitted 
                          ? 'bg-secondary text-white hover:bg-black shadow-lg shadow-secondary/10' 
                          : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {isSubmitted ? 'visibility' : 'analytics'}
                        </span>
                        {isSubmitted ? 'View Evaluation' : 'Begin Evaluation'}
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination UI */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-10">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      pagination.page === i + 1 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReviewerQueue;