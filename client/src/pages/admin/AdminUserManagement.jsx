import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AdminUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [createdRecently, setCreatedRecently] = useState([]);
  const [promoUserId, setPromoUserId] = useState('');
  
  const [form, setForm] = useState({ 
    email: '', 
    fullName: '', 
    password: '', 
    role: 'reviewer' 
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/admin/users', form);
      toast.success(`${form.role.toUpperCase()} created successfully`);
      
      // Add to local session list since there's no backend list endpoint
      setCreatedRecently([res.data.data, ...createdRecently]);
      
      setForm({ email: '', fullName: '', password: '', role: 'reviewer' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!promoUserId) return;
    setPromoting(true);
    try {
      await api.patch(`/admin/users/${promoUserId}/promote`);
      toast.success('User promoted to Admin successfully');
      setPromoUserId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Access Management</h1>
          <p className="text-gray-500 text-sm">Create internal accounts and manage administrative permissions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create User Form */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <h2 className="text-lg font-bold text-secondary">Create Internal account</h2>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="e.g. John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="email@nitkkr.ac.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Assigned Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'reviewer' })}
                    className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border ${
                      form.role === 'reviewer' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 uppercase'
                    }`}
                  >
                    REVIEWER
                  </button>
                  {currentUser?.role === 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: 'admin' })}
                      className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border ${
                        form.role === 'admin' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 uppercase'
                      }`}
                    >
                      ADMIN
                    </button>
                  )}
                </div>
              </div>

              <button
                disabled={submitting}
                className="w-full bg-secondary text-white py-4 rounded-2xl font-bold text-sm mt-2 hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                GENERATE ACCESS
              </button>
            </form>
          </div>

          <div className="space-y-8">
            {/* Promote Section */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined">upgrade</span>
                </div>
                <h2 className="text-lg font-bold text-secondary">Promote to Admin</h2>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                Elevate a **Reviewer** to **Administrator** status. Enter their unique User ID below.
              </p>

              <form onSubmit={handlePromote} className="space-y-4">
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
                  placeholder="Enter Mongo User ID..."
                  value={promoUserId}
                  onChange={(e) => setPromoUserId(e.target.value)}
                />
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-lg">info</span>
                    <p className="text-[10px] text-blue-700 italic leading-snug">
                        User IDs can be found in the **Applicants** tab by clicking on any specific application.
                    </p>
                </div>
                <button
                  disabled={promoting || !promoUserId || currentUser?.role !== 'super_admin'}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {promoting ? 'PROMOTING...' : 'PROMOTE USER'}
                </button>
              </form>
            </div>

            {/* Session History */}
            {createdRecently.length > 0 && (
                <div className="bg-gray-50/50 rounded-3xl p-6 border border-dashed border-gray-200 space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        CREATED THIS SESSION
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                            {createdRecently.length}
                        </span>
                    </h3>
                    <div className="space-y-2">
                        {createdRecently.map(u => (
                            <div key={u._id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">
                                        {u.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-secondary">{u.profile?.fullName || 'Internal User'}</p>
                                        <p className="text-[10px] text-gray-400">{u.email}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[8px] font-black uppercase">
                                    {u.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl">
                <h4 className="text-xs font-bold text-orange-800 flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    User List Unavailable
                </h4>
                <p className="text-[11px] text-orange-700 leading-normal">
                    The backend currently lacks a <code className="bg-orange-100 px-1 rounded">GET /admin/users</code> endpoint. 
                    Full user listing and deletion will depend on future backend updates.
                </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserManagement;
