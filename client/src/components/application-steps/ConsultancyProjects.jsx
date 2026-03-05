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

  useEffect(() => {
    const saved = formData?.consultancyProjects;
    if (saved && Array.isArray(saved) && saved.length) {
      setList(saved);
    } else {
      setList([{ ...EMPTY_ROW }]);
    }
  }, [formData?.consultancyProjects]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.title?.trim() || e.fundingAgency?.trim());
    
    const bad = filled.some(e => 
      !e.fundingAgency?.trim() || 
      !e.title?.trim() || 
      !e.period?.trim() || 
      !e.amount || 
      !e.piCoPI?.trim() || 
      !e.status
    );

    if (bad) { 
      toast.error('Please complete all required fields for started consultancy projects'); 
      return; 
    }

    const saved = await updateSection('consultancyProjects', filled);
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none bg-white text-sm transition-all';

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
                Consultancy Project #{i + 1}
              </h3>
              <button 
                onClick={() => removeRow(i)} 
                className="text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
                Remove
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project Title <span className="text-red-500">*</span></label>
              <input value={proj.title} onChange={e => set(i, 'title', e.target.value)} className={ic} placeholder="Title of the consultancy project" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Funding Agency <span className="text-red-500">*</span></label>
                <input value={proj.fundingAgency} onChange={e => set(i, 'fundingAgency', e.target.value)} className={ic} placeholder="Organization funding the project" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">PI / Co-PI Details <span className="text-red-500">*</span></label>
                <input value={proj.piCoPI} onChange={e => set(i, 'piCoPI', e.target.value)} className={ic} placeholder="Your role and other investigators" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Period <span className="text-red-500">*</span></label>
                <input value={proj.period} onChange={e => set(i, 'period', e.target.value)} className={ic} placeholder="e.g. 2021-2023" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" min={0} value={proj.amount} onChange={e => set(i, 'amount', parseFloat(e.target.value) || 0)} className={ic} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status <span className="text-red-500">*</span></label>
                <select value={proj.status} onChange={e => set(i, 'status', e.target.value)} className={ic}>
                  <option value="">Select Status</option>
                  {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
