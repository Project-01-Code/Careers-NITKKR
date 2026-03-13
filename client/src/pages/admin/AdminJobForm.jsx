import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = {
  title: '',
  advertisementNo: '',
  department: '',
  designation: '',
  grade: '',
  payLevel: '',
  positions: 1,
  recruitmentType: 'external',
  categories: [],
  applicationFee: { general: 0, sc_st: 0, obc: 0, ews: 0, pwd: 0, isRequired: true },
  eligibilityCriteria: {
    minAge: 21,
    maxAge: 60,
    nationality: ['Indian'],
    minExperience: 0,
    requiredDegrees: [],
  },
  description: '',
  qualifications: [''],
  responsibilities: [''],
  applicationStartDate: '',
  applicationEndDate: '',
  requiredSections: [
    { sectionType: 'personal', isMandatory: true },
    { sectionType: 'education', isMandatory: true },
  ],
};

const designations = [
  'Assistant Professor Grade-I', 'Assistant Professor Grade-II',
];

const degreeLevels = ['PhD', 'Masters', 'Bachelors', 'Diploma'];

const payLevels = ['10', '11', '12', '13A2', '14A'];
const categoryOptions = ['GEN', 'SC', 'ST', 'OBC', 'EWS', 'PwD'];
const sectionTypes = [
  'personal', 'photo', 'signature', 'education', 'experience',
  'publications_journal', 'publications_conference', 'publications_books',
  'phd_supervision', 'patents', 'organized_programs',
  'sponsored_projects', 'consultancy_projects', 'subjects_taught',
  'credit_points', 'referees', 'other_info', 'final_documents', 'declaration',
];

const AdminJobForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [emailQuery, setEmailQuery] = useState('');

  // Fetch departments and reviewers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, revsRes] = await Promise.all([
          api.get('/departments'),
          api.get('/admin/reviews/reviewers'),
        ]);
        setDepartments(deptsRes.data.data || []);
        setReviewers(revsRes.data.data?.reviewers || []);
      } catch { /* ignore */ }
    };
    fetchData();
  }, []);

  // Fetch existing job if editing
  useEffect(() => {
    if (!isEditing) return;
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/jobs/${id}`);
        const job = res.data.data;
        setForm({
          ...emptyForm,
          ...job,
          department: typeof job.department === 'object' ? job.department._id : job.department,
          assignedReviewers: job.assignedReviewers?.map(r => typeof r === 'object' ? r._id : r) || [],
          applicationStartDate: job.applicationStartDate?.split('T')[0] || '',
          applicationEndDate: job.applicationEndDate?.split('T')[0] || '',
          qualifications: job.qualifications?.length ? job.qualifications : [''],
          responsibilities: job.responsibilities?.length ? job.responsibilities : [''],
          categories: job.categories || [],
          applicationFee: { ...emptyForm.applicationFee, ...(job.applicationFee || {}) },
          eligibilityCriteria: { ...emptyForm.eligibilityCriteria, ...(job.eligibilityCriteria || {}) },
          requiredSections: job.requiredSections?.length ? job.requiredSections : emptyForm.requiredSections,
        });
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        toast.error('Failed to load job');
        navigate('/admin/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeeChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      applicationFee: { ...prev.applicationFee, [name]: Number(value) },
    }));
  };

  const handleEligibilityChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      eligibilityCriteria: { ...prev.eligibilityCriteria, [name]: Number(value) || value },
    }));
  };

  const handleCategoryToggle = (cat) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleArrayField = (field, index, value) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleDegreeChange = (index, field, value) => {
    setForm((prev) => {
      const degrees = [...prev.eligibilityCriteria.requiredDegrees];
      degrees[index] = { ...degrees[index], [field]: value };
      return {
        ...prev,
        eligibilityCriteria: { ...prev.eligibilityCriteria, requiredDegrees: degrees },
      };
    });
  };

  const addDegree = () => {
    setForm((prev) => ({
      ...prev,
      eligibilityCriteria: {
        ...prev.eligibilityCriteria,
        requiredDegrees: [
          ...prev.eligibilityCriteria.requiredDegrees,
          { level: 'PhD', field: '', isMandatory: true },
        ],
      },
    }));
  };

  const removeDegree = (index) => {
    setForm((prev) => ({
      ...prev,
      eligibilityCriteria: {
        ...prev.eligibilityCriteria,
        requiredDegrees: prev.eligibilityCriteria.requiredDegrees.filter((_, i) => i !== index),
      },
    }));
  };

  const handleReviewerToggle = (reviewerId) => {
    setForm((prev) => ({
      ...prev,
      assignedReviewers: prev.assignedReviewers?.includes(reviewerId)
        ? prev.assignedReviewers.filter((id) => id !== reviewerId)
        : [...(prev.assignedReviewers || []), reviewerId],
    }));
  };

  const handleAddByEmail = (e) => {
    e.preventDefault();
    if (!emailQuery.trim()) return;

    const target = reviewers.find(r => r.email.toLowerCase() === emailQuery.toLowerCase());
    if (!target) {
      toast.error('No reviewer found with this email. Ensure the user exists and has the Reviewer role.');
      return;
    }

    if (form.assignedReviewers?.includes(target._id)) {
      toast.error('Reviewer is already assigned.');
    } else {
      handleReviewerToggle(target._id);
      toast.success(`Assigned ${target.email}`);
    }
    setEmailQuery('');
  };

  const handleSyncReviewers = async () => {
    if (!id) return;
    setSyncing(true);
    try {
      await api.post(`/admin/jobs/${id}/sync-reviewers`);
      toast.success('Successfully synced reviewers to all existing applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync reviewers');
    } finally {
      setSyncing(false);
    }
  };

  const handleSectionToggle = (sectionType) => {
    setForm((prev) => {
      const exists = prev.requiredSections.find((s) => s.sectionType === sectionType);
      if (exists) {
        return { ...prev, requiredSections: prev.requiredSections.filter((s) => s.sectionType !== sectionType) };
      }
      return { ...prev, requiredSections: [...prev.requiredSections, { sectionType, isMandatory: false }] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.advertisementNo || !form.department || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        positions: Number(form.positions),
        grade: form.grade || undefined,
        qualifications: form.qualifications.filter(Boolean),
        responsibilities: form.responsibilities.filter(Boolean),
        eligibilityCriteria: {
          ...form.eligibilityCriteria,
          requiredDegrees: form.eligibilityCriteria.requiredDegrees.filter((d) => d.field.trim()),
        },
        applicationStartDate: form.applicationStartDate ? new Date(form.applicationStartDate).toISOString() : undefined,
        applicationEndDate: form.applicationEndDate ? new Date(form.applicationEndDate).toISOString() : undefined,
      };
      // Remove fields that shouldn't be sent
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.deletedAt;
      delete payload.status;
      delete payload.publishDate;
      delete payload.closedAt;
      delete payload.id;
      delete payload.isActive;

      if (isEditing) {
        await api.patch(`/admin/jobs/${id}`, payload);
        toast.success('Job updated successfully');
      } else {
        await api.post('/admin/jobs', payload);
        toast.success('Job created successfully');
      }
      navigate('/admin/jobs');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save job';
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        toast.error(errors.map((e) => `${e.field}: ${e.message}`).join('\n'));
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/jobs" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary">{isEditing ? 'Edit Job' : 'Create New Job'}</h1>
            <p className="text-gray-500 text-sm">{isEditing ? 'Update the job posting details' : 'Fill in all required fields to create a new job posting'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Section title="Basic Information" icon="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label required>Job Title</Label>
                <input name="title" value={form.title} onChange={handleChange} className={inputClass} placeholder="e.g. Assistant Professor - Computer Science" required />
              </div>
              <div>
                <Label required>Advertisement No.</Label>
                <input name="advertisementNo" value={form.advertisementNo} onChange={handleChange} className={inputClass} placeholder="e.g. NITK/FAC/2026/01" required />
              </div>
              <div>
                <Label required>Department</Label>
                <select name="department" value={form.department} onChange={handleChange} className={inputClass} required>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <div>
                <Label>Designation</Label>
                <select name="designation" value={form.designation} onChange={handleChange} className={inputClass}>
                  <option value="">Select Designation</option>
                  {designations.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label>Pay Level</Label>
                <select name="payLevel" value={form.payLevel} onChange={handleChange} className={inputClass}>
                  <option value="">Select Pay Level</option>
                  {payLevels.map((p) => <option key={p} value={p}>Level {p}</option>)}
                </select>
              </div>
              <div>
                <Label>Positions</Label>
                <input type="number" name="positions" value={form.positions} onChange={handleChange} min="1" className={inputClass} />
              </div>
              <div>
                <Label>Recruitment Type</Label>
                <select name="recruitmentType" value={form.recruitmentType} onChange={handleChange} className={inputClass}>
                  <option value="external">External</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Categories */}
          <Section title="Categories" icon="category">
            <div className="flex flex-wrap gap-3">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryToggle(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    form.categories.includes(cat)
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Section>

          {/* Application Fee */}
          <Section title="Application Fee" icon="payments">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['general', 'obc', 'ews', 'sc_st', 'pwd'].map((key) => (
                <div key={key}>
                  <Label>{key.replace('_', '/').toUpperCase()}</Label>
                  <input type="number" name={key} value={form.applicationFee[key]} onChange={handleFeeChange} min="0" className={inputClass} />
                </div>
              ))}
            </div>
          </Section>

          {/* Eligibility */}
          <Section title="Eligibility Criteria" icon="checklist">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Min Age</Label>
                <input type="number" name="minAge" value={form.eligibilityCriteria.minAge} onChange={handleEligibilityChange} className={inputClass} />
              </div>
              <div>
                <Label>Max Age</Label>
                <input type="number" name="maxAge" value={form.eligibilityCriteria.maxAge} onChange={handleEligibilityChange} className={inputClass} />
              </div>
              <div>
                <Label>Min Experience (years)</Label>
                <input type="number" name="minExperience" value={form.eligibilityCriteria.minExperience} onChange={handleEligibilityChange} className={inputClass} />
              </div>
            </div>

            {/* Required Degrees */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <Label required>Required Degrees</Label>
                <button type="button" onClick={addDegree} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span> Add Degree
                </button>
              </div>
              <div className="space-y-3">
                {form.eligibilityCriteria.requiredDegrees.map((degree, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-xl relative group">
                    <div className="flex-1">
                      <Label>Degree Level</Label>
                      <select
                        value={degree.level}
                        onChange={(e) => handleDegreeChange(i, 'level', e.target.value)}
                        className={inputClass}
                      >
                        {degreeLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <Label>Field/Subject</Label>
                      <input
                        value={degree.field}
                        onChange={(e) => handleDegreeChange(i, 'field', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Computer Science & Engineering"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() => removeDegree(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                {form.eligibilityCriteria.requiredDegrees.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-500">No degrees specified. At least one is required.</p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Description */}
          <Section title="Description" icon="description">
            <div>
              <Label required>Job Description</Label>
              <textarea name="description" value={form.description} onChange={handleChange} className={`${inputClass} h-32`} placeholder="Detailed job description..." required />
            </div>

            {/* Qualifications */}
            <div className="mt-4">
              <Label>Qualifications</Label>
              {form.qualifications.map((q, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={q} onChange={(e) => handleArrayField('qualifications', i, e.target.value)} className={inputClass} placeholder="e.g. PhD in relevant discipline" />
                  {form.qualifications.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem('qualifications', i)} className="text-red-400 hover:text-red-600 px-2">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('qualifications')} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span> Add Qualification
              </button>
            </div>

            {/* Responsibilities */}
            <div className="mt-4">
              <Label>Responsibilities</Label>
              {form.responsibilities.map((r, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={r} onChange={(e) => handleArrayField('responsibilities', i, e.target.value)} className={inputClass} placeholder="e.g. Teaching undergraduate courses" />
                  {form.responsibilities.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem('responsibilities', i)} className="text-red-400 hover:text-red-600 px-2">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('responsibilities')} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span> Add Responsibility
              </button>
            </div>
          </Section>

          {/* Dates */}
          <Section title="Application Period" icon="date_range">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Start Date</Label>
                <input type="date" name="applicationStartDate" value={form.applicationStartDate} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <Label required>End Date</Label>
                <input type="date" name="applicationEndDate" value={form.applicationEndDate} onChange={handleChange} className={inputClass} required />
              </div>
            </div>
          </Section>

          {/* Required Sections */}
          <Section title="Application Form Sections" icon="list_alt">
            <p className="text-sm text-gray-500 mb-3">Select which sections applicants must fill out</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sectionTypes.map((st) => {
                const active = form.requiredSections.some((s) => s.sectionType === st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSectionToggle(st)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all border ${
                      active
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Reviewers */}
          <Section title="Assigned Reviewers" icon="rate_review">
            <p className="text-sm text-gray-500 mb-4">Assign expert reviewers by email or select from the list below.</p>

            {/* Email Assignment Input */}
            <div className="mb-6">
              <Label>Assign by Email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">mail</span>
                  <input
                    type="email"
                    value={emailQuery}
                    onChange={(e) => setEmailQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddByEmail(e)}
                    placeholder="Enter reviewer email address..."
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddByEmail}
                  className="px-6 py-2.5 bg-secondary text-white rounded-xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-secondary/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  ASSIGN
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {reviewers.map((rev) => {
                const active = form.assignedReviewers?.includes(rev._id);
                return (
                  <button
                    key={rev._id}
                    type="button"
                    onClick={() => handleReviewerToggle(rev._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600">
                      {rev.email[0].toUpperCase()}
                    </span>
                    {rev.profile?.firstName ? `${rev.profile.firstName} ${rev.profile.lastName || ''}` : rev.email}
                    {active && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                  </button>
                );
              })}
              {reviewers.length === 0 && (
                <p className="text-sm text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-xl">No reviewers found. Please create reviewer users first.</p>
              )}
            </div>

            {isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-secondary">Sync current applications?</h4>
                  <p className="text-xs text-gray-500">Apply these reviewers to all applications submitted so far for this job.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncReviewers}
                  disabled={syncing || form.assignedReviewers?.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 transition-all"
                >
                  {syncing ? (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                  )}
                  Sync Reviewers
                </button>
              </div>
            )}
          </Section>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <Link to="/admin/jobs" className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  {isEditing ? 'Update Job' : 'Create Job'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

// ------ Helpers ------

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all';

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
    <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      {title}
    </h3>
    {children}
  </div>
);

export default AdminJobForm;
