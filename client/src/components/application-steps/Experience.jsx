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
    setList(upd);
  };

  const toggleExpType = (i, val) => {
    const current = list[i].experienceType || [];
    const upd = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    set(i, 'experienceType', upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.designation?.trim() || e.employerNameAddress?.trim() || e.experienceType?.length);
    if (!filled.length) { toast.error('At least one experience entry is required'); return; }
    const bad = filled.some(e =>
      !e.experienceType?.length || !e.employerNameAddress?.trim() || !e.designation?.trim() ||
      !e.appointmentType || !e.payScale?.trim() || !e.fromDate || !e.organizationType ||
      (!e.isPresentEmployer && !e.toDate)
    );
    if (bad) { toast.error('Please complete all required fields in each entry'); return; }
    const saved = await updateSection('experience', { items: filled });
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Work Experience" subtitle="List experience in reverse chronological order." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((exp, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Experience #{i + 1}</h3>
              {list.length > 1 && <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Remove</button>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Experience Type <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_TYPE.map(t => (
                  <label key={t} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:border-primary/40 text-sm">
                    <input type="checkbox" checked={(exp.experienceType || []).includes(t)} onChange={() => toggleExpType(i, t)} className="w-3.5 h-3.5 rounded" />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Employer Name & Address <span className="text-red-500">*</span></label>
              <textarea value={exp.employerNameAddress} onChange={e => set(i, 'employerNameAddress', e.target.value)} className={`${ic} h-16`} placeholder="Full name and address of organization" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Designation <span className="text-red-500">*</span></label>
                <input value={exp.designation} onChange={e => set(i, 'designation', e.target.value)} className={ic} placeholder="e.g. Assistant Professor" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Appointment Type <span className="text-red-500">*</span></label>
                <select value={exp.appointmentType} onChange={e => set(i, 'appointmentType', e.target.value)} className={ic}>
                  <option value="">Select</option>
                  {APPOINTMENT_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Pay Scale <span className="text-red-500">*</span></label>
                <input value={exp.payScale} onChange={e => set(i, 'payScale', e.target.value)} className={ic} placeholder="e.g. Level 10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">From Date <span className="text-red-500">*</span></label>
                <input type="date" value={exp.fromDate} onChange={e => set(i, 'fromDate', e.target.value)} className={ic} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">To Date {!exp.isPresentEmployer && <span className="text-red-500">*</span>}</label>
                <input type="date" value={exp.toDate} onChange={e => set(i, 'toDate', e.target.value)} className={ic} disabled={exp.isPresentEmployer} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exp.isPresentEmployer} onChange={e => set(i, 'isPresentEmployer', e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Current Employer</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Organization Type <span className="text-red-500">*</span></label>
              <select value={exp.organizationType} onChange={e => set(i, 'organizationType', e.target.value)} className={ic}>
                <option value="">Select</option>
                {ORGANIZATION_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
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
