import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
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
  const [promoForm, setPromoForm] = useState({
    email: '',
    role: 'reviewer'
  });

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'reviewer',
    phone: '',
    dateOfBirth: '',
    nationality: 'Indian'
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Split fullName into firstName/lastName
      const nameParts = form.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const res = await api.post('/admin/users', {
        email: form.email,
        password: form.password,
        role: form.role,
        firstName,
        lastName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
        nationality: form.nationality || 'Indian',
      });
      toast.success(`${form.role.toUpperCase()} created successfully`);

      // Add to local session list since there's no backend list endpoint
      setCreatedRecently([res.data.data, ...createdRecently]);

      setForm({ email: '', fullName: '', password: '', role: 'reviewer', phone: '', dateOfBirth: '', nationality: 'Indian' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!promoForm.email) return;
    setPromoting(true);
    try {
      await api.patch('/admin/users/promote-by-email', {
        email: promoForm.email,
        targetRole: promoForm.role
      });
      toast.success(`User promoted to ${promoForm.role.toUpperCase()} successfully`);
      setPromoForm({ email: '', role: 'reviewer' });
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
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    value={form.dateOfBirth}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Nationality</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    placeholder="Indian"
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Assigned Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'reviewer' })}
                    className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border ${form.role === 'reviewer' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 uppercase'
                      }`}
                  >
                    REVIEWER
                  </button>
                  {currentUser?.role === 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: 'admin' })}
                      className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border ${form.role === 'admin' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 uppercase'
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
            {/* Promote Section – visible only for super_admin and admin */}
            {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined">upgrade</span>
                  </div>
                  <h2 className="text-lg font-bold text-secondary">Promote User</h2>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed">
                  Elevate an existing account to **Admin** or **Reviewer** status using their email.
                </p>

                <form onSubmit={handlePromote} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      placeholder="user@example.com"
                      value={promoForm.email}
                      onChange={(e) => setPromoForm({ ...promoForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Target Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPromoForm({ ...promoForm, role: 'reviewer' })}
                        className={`py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border ${promoForm.role === 'reviewer' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400'
                          }`}
                      >
                        REVIEWER
                      </button>
                      {currentUser?.role === 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => setPromoForm({ ...promoForm, role: 'admin' })}
                          className={`py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border ${promoForm.role === 'admin' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400'
                            }`}
                        >
                          ADMIN
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={promoting || !promoForm.email}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {promoting ? 'PROMOTING...' : 'PROMOTE USER'}
                  </button>
                </form>
              </div>
            )}

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
                          <p className="text-xs font-bold text-secondary">
                            {[u.profile?.firstName, u.profile?.lastName].filter(n => n && n !== 'N/A').join(' ') || u.profile?.fullName || 'Internal User'}
                          </p>
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


          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserManagement;
