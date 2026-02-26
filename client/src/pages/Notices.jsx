import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';

const CATEGORIES = ['All', 'Faculty Recruitment', 'Non-Teaching', 'Research', 'Exam', 'General'];

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (category !== 'All') params.category = category;
        const res = await api.get('/notices', { params });
        const data = res.data.data;
        setNotices(data.notices || data || []);
        setTotalPages(data.totalPages || 1);
      } catch {
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, [category, page]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-secondary text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Notices & Announcements</h1>
          <p className="text-gray-300 max-w-2xl">
            Stay updated with the latest recruitment notices, corrigendums, and important announcements from NIT Kurukshetra.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notice List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-gray-400 text-4xl">campaign_off</span>
            </div>
            <h3 className="text-xl font-bold text-gray-700">No notices found</h3>
            <p className="text-gray-500 mt-1">There are no notices in this category right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice, idx) => (
              <motion.div
                key={notice._id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {notice.category && (
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {notice.category}
                        </span>
                      )}
                      {notice.advtNo && (
                        <span className="text-gray-400 text-xs font-mono">
                          {notice.advtNo}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-secondary group-hover:text-primary transition-colors">
                      {notice.heading}
                    </h3>
                  </div>

                  <div className="flex gap-3 flex-shrink-0">
                    {notice.pdfUrl && (
                      <a
                        href={notice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                        View PDF
                      </a>
                    )}
                    {notice.externalLink && (
                      <a
                        href={notice.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-gray-200 hover:border-primary text-gray-600 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                        Link
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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

export default Notices;
