import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const deptName = typeof job.department === 'object' ? job.department?.name : job.department;

  const daysLeft = job.applicationEndDate
    ? Math.max(0, Math.ceil((new Date(job.applicationEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {job.designation && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                {job.designation}
              </span>
            )}
            {job.recruitmentType && (
              <span className="bg-secondary/10 text-secondary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                {job.recruitmentType}
              </span>
            )}
            {job.applicationEndDate && (
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Deadline: {formatDate(job.applicationEndDate)}
              </span>
            )}
            {daysLeft != null && daysLeft <= 10 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                daysLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {daysLeft === 0 ? 'Last day!' : `${daysLeft}d left`}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-secondary group-hover:text-primary transition-colors mb-1">
            {job.title}
          </h3>

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
            <span className="material-symbols-outlined text-[18px]">apartment</span>
            {deptName || 'Department'}
          </div>

          <div className="flex flex-wrap gap-2">
            {job.positions && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">group</span>
                {job.positions} position{job.positions > 1 ? 's' : ''}
              </span>
            )}
            {job.payLevel && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                Pay Level {job.payLevel}
              </span>
            )}
            {job.categories?.map((cat) => (
              <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <Link
            to={`/jobs/${job._id}`}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20 text-center whitespace-nowrap"
          >
            View Details
          </Link>
          <Link
            to={`/application/${job._id}`}
            className="text-secondary hover:text-primary text-sm font-medium transition-colors border border-gray-200 hover:border-primary px-6 py-2 rounded-lg text-center"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
