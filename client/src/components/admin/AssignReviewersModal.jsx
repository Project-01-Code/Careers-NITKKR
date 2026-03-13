import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AssignReviewersModal = ({ isOpen, onClose, applicationIds, onSuccess }) => {
  const [reviewers, setReviewers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailQuery, setEmailQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      const fetchReviewers = async () => {
        setLoading(true);
        try {
          const res = await api.get('/admin/reviews/reviewers');
          setReviewers(res.data.data.reviewers || []);
        } catch {
          toast.error('Failed to load reviewers');
          setReviewers([]);
        } finally {
          setLoading(false);
        }
      };
      fetchReviewers();
    }
  }, [isOpen]);

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === reviewers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviewers.map((r) => r._id));
    }
  };

  const handleAddByEmail = () => {
    if (!emailQuery.trim()) return;
    const target = reviewers.find(r => r.email.toLowerCase() === emailQuery.toLowerCase());
    if (!target) {
      toast.error('No reviewer found with this email.');
      return;
    }
    if (selectedIds.includes(target._id)) {
      toast.error('Reviewer is already selected.');
    } else {
      setSelectedIds(prev => [...prev, target._id]);
      toast.success(`Selected ${target.email}`);
    }
    setEmailQuery('');
  };

  const handleSubmit = async () => {
    if (!selectedIds.length) {
      toast.error('Select at least one reviewer');
      return;
    }
    if (!applicationIds?.length) {
      toast.error('No applications selected');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch('/admin/applications/bulk-assign', {
        applicationIds,
        reviewerIds: selectedIds,
      });
      toast.success(`Assigned ${selectedIds.length} reviewer(s) to ${applicationIds.length} application(s)`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign reviewers');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-secondary">Assign Expert Reviewers</h2>
          <p className="text-sm text-gray-500 mt-1">
            {applicationIds?.length || 0} application(s) selected
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviewers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No reviewers found. Create reviewer accounts in User Management first.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="mb-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Search by Email</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">search</span>
                    <input
                      type="email"
                      value={emailQuery}
                      onChange={(e) => setEmailQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddByEmail()}
                      placeholder="Enter reviewer email..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddByEmail}
                    className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                  >
                    ADD
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-50">
                <input
                  type="checkbox"
                  checked={selectedIds.length === reviewers.length && reviewers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary"
                />
                <span className="text-sm font-medium">Select All</span>
              </label>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {reviewers.map((r) => (
                  <label
                    key={r._id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r._id)}
                      onChange={() => handleToggle(r._id)}
                      className="rounded border-gray-300 text-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        {r.profile?.firstName || r.profile?.lastName
                          ? `${r.profile.firstName || ''} ${r.profile.lastName || ''}`.trim()
                          : r.email}
                      </p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedIds.length || loading}
            className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              `Assign ${selectedIds.length} Reviewer(s)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignReviewersModal;
