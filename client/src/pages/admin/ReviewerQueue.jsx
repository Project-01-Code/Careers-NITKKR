import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

const ReviewerQueue = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/reviews/queue');
        setApplications(res.data.data.applications || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load evaluation queue');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

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
          <div className="grid gap-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Evaluation Queue
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.map((item, idx) => {
                const app = item;
                const review = item.review || null;
                const isSubmitted = review?.status === 'SUBMITTED';
                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-secondary truncate flex-1">
                          {app.userId?.profile?.fullName || app.userId?.profile?.firstName || 'Applicant'}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSubmitted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isSubmitted ? 'Submitted' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {app.jobId?.title || 'Job'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Applied: {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                      </p>
                      {review?.scorecard?.totalScore !== undefined && (
                        <p className="text-xs font-medium text-primary">
                          Score: {review.scorecard.totalScore}/100
                        </p>
                      )}
                      <Link
                        to={`/admin/applicants/${app._id}/review`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold transition-colors mt-2"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {isSubmitted ? 'visibility' : 'play_arrow'}
                        </span>
                        {isSubmitted ? 'View Assessment' : 'Start Assessment'}
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReviewerQueue;
