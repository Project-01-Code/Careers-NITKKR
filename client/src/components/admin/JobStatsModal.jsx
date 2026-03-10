import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const JobStatsModal = ({ jobId, jobTitle, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/admin/dashboard/stats/job/${jobId}`);
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch job stats', err);
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchStats();
  }, [jobId]);

  if (!jobId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-secondary">Job Statistics</h2>
              <p className="text-sm text-gray-500 font-medium">{jobTitle}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-white hover:shadow-md transition-all flex items-center justify-center text-gray-400 hover:text-secondary border border-transparent hover:border-gray-100"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-400">Loading statistics...</p>
              </div>
            ) : !stats ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load statistics for this job.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Top Level Count */}
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary/60 uppercase tracking-wider">Total Applications</p>
                      <h3 className="text-3xl font-black text-secondary">{stats.totalApplications || 0}</h3>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Status Breakdown */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">By Status</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.byStatus || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 italic transition-all hover:border-primary/20">
                          <span className="text-sm font-bold text-secondary capitalize">{status.replace('_', ' ')}</span>
                          <span className="px-3 py-1 bg-white rounded-lg text-xs font-black text-primary border border-gray-100 shadow-sm">{count}</span>
                        </div>
                      ))}
                      {(!stats.byStatus || Object.keys(stats.byStatus).length === 0) && (
                        <p className="text-sm text-gray-400 italic">No applications yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Payments</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.byPayment || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:border-primary/20">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              status === 'completed' ? 'bg-green-500' :
                              status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-bold text-secondary capitalize">{status}</span>
                          </div>
                          <span className="px-3 py-1 bg-white rounded-lg text-xs font-black text-primary border border-gray-100 shadow-sm">{count}</span>
                        </div>
                      ))}
                      {(!stats.byPayment || Object.keys(stats.byPayment).length === 0) && (
                        <p className="text-sm text-gray-400 italic">No payment info.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-secondary/20 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JobStatsModal;
