import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import CategoryCard from '../components/CategoryCard';
import api from '../services/api';

const Home = () => {
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/notices', { params: { limit: 5 } });
        const data = res.data.data;
        setNotices(data.notices || data || []);
      } catch {
        setNotices([]);
      } finally {
        setLoadingNotices(false);
      }
    };
    fetchNotices();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return { month: '', day: '' };
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      day: d.getDate().toString(),
    };
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative w-full h-[500px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: 'url("https://nitkkr.ac.in/wp-content/uploads/2022/01/24131961_285405678647849_426967072086000359_o.jpg")' }}
        >
          <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-3xl flex flex-col items-start text-left text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 px-1 py-1 pr-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg mb-8 hover:bg-white/20 transition-colors cursor-default"
            >
              <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                New
              </span>
              <span className="font-medium text-sm md:text-base text-white tracking-wide">
                Faculty Recruitment 2026
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-xl"
            >
              Join the Legacy of Excellence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-100 max-w-2xl leading-relaxed drop-shadow-md"
            >
              Inviting applications from motivated and research-oriented professionals for faculty positions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex gap-4"
            >
              <Link
                to="/jobs"
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg shadow-primary/30 hover:-translate-y-0.5"
              >
                View Openings
              </Link>
              <Link
                to="/notices"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-full font-semibold border border-white/20 transition-all hover:-translate-y-0.5"
              >
                View Notices
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Categories & Notices */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Category Cards */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-secondary">
                Explore Opportunities
              </h2>
              <Link to="/jobs" className="text-primary font-medium hover:underline flex items-center gap-1">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CategoryCard
                title="Teaching Faculty"
                icon="school"
                count="12"
                description="Professors, Associate Professors, and Assistant Professors across various engineering and science disciplines."
                onClick={() => window.location.href = '/jobs?designation=Assistant+Professor'}
              />
              <CategoryCard
                title="Research & Projects"
                icon="science"
                count="08"
                description="Join cutting-edge research projects and collaborative initiatives funded by national and international agencies."
                onClick={() => window.location.href = '/jobs?recruitmentType=external'}
              />
            </div>

            {/* Additional Content / Info */}
            <div className="mt-12 bg-primary/5 rounded-2xl p-8 border border-primary/10">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-4xl text-primary">info</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Application Support</h3>
                  <p className="text-gray-600 mb-4">
                    Facing issues with the online application? Our support team is here to help you navigate the process.
                  </p>
                  <Link
                    to="/help"
                    className="bg-white text-primary border border-primary/20 px-4 py-2 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    Contact Helpdesk
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Notice Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">campaign</span>
                  Latest Notices
                </h3>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {loadingNotices ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notices.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No notices available</p>
                ) : (
                  notices.map((notice, index) => {
                    const { month, day } = formatDate(notice.createdAt);
                    return (
                      <a
                        key={notice._id || index}
                        href={notice.pdfUrl || notice.externalLink || '#'}
                        target={notice.pdfUrl || notice.externalLink ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="group flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                      >
                        <div className="flex-shrink-0 flex flex-col items-center bg-gray-100 rounded p-1 min-w-[50px] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <span className="text-xs font-bold uppercase">{month}</span>
                          <span className="text-lg font-bold">{day}</span>
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors line-clamp-2">
                            {notice.heading}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {notice.category && (
                              <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                                {notice.category}
                              </span>
                            )}
                            {notice.pdfUrl && (
                              <span className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-primary/70">
                                <span className="material-symbols-outlined text-[10px]">download</span> PDF
                              </span>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <Link to="/notices" className="text-sm text-gray-500 hover:text-primary font-medium transition-colors">
                  View Notice Archive
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
