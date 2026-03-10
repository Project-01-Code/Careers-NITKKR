import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const EMPTY_ROW = { title: '', fromDate: '', toDate: '', sponsoringAgency: '' };

const OrganizedPrograms = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

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
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.title?.trim() || e.sponsoringAgency?.trim());
    const bad = filled.some(e => !e.title?.trim() || e.title.trim().length < 3 || !e.fromDate || !e.toDate || !e.sponsoringAgency?.trim());
    if (bad) { toast.error('Please complete all required fields for started entries'); return; }
    // Validate toDate >= fromDate
    const dateCheck = filled.some(e => e.fromDate && e.toDate && new Date(e.toDate) < new Date(e.fromDate));
    if (dateCheck) { toast.error('To Date must be on or after From Date'); return; }
    const saved = await updateSection();
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Organized Programs" subtitle="Workshops, conferences, seminars organized. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((prog, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Program #{i + 1}</h3>
              <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Remove</button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Title of Program <span className="text-red-500">*</span></label>
              <input value={prog.title} onChange={e => set(i, 'title', e.target.value)} className={ic} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">From Date <span className="text-red-500">*</span></label>
                <input type="date" value={prog.fromDate} onChange={e => set(i, 'fromDate', e.target.value)} className={ic} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">To Date <span className="text-red-500">*</span></label>
                <input type="date" value={prog.toDate} onChange={e => set(i, 'toDate', e.target.value)} className={ic} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Sponsoring Agency <span className="text-red-500">*</span></label>
                <input value={prog.sponsoringAgency} onChange={e => set(i, 'sponsoringAgency', e.target.value)} className={ic} placeholder="e.g. AICTE, TEQIP" />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Add Program
        </button>
      </div>
    </SectionLayout>
  );
};

export default OrganizedPrograms;
