import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const PATENT_STATUS = ['Granted', 'Applied', 'Published', 'Under Examination'];

const EMPTY_ROW = { patentTitle: '', inventors: '', isPrincipalInventor: false, coInventorCount: 0, year: '', status: '' };

const Patents = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

  useEffect(() => {
    const saved = formData?.patents;
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.patents]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.patentTitle?.trim() || e.inventors?.trim());
    const bad = filled.some(e => !e.patentTitle?.trim() || e.patentTitle.trim().length < 5 || !e.inventors?.trim() || !e.status || !/^\d{4}$/.test(e.year));
    if (bad) { toast.error('Please complete all required fields for started patent entries'); return; }
    const saved = await updateSection('patents', { items: filled });
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Patents" subtitle="Details of patents. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((pat, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Patent #{i + 1}</h3>
              <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Remove</button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Patent Title <span className="text-red-500">*</span></label>
              <input value={pat.patentTitle} onChange={e => set(i, 'patentTitle', e.target.value)} className={ic} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Inventors <span className="text-red-500">*</span></label>
                <input value={pat.inventors} onChange={e => set(i, 'inventors', e.target.value)} className={ic} placeholder="All inventors, comma separated" />
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={pat.isPrincipalInventor} onChange={e => set(i, 'isPrincipalInventor', e.target.checked)} className="w-4 h-4 rounded" />
                  Principal Inventor
                </label>
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Co-Inventors</label>
                  <input type="number" min={0} value={pat.coInventorCount} onChange={e => set(i, 'coInventorCount', parseInt(e.target.value) || 0)} className={ic} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Year <span className="text-red-500">*</span></label>
                <input value={pat.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic} placeholder="YYYY" maxLength={4} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Status <span className="text-red-500">*</span></label>
                <select value={pat.status} onChange={e => set(i, 'status', e.target.value)} className={ic}>
                  <option value="">Select</option>
                  {PATENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Add Patent
        </button>
      </div>
    </SectionLayout>
  );
};

export default Patents;
