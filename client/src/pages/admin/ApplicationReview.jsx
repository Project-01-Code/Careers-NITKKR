import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-purple-100 text-purple-700',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  selected: 'bg-green-100 text-green-700',
};

const ApplicationReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [statusRemarks, setStatusRemarks] = useState('');

  const fetchApplication = async () => {
    try {
      const res = await api.get(`/admin/applications/${id}`);
      setApp(res.data.data);
    } catch (err) {
      toast.error('Failed to load application');
      navigate('/admin/applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplication(); }, [id]);

  const handleVerifySection = async (sectionType, isVerified, notes) => {
    try {
      await api.patch(`/admin/applications/${id}/verify-section`, {
        sectionType, isVerified, notes
      });
      toast.success(`${sectionType} updated`);
      fetchApplication();
    } catch (err) {
      toast.error('Failed to verify section');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!statusRemarks) {
      toast.error('Please provide remarks/notes for status change');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/admin/applications/${id}/status`, {
        status, remarks: statusRemarks
      });
      toast.success(`Status updated to ${status}`);
      setStatusRemarks('');
      fetchApplication();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const sections = Array.from(app.sections.keys());
  const currentSection = app.sections[activeTab] || {};

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-secondary">{app.userId?.profile?.fullName || 'Untitled'}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[app.status]}`}>
                  {app.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm">{app.userId?.email} • {app.applicationNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase font-bold px-1">Applied For</p>
            <p className="text-secondary font-medium">{app.jobId?.title}</p>
            <p className="text-xs text-gray-500">{app.jobId?.advertisementNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Data Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              {/* Tabs Nav */}
              <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                {sections.map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveTab(s)}
                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                      activeTab === s ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {s.replace(/_/g, ' ').toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Tab Panel */}
              <div className="p-8 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                        {activeTab.replace(/_/g, ' ').toUpperCase()}
                        {app.sections[activeTab]?.isVerified && (
                          <span className="material-symbols-outlined text-green-500 text-xl">verified</span>
                        )}
                      </h3>
                      {app.sections[activeTab]?.pdfUrl && (
                        <a
                          href={app.sections[activeTab].pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                          VIEW DOCUMENT
                        </a>
                      )}
                    </div>

                    {/* Dynamic Data Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      {Object.entries(app.sections[activeTab]?.data || {}).map(([key, val]) => (
                        <div key={key}>
                          <p className="text-[10px] text-gray-400 uppercase font-black mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-secondary font-medium whitespace-pre-wrap">{val !== null && val !== undefined ? String(val) : '—'}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Section Verification */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-secondary text-sm">SECTION VERIFICATION</h3>
              <p className="text-xs text-gray-500">Verify <strong>{activeTab.toUpperCase()}</strong> section</p>
              
              <div className="flex items-center gap-4 py-2">
                <button
                  onClick={() => handleVerifySection(activeTab, true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    app.sections[activeTab]?.isVerified ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  APPROVE
                </button>
                <button
                   onClick={() => handleVerifySection(activeTab, false)}
                   className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    app.sections[activeTab]?.isVerified === false && app.sections[activeTab]?.verificationNotes ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  REJECT
                </button>
              </div>

              <textarea
                placeholder="Add verification notes..."
                className="w-full h-24 p-3 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={app.sections[activeTab]?.verificationNotes || ''}
                readOnly
              />
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-secondary text-sm">UPDATE APPLICATION STATUS</h3>
              
              <textarea
                placeholder="Enter remarks for status change..."
                className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
              />

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleUpdateStatus('shortlisted')}
                  disabled={submitting}
                  className="bg-yellow-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                >
                  SHORTLIST CANDIDATE
                </button>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={submitting}
                  className="bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  REJECT APPLICATION
                </button>
                <button
                  onClick={() => handleUpdateStatus('selected')}
                  disabled={submitting}
                  className="bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50"
                >
                  MARK AS SELECTED
                </button>
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-secondary text-sm uppercase">Status History</h3>
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-100">
                {app.statusHistory?.map((h, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <p className="text-xs font-bold text-secondary uppercase">{h.status}</p>
                    <p className="text-[10px] text-gray-400">{new Date(h.changedAt).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1 italic">"{h.remarks}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ApplicationReview;
