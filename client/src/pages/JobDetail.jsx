import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const daysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !job) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Job Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'This job posting may have been removed or is no longer available.'}</p>
          <Link to="/jobs" className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Back to Jobs
          </Link>
        </div>
      </MainLayout>
    );
  }

  const remaining = daysLeft(job.applicationEndDate);

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-secondary text-white py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <Link to="/jobs" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Jobs
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mt-3">
            {job.department && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">apartment</span>
                {typeof job.department === 'object' ? job.department.name : job.department}
              </span>
            )}
            {job.designation && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">badge</span>
                {job.designation}
              </span>
            )}
            {job.advertisementNo && (
              <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">
                {job.advertisementNo}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Eligibility */}
            {job.eligibilityCriteria && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">checklist</span>
                  Eligibility Criteria
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.eligibilityCriteria.minAge && (
                    <InfoItem label="Minimum Age" value={`${job.eligibilityCriteria.minAge} years`} />
                  )}
                  {job.eligibilityCriteria.maxAge && (
                    <InfoItem label="Maximum Age" value={`${job.eligibilityCriteria.maxAge} years`} />
                  )}
                  {job.eligibilityCriteria.minExperience != null && (
                    <InfoItem label="Min Experience" value={`${job.eligibilityCriteria.minExperience} years`} />
                  )}
                  {job.eligibilityCriteria.nationality?.length > 0 && (
                    <InfoItem label="Nationality" value={job.eligibilityCriteria.nationality.join(', ')} />
                  )}
                </div>

                {/* Required Degrees */}
                {job.eligibilityCriteria.requiredDegrees?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Required Degrees</h4>
                    <div className="space-y-2">
                      {job.eligibilityCriteria.requiredDegrees.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`w-2 h-2 rounded-full ${d.isMandatory ? 'bg-primary' : 'bg-gray-300'}`} />
                          <span className="font-medium text-gray-800">{d.level}</span>
                          <span className="text-gray-500">in {d.field}</span>
                          {d.isMandatory && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Mandatory</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Age Relaxation */}
                {job.eligibilityCriteria.ageRelaxation && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Age Relaxation</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(job.eligibilityCriteria.ageRelaxation).map(([cat, yrs]) => (
                        yrs > 0 && (
                          <div key={cat} className="bg-gray-50 rounded-lg p-2 text-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">{cat}</span>
                            <p className="text-sm font-bold text-secondary">{yrs} yrs</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Qualifications */}
            {job.qualifications?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">school</span>
                  Qualifications
                </h2>
                <ul className="space-y-2">
                  {job.qualifications.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                      <span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">task_alt</span>
                  Responsibilities
                </h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                      <span className="material-symbols-outlined text-gray-400 text-base mt-0.5">arrow_right</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documents */}
            {job.documents?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">folder_open</span>
                  Documents
                </h2>
                <div className="space-y-3">
                  {job.documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      <span className="material-symbols-outlined text-primary text-2xl">picture_as_pdf</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors">{doc.label || doc.type}</p>
                        {doc.category && <p className="text-xs text-gray-400">{doc.category}</p>}
                      </div>
                      <span className="material-symbols-outlined text-gray-400 ml-auto text-lg">download</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Apply Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
              {/* Deadline Badge */}
              {remaining != null && (
                <div className={`text-center mb-5 py-3 rounded-xl ${
                  remaining <= 7 ? 'bg-red-50 text-red-700' : 'bg-primary/5 text-primary'
                }`}>
                  <p className="text-2xl font-bold">{remaining}</p>
                  <p className="text-xs font-medium uppercase tracking-wider">days left to apply</p>
                </div>
              )}

              {/* Key Details */}
              <div className="space-y-4 mb-6">
                <InfoItem label="Positions" value={job.positions} />
                {job.payLevel && <InfoItem label="Pay Level" value={`Level ${job.payLevel}`} />}
                {job.grade && <InfoItem label="Grade" value={job.grade} />}
                {job.recruitmentType && <InfoItem label="Type" value={job.recruitmentType} />}
                <InfoItem label="Start Date" value={formatDate(job.applicationStartDate)} />
                <InfoItem label="End Date" value={formatDate(job.applicationEndDate)} />
                {job.publishDate && <InfoItem label="Published" value={formatDate(job.publishDate)} />}
              </div>

              {/* Categories */}
              {job.categories?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {job.categories.map((c) => (
                      <span key={c} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Fee */}
              {job.applicationFee?.isRequired && (
                <div className="mb-6 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-3">Application Fee</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {job.applicationFee.general > 0 && <FeeItem label="General" amount={job.applicationFee.general} />}
                    {job.applicationFee.obc > 0 && <FeeItem label="OBC" amount={job.applicationFee.obc} />}
                    {job.applicationFee.ews > 0 && <FeeItem label="EWS" amount={job.applicationFee.ews} />}
                    <FeeItem label="SC/ST" amount={job.applicationFee.sc_st || 0} />
                    <FeeItem label="PwD" amount={job.applicationFee.pwd || 0} />
                  </div>
                </div>
              )}

              <Link
                to={`/application/${job._id}`}
                className="block w-full text-center bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                Apply Now
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-secondary">{value}</span>
  </div>
);

const FeeItem = ({ label, amount }) => (
  <div className="bg-gray-50 rounded-lg p-2 text-center">
    <span className="text-xs text-gray-500">{label}</span>
    <p className="font-bold text-secondary">{amount === 0 ? 'Free' : `₹${amount}`}</p>
  </div>
);

export default JobDetail;
