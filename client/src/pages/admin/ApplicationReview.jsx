import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ReviewScorecard from '../../components/admin/ReviewScorecard';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-purple-100 text-purple-700',
  reviewed: 'bg-indigo-100 text-indigo-700',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  selected: 'bg-green-100 text-green-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

const ApplicationReview = () => {
  const renderSectionValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (Array.isArray(val)) {
      if (val.length === 0) return '—';
      return (
        <div className="space-y-4 mt-2">
          {val.map((item, idx) => (
            <div key={idx} className="relative p-4 pl-12 bg-white rounded-xl border border-gray-100 shadow-sm text-xs">
              <div className="absolute left-3 top-4 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                {idx + 1}
              </div>
              {renderSectionValue(item)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof val === 'object') {
      return (
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(val).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-gray-400 font-bold uppercase text-[9px] min-w-[80px]">{k.replace(/([A-Z])/g, ' $1')}:</span>
              <span className="text-secondary italic">
                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="whitespace-pre-wrap">{String(val)}</span>;
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [expertReviews, setExpertReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [statusRemarks, setStatusRemarks] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isReviewerOnly = user?.role === 'reviewer';

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/applications/${id}`);
      setApp(res.data.data);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error('Failed to load application');
      navigate(isReviewerOnly ? '/admin/queue' : '/admin/applicants');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpertReviews = async () => {
    try {
      const res = await api.get(`/admin/reviews/application/${id}`);
      setExpertReviews(res.data.data?.reviews || []);
    } catch {
      setExpertReviews([]);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (app?._id) fetchExpertReviews();
  }, [app?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerifySection = async (sectionType, isVerified, notes) => {
    try {
      await api.patch(`/admin/applications/${id}/verify-section`, {
        sectionType, isVerified, notes
      });
      toast.success(`${sectionType} updated`);
      fetchApplication();
    // eslint-disable-next-line no-unused-vars
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

  const handleAddReviewNotes = async () => {
    if (!reviewNotes.trim()) { toast.error('Please enter review notes'); return; }
    try {
      await api.patch(`/admin/applications/${id}/review`, { reviewNotes });
      toast.success('Review notes saved');
      setReviewNotes('');
      fetchApplication();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save review notes');
    }
  };

  const handleSubmitScorecard = async (payload) => {
    try {
      await api.post(`/admin/reviews/${id}`, payload);
      toast.success('Assessment saved successfully');
      fetchExpertReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assessment');
      throw err;
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const backHref = isReviewerOnly ? '/admin/queue' : '/admin/applicants';

  const activeSection = app.sections?.get ? app.sections.get(activeTab) : app.sections?.[activeTab];
  const sections = app.sections 
    ? (typeof app.sections.keys === 'function' ? Array.from(app.sections.keys()) : Object.keys(app.sections)) 
    : [];

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <Link to={backHref} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
          {isReviewerOnly ? 'Back to Evaluation Queue' : 'Back to Applicants'}
        </Link>
        {/* Premium Header */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-xl shadow-primary/20">
                {app.sections?.photo?.imageUrl ? (
                  <img src={app.sections.photo.imageUrl} alt="Applicant" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="material-symbols-outlined text-4xl">person</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-secondary tracking-tight">
                    {app.userId?.profile?.fullName || 'Applicant Profile'}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-700'}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary/60">mail</span>
                    {app.userId?.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary/60">tag</span>
                    {app.applicationNumber || 'ID Pending'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest px-1">APPLIED FOR</p>
                <p className="text-secondary font-bold text-lg">{app.jobId?.title}</p>
                <p className="text-xs text-gray-500 font-medium">{app.jobId?.advertisementNo}</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <a
                  href={`${api.defaults.baseURL}/admin/applications/${id}/export-full`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-secondary/20 group"
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">picture_as_pdf</span>
                  DOCKET (FULL REPORT + RECEIPT)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Reviewer: Prominent Assessment Panel - shown at top for reviewers */}
        {isReviewerOnly && (
          <div className="mb-6">
            <ReviewScorecard
              applicationId={id}
              initialData={expertReviews[0]}
              onSubmit={handleSubmitScorecard}
              readOnly={false}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Data Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              {/* Tabs Nav - with verification indicators */}
              <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                {sections.filter(s => s !== 'declaration').map((s, idx) => {
                  const sectionData = app.sections?.get ? app.sections.get(s) : app.sections?.[s];
                  const isVerified = sectionData?.isVerified === true;
                  const isRejected = sectionData?.isVerified === false && sectionData?.verificationNotes;
                  return (
                    <button
                      key={s}
                      onClick={() => setActiveTab(s)}
                      className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${activeTab === s ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      <span className="text-[10px] opacity-50 font-black">{idx + 1}.</span>
                      {s.replace(/_/g, ' ').toUpperCase()}
                      {isVerified && (
                        <span className="material-symbols-outlined text-green-500 text-base" title="Verified">check_circle</span>
                      )}
                      {isRejected && (
                        <span className="material-symbols-outlined text-red-500 text-base" title="Rejected">cancel</span>
                      )}
                      {!isVerified && !isRejected && (
                        <span className="material-symbols-outlined text-gray-300 text-base" title="Pending">radio_button_unchecked</span>
                      )}
                    </button>
                  );
                })}
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
                        {activeSection?.isVerified && (
                          <span className="material-symbols-outlined text-green-500 text-xl">verified</span>
                        )}
                      </h3>
                      {activeSection?.pdfUrl && (
                        <a
                          href={activeSection.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                          VIEW DOCUMENT
                        </a>
                      )}
                    </div>

                    {/* Photo / Signature - display image */}
                    {(activeTab === 'photo' || activeTab === 'signature') && activeSection?.imageUrl && (
                      <div className="flex flex-col items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-4">{activeTab === 'photo' ? 'Applicant Photo' : 'Signature'}</p>
                        <img
                          src={activeSection?.imageUrl}
                          alt={activeTab === 'photo' ? 'Applicant photo' : 'Signature'}
                          className={`max-w-full rounded-xl border border-gray-200 ${activeTab === 'photo' ? 'max-h-64 object-contain' : 'max-h-24 object-contain'}`}
                        />
                      </div>
                    )}

                    {/* Dynamic Data Display - for non-image sections or when no image */}
                    {!['photo', 'signature'].includes(activeTab) && (
                      <div className="space-y-6">
                        {activeTab === 'credit_points' ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                <p className="text-[10px] text-primary font-black uppercase mb-2">Total Credits Claimed</p>
                                <p className="text-3xl font-black text-primary">{activeSection?.data?.totalCreditsClaimed || '0.0'}</p>
                              </div>
                              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Total Credits Allowed (Admin)</p>
                                <p className="text-3xl font-black text-gray-700">{activeSection?.data?.totalCreditsAllowed || '0.0'}</p>
                              </div>
                            </div>
                            
                            {activeSection?.data?.manualActivities?.length > 0 && (
                              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Manual Activities</h4>
                                </div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-50 bg-gray-50/30">
                                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Activity</th>
                                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Description</th>
                                      <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase">Points</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {activeSection.data.manualActivities.map((act, i) => (
                                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-secondary">Activity {act.activityId}</td>
                                        <td className="px-6 py-4 text-gray-600 text-xs">{act.description}</td>
                                        <td className="px-6 py-4 text-right font-black text-primary">{act.claimedPoints}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                            {Object.entries(activeSection?.data || {}).map(([key, val]) => (
                              <div key={key}>
                                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                <div className="text-secondary font-medium text-sm">
                                  {renderSectionValue(val)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photo/Signature with data but no imageUrl yet */}
                    {['photo', 'signature'].includes(activeTab) && !activeSection?.imageUrl && (
                      <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 text-center text-gray-500">
                        No {activeTab} uploaded
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Admin: Expert Assessments */}
            {isAdmin && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-secondary text-sm uppercase">Expert Assessments</h3>
                <p className="text-xs text-gray-500">Structured scorecards from assigned reviewers</p>
                {expertReviews.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">
                    No expert assessments yet. Select applications on the Applicants page and use &quot;Assign Reviewers&quot; to delegate evaluation.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {expertReviews.map((r) => (
                      <div key={r._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-2">
                          {[r.reviewerId?.profile?.firstName, r.reviewerId?.profile?.lastName].filter(Boolean).join(' ') || r.reviewerId?.email || 'Reviewer'}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-black text-primary">{r.scorecard?.totalScore ?? 0}</span>
                          <span className="text-xs text-gray-500">/ 100</span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.scorecard?.recommendation === 'RECOMMENDED' ? 'bg-green-100 text-green-700' :
                            r.scorecard?.recommendation === 'NOT_RECOMMENDED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {r.scorecard?.recommendation || '—'}
                          </span>
                        </div>
                        {r.scorecard?.comments && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-3">{r.scorecard.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section Verification */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-secondary text-sm">SECTION VERIFICATION</h3>
              <p className="text-xs text-gray-500">Verify <strong>{activeTab.toUpperCase()}</strong> section</p>

              <div className="flex items-center gap-4 py-2">
                <button
                  onClick={() => handleVerifySection(activeTab, true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${app.sections[activeTab]?.isVerified ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  APPROVE
                </button>
                <button
                  onClick={() => handleVerifySection(activeTab, false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${app.sections[activeTab]?.isVerified === false && app.sections[activeTab]?.verificationNotes ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  REJECT
                </button>
              </div>

              <textarea
                placeholder="Add verification notes for this section..."
                className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
              />
              <button
                onClick={() => handleVerifySection(activeTab, app.sections[activeTab]?.isVerified || false, verifyNotes)}
                disabled={!verifyNotes.trim()}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
              >
                Save Section Notes
              </button>
            </div>

            {/* Review Notes (Admin only) */}
            {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-secondary text-sm">REVIEW NOTES</h3>
              <textarea
                placeholder="Add overall review notes for this application..."
                className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
              <button
                onClick={handleAddReviewNotes}
                disabled={!reviewNotes.trim()}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
              >
                Save Review Notes
              </button>
              {app.reviewNotes && (
                <div className="bg-gray-50 rounded-xl p-3 mt-2">
                  <p className="text-xs text-gray-400 font-bold mb-1">EXISTING NOTES</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{app.reviewNotes}</p>
                </div>
              )}
            </div>
            )}

            {/* Status Update (Admin only) */}
            {isAdmin && (
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
              </div>
            </div>
            )}

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
