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
  shortlisted: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  selected: 'bg-green-100 text-green-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

const ApplicationReview = () => {
  const renderSectionValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-300">—</span>;
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-300">—</span>;
      return (
        <div className="grid grid-cols-1 gap-4 mt-4">
          {val.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                  {idx + 1}
                </div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Entry #{idx + 1}</h4>
              </div>
              {renderSectionValue(item)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof val === 'object') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {Object.entries(val).map(([k, v]) => {
            if (k === '_id' || k === 'id') return null;
            return (
              <div key={k} className="space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
                  {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                </span>
                <div className="text-secondary font-semibold text-sm">
                  {typeof v === 'object' ? renderSectionValue(v) : String(v)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return <span className="text-secondary font-medium whitespace-pre-wrap">{String(val)}</span>;
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

  // Find the current user's review (for reviewer lock logic)
  const myReview = isReviewerOnly
    ? expertReviews.find(r => {
        const reviewerId = typeof r.reviewer === 'object' ? (r.reviewer._id || r.reviewer.id) : r.reviewer;
        return reviewerId === user._id || reviewerId === user.id;
      }) || expertReviews[0]  // fallback to first if only one reviewer
    : null;
  const isReviewLocked = isReviewerOnly && myReview?.status === 'SUBMITTED';

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

  // Sync section notes when tab changes
  useEffect(() => {
    const sectionData = app?.sections?.get ? app.sections.get(activeTab) : app?.sections?.[activeTab];
    setVerifyNotes(sectionData?.verificationNotes || '');
  }, [activeTab, app]);

  const handleVerifySection = async (sectionType, isVerified, notes) => {
    if (isReviewLocked) {
      toast.error('Cannot modify verification after review submission');
      return;
    }
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
    const finalRemarks = statusRemarks || reviewNotes || app.reviewNotes;
    if (!finalRemarks) {
      toast.error('Please provide remarks/notes in Final Decision Notes for status change');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/admin/applications/${id}/status`, {
        status, remarks: finalRemarks
      });
      toast.success(`Status updated to ${status}`);
      setStatusRemarks('');
      setReviewNotes('');
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
                    {[app.userId?.profile?.firstName, app.userId?.profile?.lastName].filter(n => n && n !== 'N/A').join(' ') || 'Applicant Profile'}
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

            <div className="flex flex-col items-end gap-3 w-full md:w-[450px]">
              {/* Final Verdict Action (Admin Only) */}
              {isAdmin && (
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center gap-4 w-[97px]">
                    <div className="text-right flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest px-1">Status</p>
                      <p className="text-secondary font-bold text-[11px] leading-tight">{app.status.toUpperCase()}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-100" />
                  </div>
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => handleUpdateStatus('shortlisted')}
                      disabled={submitting || app.status === 'shortlisted'}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">star</span>
                      SHORTLIST
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={submitting || app.status === 'rejected'}
                      className="px-4 py-3 flex-1 bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      REJECT
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 w-full">
                {/* Spacer to match status + separator width (97px) */}
                {isAdmin && <div className="w-[97px]" />}
                <a
                  href={`${api.defaults.baseURL}/admin/applications/${id}/export-full`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-secondary/20 group"
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
              initialData={myReview}
              onSubmit={handleSubmitScorecard}
              readOnly={isReviewLocked}
            />
          </div>
        )}

        {/* Admin: Expert Feedback Summary - Prominent for decision makers */}
        {isAdmin && expertReviews.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <div>
                  <h3 className="font-black text-secondary text-sm uppercase tracking-widest">Expert Evaluation Summary</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Aggregated recommendations from assigned reviewers</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">SUBMITTED</p>
                  <p className="text-xl font-black text-secondary leading-none">
                    {expertReviews.filter(r => r.status === 'SUBMITTED').length} / {expertReviews.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {expertReviews.map((r) => (
                <div key={r._id} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 hover:bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    r.status === 'SUBMITTED' ? (
                      r.scorecard?.recommendation === 'RECOMMENDED' ? 'bg-green-500' :
                      r.scorecard?.recommendation === 'NOT_RECOMMENDED' ? 'bg-red-500' :
                      'bg-amber-500'
                    ) : 'bg-gray-200'
                  }`} />

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-secondary text-xs uppercase truncate max-w-[150px]">
                        {[r.reviewer?.profile?.firstName, r.reviewer?.profile?.lastName].filter(n => n && n !== 'N/A').join(' ') || r.reviewer?.email?.split('@')[0] || 'Expert Reviewer'}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{r.reviewer?.profile?.designation || 'Reviewer'}</p>
                    </div>
                    {r.status === 'SUBMITTED' ? (
                      <div className="bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-sm font-black text-primary leading-none">{r.scorecard?.totalScore ?? 0}</p>
                        <p className="text-[8px] font-black text-gray-300 uppercase mt-0.5">SCORE</p>
                      </div>
                    ) : (
                      <div className="bg-white px-2 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[9px] font-black text-gray-400 uppercase">PENDING</p>
                      </div>
                    )}
                  </div>

                  {r.status === 'SUBMITTED' ? (
                    <div className="space-y-4">
                      <div className={`text-[10px] font-black uppercase tracking-widest text-center py-2 rounded-xl border ${
                        r.scorecard?.recommendation === 'RECOMMENDED' ? 'bg-green-50 text-green-700 border-green-100' :
                        r.scorecard?.recommendation === 'NOT_RECOMMENDED' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {r.scorecard?.recommendation}
                      </div>
                      {r.scorecard?.comments && (
                        <div className="relative">
                          <span className="material-symbols-outlined text-[10px] absolute -top-1 -left-1 text-gray-300">format_quote</span>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic pl-3 line-clamp-3">&ldquo;{r.scorecard.comments}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center gap-3 opacity-40">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 animate-spin" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assessment in Progress</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
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

                    {/* Dynamic Data Display */}
                    {!['photo', 'signature'].includes(activeTab) && (
                      <div className="space-y-6">
                        {activeTab === 'credit_points' ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Claimed Credits</p>
                                <div className="flex items-baseline gap-1">
                                  <p className="text-3xl font-black text-primary">{Number(activeSection?.data?.totalCreditsClaimed || 0).toFixed(1)}</p>
                                  <span className="text-[10px] font-bold text-primary/60 uppercase">pts</span>
                                </div>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Allowed Credits</p>
                                <div className="flex items-baseline gap-1">
                                  <p className="text-3xl font-black text-secondary group-hover:text-primary transition-colors">{Number(activeSection?.data?.totalCreditsAllowed || 0).toFixed(1)}</p>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">pts</span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                                  <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                     <div 
                                      className="h-full bg-primary transition-all duration-500" 
                                      style={{ width: `${Math.min(100, (Number(activeSection?.data?.totalCreditsAllowed || 0) / (Number(activeSection?.data?.totalCreditsClaimed) || 1)) * 100)}%` }} 
                                     />
                                  </div>
                                  <span className="text-[9px] font-black text-gray-400">
                                    {Math.round((Number(activeSection?.data?.totalCreditsAllowed || 0) / (Number(activeSection?.data?.totalCreditsClaimed) || 1)) * 100)}% Verified
                                  </span>
                                </div>
                              </div>
                            </div>

                            {activeSection?.data?.manualActivities?.length > 0 && (
                              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Manual Activities</h4>
                                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                    {activeSection.data.manualActivities.length} Items
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-50 bg-gray-50/30">
                                        <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                                        <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {activeSection.data.manualActivities.map((act, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                          <td className="px-6 py-3 font-black text-secondary">#{act.activityId}</td>
                                          <td className="px-6 py-3 text-gray-500 font-medium line-clamp-2">{act.description}</td>
                                          <td className="px-6 py-3 text-right font-black text-primary">{act.claimedPoints}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b border-gray-50 pb-4">
                              <span className="material-symbols-outlined text-primary text-xl">data_object</span>
                              <h4 className="text-xs font-black text-secondary uppercase tracking-widest">{activeTab.replace(/_/g, ' ')} Information</h4>
                            </div>
                            {renderSectionValue(activeSection?.data)}
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
            {/* Section Verification (Highest priority for evaluation) */}
            <div className={`bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 ${isReviewLocked ? 'opacity-70 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-secondary text-xs uppercase tracking-widest">Section Verification</h3>
                {isReviewLocked && (
                  <span className="material-symbols-outlined text-amber-500 text-sm" title="Locked">lock</span>
                )}
                {!isReviewerOnly && <span className="material-symbols-outlined text-primary/40">verified</span>}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Verify <strong>{activeTab.replace(/_/g, ' ')}</strong> section</p>

              <div className="flex items-center gap-2 py-1">
                <button
                  onClick={() => handleVerifySection(activeTab, true, verifyNotes)}
                  disabled={isReviewLocked}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${app.sections[activeTab]?.isVerified ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  APPROVE
                </button>
                <button
                  onClick={() => handleVerifySection(activeTab, false, verifyNotes)}
                  disabled={isReviewLocked}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${app.sections[activeTab]?.isVerified === false && app.sections[activeTab]?.verificationNotes ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  REJECT
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-1">Verification Notes</p>
                <textarea
                  placeholder="Notes for this section..."
                  className="w-full h-20 p-3 rounded-2xl border border-gray-100 bg-gray-50/30 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  readOnly={isReviewLocked}
                />
              </div>
              <button
                onClick={() => handleVerifySection(activeTab, app.sections[activeTab]?.isVerified || false, verifyNotes)}
                disabled={!verifyNotes.trim() || isReviewLocked}
                className="w-full py-2.5 bg-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-md hover:bg-black"
              >
                Save Notes
              </button>
            </div>

            {/* Admin: Expert Assessments / Review Progress (Removed for admins as it is now in main area) */}

            {/* Review Notes (Admin only) */}
            {isAdmin && (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <h3 className="font-black text-secondary text-xs uppercase tracking-widest">Final Decision Notes</h3>
                <textarea
                  placeholder="Record final decision remarks here. These notes will be used for status changes..."
                  className="w-full h-32 p-4 rounded-2xl border border-gray-100 bg-gray-50/30 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                <button
                  onClick={handleAddReviewNotes}
                  disabled={!reviewNotes.trim()}
                  className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-md hover:bg-primary-dark"
                >
                  Save Decision Notes
                </button>
                {app.reviewNotes && (
                  <div className="bg-gray-50/50 rounded-xl p-4 mt-2 border border-gray-100">
                    <p className="text-[8px] text-gray-400 font-black mb-1 text-center uppercase tracking-widest">Decision History</p>
                    <p className="text-[11px] text-gray-600 leading-relaxed italic text-center">&ldquo;{app.reviewNotes}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {/* Application Journey - Timeline */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="font-black text-secondary text-xs uppercase tracking-widest">Application Journey</h3>
                <span className="material-symbols-outlined text-gray-300 text-lg">route</span>
              </div>
              
              <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-gradient-to-b before:from-primary/30 before:to-gray-100">
                {app.statusHistory?.slice(0, 5).map((h, i) => (
                  <div key={i} className="relative pl-8 pb-8 last:pb-0 group">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-[3px] border-gray-50 flex items-center justify-center z-10 shadow-sm transition-all duration-300 group-hover:border-primary/20">
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-primary ring-4 ring-primary/10' : 'bg-gray-300'}`} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${
                          i === 0 ? 'text-primary' : 'text-gray-400'
                        }`}>
                          {h.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[8px] font-bold text-gray-300">
                          {new Date(h.changedAt).toLocaleDateString()} • {new Date(h.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className={`text-[11px] font-medium leading-tight ${i === 0 ? 'text-secondary' : 'text-gray-500'}`}>
                        {h.remarks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status updates moved to header */}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ApplicationReview;