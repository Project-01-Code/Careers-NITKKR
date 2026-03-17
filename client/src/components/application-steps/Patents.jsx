import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../hooks/useApplication';
import toast from 'react-hot-toast';

const PATENT_STATUS = ['Granted', 'Applied', 'Published', 'Under Examination'];

const EMPTY_ROW = { patentTitle: '', inventors: '', isPrincipalInventor: false, coInventorCount: 0, year: '', status: '' };

const Patents = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.patents;
    setTimeout(() => {
      if (saved?.items?.length) setList(saved.items);
      else if (Array.isArray(saved) && saved.length) setList(saved);
      else if (list.length === 0) setList([{ ...EMPTY_ROW }]);
    }, 0);
  }, [formData?.patents, list.length]);

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

    const activeRows = list.map((e, index) => ({ e, index }))
      .filter(({ e }) => e.patentTitle?.trim() || e.inventors?.trim());

    activeRows.forEach(({ e, index }) => {
      if (!e.patentTitle?.trim() || e.patentTitle.trim().length < 5) { newErrors[index].patentTitle = 'Required (Min 5 chars)'; hasError = true; }
      if (!e.inventors?.trim() || e.inventors.trim().length < 2) { newErrors[index].inventors = 'Required (Min 2 chars)'; hasError = true; }
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

    const filled = list.filter(e => e.patentTitle?.trim() || e.inventors?.trim());

    try {
      const saved = await updateSection('patents', { items: filled });
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
    <SectionLayout title="Patents" subtitle="Details of patents. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((pat, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                Patent
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
              <label className={`text-xs font-semibold uppercase ${errors[i]?.patentTitle ? 'text-red-500' : 'text-gray-500'}`}>Patent Title <span className="text-red-500">*</span></label>
              <input value={pat.patentTitle} onChange={e => set(i, 'patentTitle', e.target.value)} className={ic(i, 'patentTitle')} />
              {errText(i, 'patentTitle')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.inventors ? 'text-red-500' : 'text-gray-500'}`}>Inventors <span className="text-red-500">*</span></label>
                <input value={pat.inventors} onChange={e => set(i, 'inventors', e.target.value)} className={ic(i, 'inventors')} placeholder="All inventors, comma separated" />
                {errText(i, 'inventors')}
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 text-sm h-[38px] mt-[18px]">
                  <input type="checkbox" checked={pat.isPrincipalInventor} onChange={e => set(i, 'isPrincipalInventor', e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-gray-700 font-medium whitespace-nowrap">Principal Inventor</span>
                </label>
                <div className="space-y-1 flex-1 block">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Co-Inventors</label>
                  <input type="number" min={0} value={pat.coInventorCount} onChange={e => set(i, 'coInventorCount', parseInt(e.target.value) || 0)} className={ic(i, 'coInventorCount')} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.year ? 'text-red-500' : 'text-gray-500'}`}>Year <span className="text-red-500">*</span></label>
                <input value={pat.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic(i, 'year')} placeholder="YYYY" maxLength={4} />
                {errText(i, 'year')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.status ? 'text-red-500' : 'text-gray-500'}`}>Status <span className="text-red-500">*</span></label>
                <select value={pat.status} onChange={e => set(i, 'status', e.target.value)} className={ic(i, 'status')}>
                  <option value="">Select</option>
                  {PATENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errText(i, 'status')}
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group bg-white/50">
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span> Add Patent
        </button>
      </div>
    </SectionLayout>
  );
};

export default Patents;
