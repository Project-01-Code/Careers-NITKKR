import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const PHD_STATUS = ['Awarded', 'Submitted', 'Ongoing'];

const EMPTY_ROW = { scholarName: '', researchTopic: '', universityInstitute: '', supervisors: '', isFirstSupervisor: false, coSupervisorCount: 0, year: '', status: '' };

const PhdSupervision = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

  useEffect(() => {
    const saved = formData?.phdSupervision;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.phdSupervision]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.scholarName?.trim() || e.researchTopic?.trim());
    const bad = filled.some(e => !e.scholarName?.trim() || e.scholarName.trim().length < 2 || !e.researchTopic?.trim() || e.researchTopic.trim().length < 5 || !e.universityInstitute?.trim() || !e.supervisors?.trim() || !e.status || !/^\d{4}$/.test(e.year));
    if (bad) { toast.error('Please complete all required fields for started PhD entries'); return; }
    const saved = await updateSection();
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="PhD Supervision" subtitle="Details of PhD students supervised. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((phd, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">PhD Scholar #{i + 1}</h3>
              <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Scholar Name <span className="text-red-500">*</span></label>
                <input value={phd.scholarName} onChange={e => set(i, 'scholarName', e.target.value)} className={ic} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">University / Institute <span className="text-red-500">*</span></label>
                <input value={phd.universityInstitute} onChange={e => set(i, 'universityInstitute', e.target.value)} className={ic} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Research Topic <span className="text-red-500">*</span></label>
              <input value={phd.researchTopic} onChange={e => set(i, 'researchTopic', e.target.value)} className={ic} placeholder="Full thesis/research topic" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Supervisor(s) <span className="text-red-500">*</span></label>
                <input value={phd.supervisors} onChange={e => set(i, 'supervisors', e.target.value)} className={ic} placeholder="All supervisor names" />
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={phd.isFirstSupervisor} onChange={e => set(i, 'isFirstSupervisor', e.target.checked)} className="w-4 h-4 rounded" />
                  First Supervisor
                </label>
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Co-Supervisors</label>
                  <input type="number" min={0} value={phd.coSupervisorCount} onChange={e => set(i, 'coSupervisorCount', parseInt(e.target.value) || 0)} className={ic} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Year <span className="text-red-500">*</span></label>
                <input value={phd.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic} maxLength={4} placeholder="YYYY" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Status <span className="text-red-500">*</span></label>
                <select value={phd.status} onChange={e => set(i, 'status', e.target.value)} className={ic}>
                  <option value="">Select</option>
                  {PHD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Add PhD Scholar
        </button>
      </div>
    </SectionLayout>
  );
};

export default PhdSupervision;
