import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-3xl font-bold text-secondary mt-1">{value}</h3>
      </div>
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}
      >
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const greeting = 'Welcome back';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get('/admin/dashboard/stats');
        setStats(statsRes.data.data);

        if (statsRes.data.data.jobsByDepartment) {
          setDeptStats(statsRes.data.data.jobsByDepartment);
        } else if (isAdmin) {
          // Fallback if backend doesn't provide it yet
          const jobsRes = await api.get('/admin/jobs', { params: { limit: 100 } });
          const jobsList = jobsRes.data.data.jobs || [];
          const deptMap = {};
          jobsList.forEach((job) => {
            const deptName = job.department?.name || 'Unassigned';
            deptMap[deptName] = (deptMap[deptName] || 0) + 1;
          });
          setDeptStats(Object.entries(deptMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [isAdmin]);

  const cardStyles = [
    { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', shadow: 'shadow-blue-200' },
    { bg: 'bg-gradient-to-br from-emerald-400 to-teal-600', shadow: 'shadow-emerald-200' },
    { bg: 'bg-gradient-to-br from-purple-500 to-pink-600', shadow: 'shadow-purple-200' },
    { bg: 'bg-gradient-to-br from-amber-400 to-orange-600', shadow: 'shadow-amber-200' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-400 animate-pulse">Syncing Portal Data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-secondary rounded-3xl p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tight">{greeting}, {user?.profile?.firstName || 'Admin'}! 👋</h2>
            <p className="text-white/60 mt-1 font-medium">Here's what's happening in the NIT KKR Careers Portal today.</p>

            <div className="flex flex-wrap gap-3 mt-6">
              {isAdmin && (
                <Link to="/admin/jobs/new" className="px-4 py-2 bg-white text-secondary rounded-xl text-sm font-bold shadow-lg hover:shadow-white/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span> New Job
                </Link>
              )}
              
            </div>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 shrink-0" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -mb-10 mr-20 shrink-0" />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={isAdmin ? 'Total Applications' : 'My Assigned'}
            value={stats?.applications?.total || 0}
            icon="description"
            color={cardStyles[0].bg}
            shadow={cardStyles[0].shadow}
            delay={0.1}
          />
          {isAdmin && (
            <StatCard
              title="Active Jobs"
              value={stats?.jobs?.byStatus?.published || 0}
              icon="work"
              color={cardStyles[1].bg}
              shadow={cardStyles[1].shadow}
              delay={0.2}
            />
          )}
          {isAdmin && (
            <StatCard
              title="Total Applicants"
              value={stats?.users?.totalApplicants || 0}
              icon="person_search"
              color={cardStyles[2].bg}
              shadow={cardStyles[2].shadow}
              delay={0.3}
            />
          )}
          <StatCard
            title="Total Submitted"
            value={stats?.applications?.totalSubmitted || 0}
            icon="bolt"
            color={cardStyles[3].bg}
            shadow={cardStyles[3].shadow}
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications Feed */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                {isAdmin ? 'Recent Activity' : 'Incoming Queue'}
              </h3>
              <Link
                to={isAdmin ? '/admin/applicants' : '/admin/queue'}
                className="text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-all"
              >
                Full List
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold">
                    <th className="text-left p-4">Application ID</th>
                    <th className="text-left p-4">Applicant</th>
                    <th className="text-left p-4">Job</th>
                    <th className="text-left p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats?.recentApplications?.map((app) => (
                    <tr
                      key={app._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 font-medium text-secondary">
                        <Link
                          to={`/admin/applicants/${app._id}/review`}
                          className="text-primary hover:underline"
                        >
                          {app.applicationNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-secondary">{[app.userId?.profile?.firstName, app.userId?.profile?.lastName].filter(n => n && n !== 'N/A').join(' ') || 'Applicant'}</span>
                          <span className="text-xs text-gray-400">
                            {app.userId?.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 truncate max-w-[200px]">
                        {app.jobId?.title}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${app.status === 'submitted'
                              ? 'bg-blue-100 text-blue-700'
                              : app.status === 'reviewed'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentApplications ||
                    stats.recentApplications.length === 0) && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-400">
                          No recent applications found
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-secondary mb-6">
              Jobs by Department
            </h3>
            <div className="space-y-4">
              {deptStats.map((dept, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">
                      {dept.name}
                    </span>
                    <span className="text-secondary font-bold">
                      {dept.count}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(dept.count / (stats?.jobs?.total || 1)) * 100}%`,
                      }}
                      transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              ))}
              {(!deptStats || deptStats.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  No department data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;