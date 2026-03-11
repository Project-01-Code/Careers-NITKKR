import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const PROJECT_STATUS = ['Completed', 'Ongoing', 'Sanctioned'];

const EMPTY_ROW = {
  fundingAgency: '',
  title: '',
  period: '',
  amount: 0,
  piCoPI: '',
  status: ''
};

const ConsultancyProjects = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.consultancyProjects;
    if (saved && Array.isArray(saved) && saved.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setList(saved);
    } else {
      setList([{ ...EMPTY_ROW }]);
    }
  }, [formData?.consultancyProjects]);

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
      .filter(({ e }) => e.title?.trim() || e.fundingAgency?.trim());

    activeRows.forEach(({ e, index }) => {
      if (!e.title?.trim() || e.title.trim().length < 3) { newErrors[index].title = 'Required (Min 3 chars)'; hasError = true; }
      if (!e.fundingAgency?.trim() || e.fundingAgency.trim().length < 2) { newErrors[index].fundingAgency = 'Required (Min 2 chars)'; hasError = true; }
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

    const filled = list.filter(e => e.title?.trim() || e.fundingAgency?.trim());

    try {
      const saved = await updateSection('consultancyProjects', filled);
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

  const ic = (i, field) => `w-full px-4 py-2.5 rounded-xl border ${errors[i]?.[field] ? 'border-red-400 bg-red-50/30 text-red-900 placeholder-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/5 focus:border-primary bg-white text-gray-900'} focus:ring-4 outline-none text-sm transition-all`;
  const errText = (i, field) => errors[i]?.[field] ? <p className="text-xs text-red-500 mt-1 font-bold tracking-wide">{errors[i][field]}</p> : null;

  return (
    <SectionLayout
      title="Consultancy Projects"
      subtitle="Details of consultancy projects undertaken. Leave empty if none."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-8">
        {list.map((proj, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                Consultancy Project
              </h3>
              <button
                onClick={() => removeRow(i)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
                Remove
              </button>
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.title ? 'text-red-500' : 'text-gray-400'}`}>Project Title <span className="text-red-500">*</span></label>
              <input value={proj.title} onChange={e => set(i, 'title', e.target.value)} className={ic(i, 'title')} placeholder="Title of the consultancy project" />
              {errText(i, 'title')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.fundingAgency ? 'text-red-500' : 'text-gray-400'}`}>Funding Agency <span className="text-red-500">*</span></label>
                <input value={proj.fundingAgency} onChange={e => set(i, 'fundingAgency', e.target.value)} className={ic(i, 'fundingAgency')} placeholder="Organization funding the project" />
                {errText(i, 'fundingAgency')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.piCoPI ? 'text-red-500' : 'text-gray-400'}`}>PI / Co-PI Details <span className="text-red-500">*</span></label>
                <input value={proj.piCoPI} onChange={e => set(i, 'piCoPI', e.target.value)} className={ic(i, 'piCoPI')} placeholder="Your role and other investigators" />
                {errText(i, 'piCoPI')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.period ? 'text-red-500' : 'text-gray-400'}`}>Period <span className="text-red-500">*</span></label>
                <input value={proj.period} onChange={e => set(i, 'period', e.target.value)} className={ic(i, 'period')} placeholder="e.g. 2021-2023" />
                {errText(i, 'period')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.amount ? 'text-red-500' : 'text-gray-400'}`}>Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" min={0} value={proj.amount} onChange={e => set(i, 'amount', parseFloat(e.target.value) || '')} className={ic(i, 'amount')} />
                {errText(i, 'amount')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.status ? 'text-red-500' : 'text-gray-400'}`}>Status <span className="text-red-500">*</span></label>
                <select value={proj.status} onChange={e => set(i, 'status', e.target.value)} className={ic(i, 'status')}>
                  <option value="">Select Status</option>
                  {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errText(i, 'status')}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addRow}
          className="w-full py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 bg-gray-50/30 hover:bg-primary/5 group"
        >
          <span className="material-symbols-outlined group-hover:scale-125 transition-transform">add_circle</span>
          Add Another Project
        </button>
      </div>
    </SectionLayout>
  );
};

export default ConsultancyProjects;
