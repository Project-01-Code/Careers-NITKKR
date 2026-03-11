import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const EXPERIENCE_TYPE = ['Teaching', 'Industry', 'Research/Post-Doctoral'];
const APPOINTMENT_TYPE = ['Regular', 'Adhoc', 'Contract', 'Guest', 'Temporary'];
const ORGANIZATION_TYPE = [
  'Fully Funded Central Educational Institutions',
  'IIMs and Other Management Institutions ranked by NIRF upto 50',
  'State Educational Institutions funded by State Governments',
  'Other Educational Institutions ranked by NIRF upto 100',
  'Any Other Institute / Organization',
  'Institute / University outside India with QS/THE Ranking within 500',
];

const EMPTY_ROW = {
  experienceType: [],
  employerNameAddress: '',
  isPresentEmployer: false,
  designation: '',
  appointmentType: '',
  payScale: '',
  fromDate: '',
  toDate: '',
  organizationType: '',
};

const Experience = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.experience;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.experience]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };

    // Automatically clear To Date if From Date changes manually to something later than To Date
    if (field === 'fromDate' && upd[i].toDate && val && new Date(val) > new Date(upd[i].toDate)) {
      upd[i].toDate = '';
    }

    setList(upd);

    // Clear error
    const newErrors = [...errors];
    if (newErrors[i] && newErrors[i][field]) {
      newErrors[i][field] = '';
      setErrors(newErrors);
    }
  };

  const toggleExpType = (i, val) => {
    const current = list[i].experienceType || [];
    const upd = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    set(i, 'experienceType', upd);

    const newErrors = [...errors];
    if (newErrors[i] && newErrors[i].experienceType) {
      newErrors[i].experienceType = '';
      setErrors(newErrors);
    }
  };

  const addRow = () => {
    setList([...list, { ...EMPTY_ROW }]);
    setErrors([...errors, {}]);
  };

  const removeRow = (i) => {
    setList(list.filter((_, idx) => idx !== i));
    setErrors(errors.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const newErrors = list.map(() => ({}));
    let hasError = false;

    // Active rows are those with at least one field filled
    const activeRows = list.map((e, index) => ({ e, index }))
      .filter(({ e }) => e.designation?.trim() || e.employerNameAddress?.trim() || e.experienceType?.length);

    if (activeRows.length === 0) {
      toast.error('At least one experience entry is required');
      hasError = true;
    }

    activeRows.forEach(({ e, index }) => {
      if (!e.experienceType?.length) { newErrors[index].experienceType = 'Required'; hasError = true; }
      if (!e.employerNameAddress?.trim()) { newErrors[index].employerNameAddress = 'Required'; hasError = true; }
      if (!e.designation?.trim()) { newErrors[index].designation = 'Required'; hasError = true; }
      if (!e.appointmentType) { newErrors[index].appointmentType = 'Required'; hasError = true; }
      if (!e.payScale?.trim()) { newErrors[index].payScale = 'Required'; hasError = true; }
      if (!e.fromDate) { newErrors[index].fromDate = 'Required'; hasError = true; }
      if (!e.organizationType) { newErrors[index].organizationType = 'Required'; hasError = true; }

      if (!e.isPresentEmployer) {
        if (!e.toDate) {
          newErrors[index].toDate = 'Required when not current employer';
          hasError = true;
        } else if (e.fromDate && new Date(e.toDate) < new Date(e.fromDate)) {
          newErrors[index].toDate = 'Must prepare after From Date';
          hasError = true;
        }
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    const filled = list.filter(e => e.designation?.trim() || e.employerNameAddress?.trim() || e.experienceType?.length);

    try {
      const saved = await updateSection('experience', { items: filled });
      if (saved && onNext) onNext();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (Array.isArray(errs) && errs.length > 0 && errs[0].message) {
        toast.error(errs[0].message);
      } else {
        toast.error(err.response?.data?.message || 'Validation failed. Please check your inputs.');
      }
    }
  };

  const ic = (i, field) => `w-full px-3 py-2 rounded-lg border ${errors[i]?.[field] ? 'border-red-400 bg-red-50/30 text-red-900 placeholder-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white text-gray-900'} focus:ring-2 outline-none text-sm transition-all`;
  const errText = (i, field) => errors[i]?.[field] ? <p className="text-xs text-red-500 mt-1 font-medium">{errors[i][field]}</p> : null;

  return (
    <SectionLayout title="Work Experience" subtitle="List experience in reverse chronological order." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((exp, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                Experience
              </h3>
              {list.length > 1 && <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span>Remove</button>}
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.experienceType ? 'text-red-500' : 'text-gray-500'}`}>Experience Type <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_TYPE.map(t => (
                  <label key={t} className={`flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border ${errors[i]?.experienceType ? 'border-red-300' : 'border-gray-200'} cursor-pointer hover:border-primary/40 text-sm`}>
                    <input type="checkbox" checked={(exp.experienceType || []).includes(t)} onChange={() => toggleExpType(i, t)} className="w-3.5 h-3.5 rounded" />
                    {t}
                  </label>
                ))}
              </div>
              {errText(i, 'experienceType')}
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.employerNameAddress ? 'text-red-500' : 'text-gray-500'}`}>Employer Name & Address <span className="text-red-500">*</span></label>
              <textarea value={exp.employerNameAddress} onChange={e => set(i, 'employerNameAddress', e.target.value)} className={`${ic(i, 'employerNameAddress')} h-16`} placeholder="Full name and address of organization" />
              {errText(i, 'employerNameAddress')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.designation ? 'text-red-500' : 'text-gray-500'}`}>Designation <span className="text-red-500">*</span></label>
                <input value={exp.designation} onChange={e => set(i, 'designation', e.target.value)} className={ic(i, 'designation')} placeholder="e.g. Assistant Professor" />
                {errText(i, 'designation')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.appointmentType ? 'text-red-500' : 'text-gray-500'}`}>Appointment Type <span className="text-red-500">*</span></label>
                <select value={exp.appointmentType} onChange={e => set(i, 'appointmentType', e.target.value)} className={ic(i, 'appointmentType')}>
                  <option value="">Select</option>
                  {APPOINTMENT_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errText(i, 'appointmentType')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.payScale ? 'text-red-500' : 'text-gray-500'}`}>Pay Scale <span className="text-red-500">*</span></label>
                <input value={exp.payScale} onChange={e => set(i, 'payScale', e.target.value)} className={ic(i, 'payScale')} placeholder="e.g. Level 10" />
                {errText(i, 'payScale')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.fromDate ? 'text-red-500' : 'text-gray-500'}`}>From Date <span className="text-red-500">*</span></label>
                <input type="date" max={new Date().toISOString().split("T")[0]} value={exp.fromDate} onChange={e => set(i, 'fromDate', e.target.value)} className={ic(i, 'fromDate')} />
                {errText(i, 'fromDate')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.toDate ? 'text-red-500' : 'text-gray-500'}`}>To Date {!exp.isPresentEmployer && <span className="text-red-500">*</span>}</label>
                <input type="date" disabled={exp.isPresentEmployer} min={exp.fromDate} max={new Date().toISOString().split("T")[0]} value={exp.isPresentEmployer ? '' : exp.toDate} onChange={e => set(i, 'toDate', e.target.value)} className={`${ic(i, 'toDate')} ${exp.isPresentEmployer ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`} />
                {errText(i, 'toDate')}
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 text-sm">
                  <input type="checkbox" checked={exp.isPresentEmployer} onChange={e => {
                    set(i, 'isPresentEmployer', e.target.checked);
                    if (e.target.checked) set(i, 'toDate', '');
                  }} className="w-4 h-4 rounded" />
                  <span className="text-gray-700 font-medium">Current Employer</span>
                </label>
              </div>
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.organizationType ? 'text-red-500' : 'text-gray-500'}`}>Organization Type <span className="text-red-500">*</span></label>
              <select value={exp.organizationType} onChange={e => set(i, 'organizationType', e.target.value)} className={ic(i, 'organizationType')}>
                <option value="">Select</option>
                {ORGANIZATION_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errText(i, 'organizationType')}
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Add Experience
        </button>
      </div>
    </SectionLayout>
  );
};

export default Experience;
