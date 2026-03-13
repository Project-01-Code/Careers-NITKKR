import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const PROJECT_STATUS = ['Completed', 'Ongoing', 'Sanctioned'];

const EMPTY_ROW = { sponsoringAgency: '', title: '', period: '', amount: 0, piCoPI: '', isPrincipalInvestigator: false, coInvestigatorCount: 0, status: '' };

const Projects = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.projects;
    setTimeout(() => {
      if (saved?.items?.length) setList(saved.items);
      else if (Array.isArray(saved) && saved.length) setList(saved);
      else if (list.length === 0) setList([{ ...EMPTY_ROW }]);
    }, 0);
  }, [formData?.projects, list.length]);

  const set = (i, field, val) => {
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

    // Filter out completely empty rows
    const activeRows = list.map((e, index) => ({ e, index }))
      .filter(({ e }) => e.title?.trim() || e.sponsoringAgency?.trim());

    activeRows.forEach(({ e, index }) => {
      if (!e.title?.trim() || e.title.trim().length < 3) { newErrors[index].title = 'Required (Min 3 chars)'; hasError = true; }
      if (!e.sponsoringAgency?.trim() || e.sponsoringAgency.trim().length < 2) { newErrors[index].sponsoringAgency = 'Required (Min 2 chars)'; hasError = true; }
      if (e.amount === '' || e.amount === null || e.amount === undefined) { newErrors[index].amount = 'Required'; hasError = true; }
      if (!e.period?.trim()) { newErrors[index].period = 'Required'; hasError = true; }
      if (!e.status) { newErrors[index].status = 'Required'; hasError = true; }
      if (!e.piCoPI?.trim() || e.piCoPI.trim().length < 2) { newErrors[index].piCoPI = 'Required (Min 2 chars)'; hasError = true; }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    const filled = list.filter(e => e.title?.trim() || e.sponsoringAgency?.trim());

    try {
      const saved = await updateSection('projects', { items: filled });
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
    <SectionLayout title="Sponsored Projects" subtitle="Details of sponsored R&D projects. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((proj, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                Project
              </h3>
              <button
                onClick={() => removeRow(i)}
                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Remove
              </button>
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.title ? 'text-red-500' : 'text-gray-500'}`}>Project Title <span className="text-red-500">*</span></label>
              <input value={proj.title} onChange={e => set(i, 'title', e.target.value)} className={ic(i, 'title')} />
              {errText(i, 'title')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.sponsoringAgency ? 'text-red-500' : 'text-gray-500'}`}>Sponsoring Agency <span className="text-red-500">*</span></label>
                <input value={proj.sponsoringAgency} onChange={e => set(i, 'sponsoringAgency', e.target.value)} className={ic(i, 'sponsoringAgency')} placeholder="e.g. DST, CSIR" />
                {errText(i, 'sponsoringAgency')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.amount ? 'text-red-500' : 'text-gray-500'}`}>Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" min={0} value={proj.amount} onChange={e => set(i, 'amount', parseFloat(e.target.value) || '')} className={ic(i, 'amount')} placeholder="In rupees" />
                {errText(i, 'amount')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.period ? 'text-red-500' : 'text-gray-500'}`}>Period <span className="text-red-500">*</span></label>
                <input value={proj.period} onChange={e => set(i, 'period', e.target.value)} className={ic(i, 'period')} placeholder="e.g. 2020-2023" />
                {errText(i, 'period')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.status ? 'text-red-500' : 'text-gray-500'}`}>Status <span className="text-red-500">*</span></label>
                <select value={proj.status} onChange={e => set(i, 'status', e.target.value)} className={ic(i, 'status')}>
                  <option value="">Select</option>
                  {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errText(i, 'status')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.piCoPI ? 'text-red-500' : 'text-gray-500'}`}>PI / Co-PI <span className="text-red-500">*</span></label>
                <input value={proj.piCoPI} onChange={e => set(i, 'piCoPI', e.target.value)} className={ic(i, 'piCoPI')} placeholder="Names of PI, Co-PI" />
                {errText(i, 'piCoPI')}
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 text-sm h-[38px] mt-[18px]">
                  <input type="checkbox" checked={proj.isPrincipalInvestigator} onChange={e => set(i, 'isPrincipalInvestigator', e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-gray-700 font-medium whitespace-nowrap">I am Principal Investigator</span>
                </label>
              </div>
              <div className="space-y-1 block">
                <label className="text-xs font-semibold text-gray-500 uppercase">Co-Investigators</label>
                <input type="number" min={0} value={proj.coInvestigatorCount} onChange={e => set(i, 'coInvestigatorCount', parseInt(e.target.value) || 0)} className={ic(i, 'coInvestigatorCount')} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group bg-white/50">
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span> Add Project
        </button>
      </div>
    </SectionLayout>
  );
};

export default Projects;
