import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-secondary mt-1">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats and jobs list in parallel
        const [statsRes, jobsRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/jobs', { params: { limit: 100 } })
        ]);

        const dashboardData = statsRes.data.data;
        const jobsList = jobsRes.data.data.jobs || [];

        // Compute department distribution client-side
        const deptMap = {};
        jobsList.forEach(job => {
          const deptName = job.department?.name || 'Unassigned';
          deptMap[deptName] = (deptMap[deptName] || 0) + 1;
        });

        const computedDeptStats = Object.entries(deptMap).map(([name, count]) => ({
          name,
          count
        })).sort((a, b) => b.count - a.count);

        setStats(dashboardData);
        setDeptStats(computedDeptStats);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Applications"
            value={stats?.applications?.total || 0}
            icon="description"
            color="bg-blue-500"
            delay={0.1}
          />
          <StatCard
            title="Active Jobs"
            value={stats?.jobs?.byStatus?.published || 0}
            icon="work"
            color="bg-green-500"
            delay={0.2}
          />
          <StatCard
            title="Total Applicants"
            value={stats?.users?.totalApplicants || 0}
            icon="groups"
            color="bg-purple-500"
            delay={0.3}
          />
          <StatCard
            title="Avg. Apps per Job"
            value={stats?.jobs?.total > 0 ? (stats.applications.total / stats.jobs.total).toFixed(1) : 0}
            icon="analytics"
            color="bg-orange-500"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-secondary">Recent Applications</h3>
              <button className="text-primary text-sm font-medium hover:underline">View All</button>
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
                  {stats?.recentApplications?.map((app, idx) => (
                    <tr key={app._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-secondary">{app.applicationNumber}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-secondary">{app.userId?.profile?.fullName || 'N/A'}</span>
                          <span className="text-xs text-gray-400">{app.userId?.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 truncate max-w-[200px]">{app.jobId?.title}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          app.status === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentApplications || stats.recentApplications.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">No recent applications found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-secondary mb-6">Jobs by Department</h3>
            <div className="space-y-4">
              {deptStats.map((dept, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{dept.name}</span>
                    <span className="text-secondary font-bold">{dept.count}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(dept.count / (stats?.jobs?.total || 1)) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              ))}
              {(!deptStats || deptStats.length === 0) && (
                <div className="text-center py-8 text-gray-400">No department data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
