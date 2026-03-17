import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../hooks/useApplication';
import toast from 'react-hot-toast';

const PHD_STATUS = ['Awarded', 'Submitted', 'Ongoing'];

const EMPTY_ROW = { scholarName: '', researchTopic: '', universityInstitute: '', supervisors: '', isFirstSupervisor: false, coSupervisorCount: 0, year: '', status: '' };

const PhdSupervision = ({ onNext, onBack, isReadOnly }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.phdSupervision;
    setTimeout(() => {
      if (saved?.items?.length) setList(saved.items);
      else if (Array.isArray(saved) && saved.length) setList(saved);
      else if (list.length === 0) setList([{ ...EMPTY_ROW }]);
    }, 0);
  }, [formData?.phdSupervision, list.length]);

  const set = (i, field, val) => {
    if (isReadOnly) return;
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);

    // Clear error
    const newErrors = [...errors];
    if (newErrors[i] && newErrors[i][field]) {
      newErrors[i][field] = '';
      setErrors(newErrors);
    }
  };

  const addRow = () => {
    if (isReadOnly) return;
    setList([...list, { ...EMPTY_ROW }]);
    setErrors([...errors, {}]);
  };

  const removeRow = (i) => {
    if (isReadOnly) return;
    setList(list.filter((_, idx) => idx !== i));
    setErrors(errors.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const newErrors = list.map(() => ({}));
    let hasError = false;

    // Filter out completely empty rows
    const activeRows = list.map((e, index) => ({ e, index }))
      .filter(({ e }) => e.scholarName?.trim() || e.researchTopic?.trim());

    activeRows.forEach(({ e, index }) => {
      if (!e.scholarName?.trim() || e.scholarName.trim().length < 2) { newErrors[index].scholarName = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.universityInstitute?.trim() || e.universityInstitute.trim().length < 2) { newErrors[index].universityInstitute = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.researchTopic?.trim() || e.researchTopic.trim().length < 5) { newErrors[index].researchTopic = 'Required (Min 5 chars)'; hasError = true; }
      if (!e.supervisors?.trim() || e.supervisors.trim().length < 2) { newErrors[index].supervisors = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.status) { newErrors[index].status = 'Required'; hasError = true; }

      if (!e.year?.trim()) {
        newErrors[index].year = 'Required'; hasError = true;
      } else if (!/^\d{4}$/.test(e.year)) {
        newErrors[index].year = 'Must be YYYY'; hasError = true;
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

    const filled = list.filter(e => e.scholarName?.trim() || e.researchTopic?.trim());

    try {
      const saved = await updateSection('phdSupervision', { items: filled });
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

  const ic = (i, field) => `w-full px-3 py-2 rounded-lg border ${errors[i]?.[field] ? 'border-red-400 bg-red-50/30 text-red-900 placeholder-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white text-gray-900'} focus:ring-2 outline-none text-sm transition-all ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`;
  const errText = (i, field) => errors[i]?.[field] ? <p className="text-xs text-red-500 mt-1 font-medium">{errors[i][field]}</p> : null;

  return (
    <SectionLayout title="PhD Supervision" subtitle="Details of PhD students supervised. Leave empty if none." onNext={handleNext} onBack={onBack} isReadOnly={isReadOnly}>
      <div className="space-y-6">
        {list.map((phd, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                PhD Scholar
              </h3>
              {list.length > 1 && !isReadOnly && (
                <button
                  onClick={() => removeRow(i)}
                  className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.scholarName ? 'text-red-500' : 'text-gray-500'}`}>Scholar Name <span className="text-red-500">*</span></label>
                <input value={phd.scholarName} onChange={e => set(i, 'scholarName', e.target.value)} className={ic(i, 'scholarName')} disabled={isReadOnly} />
                {errText(i, 'scholarName')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.universityInstitute ? 'text-red-500' : 'text-gray-500'}`}>University / Institute <span className="text-red-500">*</span></label>
                <input value={phd.universityInstitute} onChange={e => set(i, 'universityInstitute', e.target.value)} className={ic(i, 'universityInstitute')} disabled={isReadOnly} />
                {errText(i, 'universityInstitute')}
              </div>
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.researchTopic ? 'text-red-500' : 'text-gray-500'}`}>Research Topic <span className="text-red-500">*</span></label>
              <input value={phd.researchTopic} onChange={e => set(i, 'researchTopic', e.target.value)} className={ic(i, 'researchTopic')} placeholder="Full thesis/research topic" disabled={isReadOnly} />
              {errText(i, 'researchTopic')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.supervisors ? 'text-red-500' : 'text-gray-500'}`}>Supervisor(s) <span className="text-red-500">*</span></label>
                <input value={phd.supervisors} onChange={e => set(i, 'supervisors', e.target.value)} className={ic(i, 'supervisors')} placeholder="All supervisor names" disabled={isReadOnly} />
                {errText(i, 'supervisors')}
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className={`flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 text-sm h-[38px] mt-[18px] ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}>
                  <input type="checkbox" checked={phd.isFirstSupervisor} onChange={e => set(i, 'isFirstSupervisor', e.target.checked)} className="w-4 h-4 rounded" disabled={isReadOnly} />
                  <span className="text-gray-700 font-medium whitespace-nowrap">First Supervisor</span>
                </label>
                <div className="space-y-1 flex-1 block">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Co-Supervisors</label>
                  <input type="number" min={0} value={phd.coSupervisorCount} onChange={e => set(i, 'coSupervisorCount', parseInt(e.target.value) || 0)} className={ic(i, 'coSupervisorCount')} disabled={isReadOnly} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.year ? 'text-red-500' : 'text-gray-500'}`}>Year <span className="text-red-500">*</span></label>
                <input value={phd.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic(i, 'year')} maxLength={4} placeholder="YYYY" disabled={isReadOnly} />
                {errText(i, 'year')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.status ? 'text-red-500' : 'text-gray-500'}`}>Status <span className="text-red-500">*</span></label>
                <select value={phd.status} onChange={e => set(i, 'status', e.target.value)} className={ic(i, 'status')} disabled={isReadOnly}>
                  <option value="">Select</option>
                  {PHD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errText(i, 'status')}
              </div>
            </div>
          </div>
        ))}
        {!isReadOnly && (
          <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group bg-white/50">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span> Add PhD Scholar
          </button>
        )}
      </div>
    </SectionLayout>
  );
};

export default PhdSupervision;
