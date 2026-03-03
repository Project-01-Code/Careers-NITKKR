import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const PROJECT_STATUS = ['Completed', 'Ongoing', 'Sanctioned'];

const EMPTY_ROW = { sponsoringAgency: '', title: '', period: '', amount: 0, piCoPI: '', isPrincipalInvestigator: false, coInvestigatorCount: 0, status: '' };

const Projects = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

  useEffect(() => {
    const saved = formData?.projects;
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.projects]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.title?.trim() || e.sponsoringAgency?.trim());
    const bad = filled.some(e => !e.sponsoringAgency?.trim() || !e.title?.trim() || e.title.trim().length < 3 || !e.period?.trim() || !e.piCoPI?.trim() || !e.status);
    if (bad) { toast.error('Please complete all required fields for started project entries'); return; }
    await updateSection('projects', { items: filled });
    if (onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Sponsored Projects" subtitle="Details of sponsored R&D projects. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((proj, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Project #{i + 1}</h3>
              <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Remove</button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Project Title <span className="text-red-500">*</span></label>
              <input value={proj.title} onChange={e => set(i, 'title', e.target.value)} className={ic} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Sponsoring Agency <span className="text-red-500">*</span></label>
                <input value={proj.sponsoringAgency} onChange={e => set(i, 'sponsoringAgency', e.target.value)} className={ic} placeholder="e.g. DST, CSIR" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" min={0} value={proj.amount} onChange={e => set(i, 'amount', parseFloat(e.target.value) || 0)} className={ic} placeholder="In rupees" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Period <span className="text-red-500">*</span></label>
                <input value={proj.period} onChange={e => set(i, 'period', e.target.value)} className={ic} placeholder="e.g. 2020-2023" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Status <span className="text-red-500">*</span></label>
                <select value={proj.status} onChange={e => set(i, 'status', e.target.value)} className={ic}>
                  <option value="">Select</option>
                  {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">PI / Co-PI <span className="text-red-500">*</span></label>
                <input value={proj.piCoPI} onChange={e => set(i, 'piCoPI', e.target.value)} className={ic} placeholder="Names of PI, Co-PI" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={proj.isPrincipalInvestigator} onChange={e => set(i, 'isPrincipalInvestigator', e.target.checked)} className="w-4 h-4 rounded" />
                  I am Principal Investigator
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Co-Investigators</label>
                <input type="number" min={0} value={proj.coInvestigatorCount} onChange={e => set(i, 'coInvestigatorCount', parseInt(e.target.value) || 0)} className={ic} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Add Project
        </button>
      </div>
    </SectionLayout>
  );
};

export default Projects;
