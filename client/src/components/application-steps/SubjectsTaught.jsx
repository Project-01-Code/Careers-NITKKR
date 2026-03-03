import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const SUBJECT_LEVEL = ['UG Level', 'PG Level'];

const EMPTY_ROW = { category: '', subjectName: '' };

const SubjectsTaught = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

  useEffect(() => {
    const saved = formData?.subjectsTaught;
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.subjectsTaught]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.subjectName?.trim() || e.category);
    const bad = filled.some(e => !e.category || !e.subjectName?.trim() || e.subjectName.trim().length < 2);
    if (bad) { toast.error('Please fill level and subject name for started entries'); return; }
    await updateSection('subjectsTaught', { items: filled });
    if (onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Subjects Taught" subtitle="UG/PG level courses you have taught. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-4">
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-40">Level *</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Subject Name *</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((sub, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="p-3">
                    <select value={sub.category} onChange={e => set(i, 'category', e.target.value)} className={ic}>
                      <option value="">Select</option>
                      {SUBJECT_LEVEL.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <input value={sub.subjectName} onChange={e => set(i, 'subjectName', e.target.value)} className={ic} placeholder="Subject / Course Name" />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 p-1" title="Remove">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add</span> Add Subject
        </button>
      </div>
    </SectionLayout>
  );
};

export default SubjectsTaught;
