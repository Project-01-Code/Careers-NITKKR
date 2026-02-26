import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    heading: '',
    advtNo: '',
    category: '',
    externalLink: '',
  });
  const [file, setFile] = useState(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notices', { params: { limit: 50 } });
      const data = res.data.data;
      setNotices(data.notices || data || []);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const resetForm = () => {
    setForm({ heading: '', advtNo: '', category: '', externalLink: '' });
    setFile(null);
    setEditingId(null);
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleEdit = (notice) => {
    setForm({
      heading: notice.heading || '',
      advtNo: notice.advtNo || '',
      category: notice.category || '',
      externalLink: notice.externalLink || '',
    });
    setFile(null);
    setEditingId(notice._id);
    setShowForm(true);
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this notice?')) return;
    try {
      await api.patch(`/notices/${id}/archive`);
      toast.success('Notice archived');
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.heading) {
      toast.error('Heading is required');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('heading', form.heading);
      if (form.advtNo) formData.append('advtNo', form.advtNo);
      if (form.category) formData.append('category', form.category);
      if (form.externalLink) formData.append('externalLink', form.externalLink);
      if (file) formData.append('file', file);

      if (editingId) {
        await api.patch(`/notices/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Notice updated');
      } else {
        await api.post('/notices', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Notice created');
      }
      resetForm();
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notice');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Notice Management</h1>
            <p className="text-gray-500 text-sm">Create and manage recruitment notices</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'Create Notice'}
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <h3 className="text-lg font-bold text-secondary mb-4">
              {editingId ? 'Edit Notice' : 'New Notice'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heading <span className="text-red-500">*</span></label>
                  <input
                    value={form.heading}
                    onChange={(e) => setForm((p) => ({ ...p, heading: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                    placeholder="Notice heading"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advert No.</label>
                  <input
                    value={form.advtNo}
                    onChange={(e) => setForm((p) => ({ ...p, advtNo: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    placeholder="e.g. NITK/NOT/2026/01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    <option value="Faculty Recruitment">Faculty Recruitment</option>
                    <option value="Non-Teaching">Non-Teaching</option>
                    <option value="Research">Research</option>
                    <option value="Exam">Exam</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">External Link</label>
                  <input
                    value={form.externalLink}
                    onChange={(e) => setForm((p) => ({ ...p, externalLink: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-white px-6 py-2 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Notices List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">campaign_off</span>
            <h3 className="text-lg font-bold text-gray-600">No notices yet</h3>
            <p className="text-gray-400 text-sm mt-1">Create your first notice to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Heading</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((notice, idx) => (
                    <motion.tr
                      key={notice._id || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-secondary line-clamp-1">{notice.heading}</p>
                          {notice.advtNo && <p className="text-xs text-gray-400 font-mono">{notice.advtNo}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {notice.category && (
                          <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                            {notice.category}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-gray-500">
                        {formatDate(notice.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          notice.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {notice.isActive !== false ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {notice.pdfUrl && (
                            <a href={notice.pdfUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary" title="View PDF">
                              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                            </a>
                          )}
                          <button onClick={() => handleEdit(notice)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary" title="Edit">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          {notice.isActive !== false && (
                            <button onClick={() => handleArchive(notice._id)}
                              className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors text-gray-500 hover:text-orange-600" title="Archive">
                              <span className="material-symbols-outlined text-lg">archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotices;
