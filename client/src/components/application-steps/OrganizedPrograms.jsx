import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const EMPTY_ROW = { title: '', fromDate: '', toDate: '', sponsoringAgency: '' };

const OrganizedPrograms = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.organizedPrograms;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.organizedPrograms]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };

    // Automatically reset 'toDate' if it's earlier than the new 'fromDate'
    if (field === 'fromDate') {
      if (upd[i].toDate && new Date(upd[i].toDate) < new Date(val)) {
        upd[i].toDate = val;
      }
    }

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
      if (!e.fromDate) { newErrors[index].fromDate = 'Required'; hasError = true; }
      if (!e.toDate) { newErrors[index].toDate = 'Required'; hasError = true; }

      if (e.fromDate && e.toDate && new Date(e.toDate) < new Date(e.fromDate)) {
        newErrors[index].toDate = 'To Date must be on or after From Date';
        hasError = true;
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

    const filled = list.filter(e => e.title?.trim() || e.sponsoringAgency?.trim());

    try {
      const saved = await updateSection('organizedPrograms', { items: filled });
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
    <SectionLayout title="Organized Programs" subtitle="Workshops, conferences, seminars organized. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((prog, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                Program
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
              <label className={`text-xs font-semibold uppercase ${errors[i]?.title ? 'text-red-500' : 'text-gray-500'}`}>Title of Program <span className="text-red-500">*</span></label>
              <input value={prog.title} onChange={e => set(i, 'title', e.target.value)} className={ic(i, 'title')} />
              {errText(i, 'title')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.fromDate ? 'text-red-500' : 'text-gray-500'}`}>From Date <span className="text-red-500">*</span></label>
                <input type="date" value={prog.fromDate} onChange={e => set(i, 'fromDate', e.target.value)} className={ic(i, 'fromDate')} />
                {errText(i, 'fromDate')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.toDate ? 'text-red-500' : 'text-gray-500'}`}>To Date <span className="text-red-500">*</span></label>
                <input type="date" min={prog.fromDate || ''} value={prog.toDate} onChange={e => set(i, 'toDate', e.target.value)} className={ic(i, 'toDate')} />
                {errText(i, 'toDate')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.sponsoringAgency ? 'text-red-500' : 'text-gray-500'}`}>Sponsoring Agency <span className="text-red-500">*</span></label>
                <input value={prog.sponsoringAgency} onChange={e => set(i, 'sponsoringAgency', e.target.value)} className={ic(i, 'sponsoringAgency')} placeholder="e.g. AICTE, TEQIP" />
                {errText(i, 'sponsoringAgency')}
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group bg-white/50">
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span> Add Program
        </button>
      </div>
    </SectionLayout>
  );
};

export default OrganizedPrograms;
