import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const SUBJECT_LEVEL = ['UG Level', 'PG Level'];

const EMPTY_ROW = { category: '', subjectName: '' };

const SubjectsTaught = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

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
      .filter(({ e }) => e.subjectName?.trim() || e.category);

    activeRows.forEach(({ e, index }) => {
      if (!e.subjectName?.trim() || e.subjectName.trim().length < 2) {
        newErrors[index].subjectName = 'Required (Min 2 chars)';
        hasError = true;
      }
      if (!e.category) {
        newErrors[index].category = 'Required';
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

    const filled = list.filter(e => e.subjectName?.trim() || e.category);

    try {
      const saved = await updateSection('subjectsTaught', { items: filled });
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
    <SectionLayout title="Subjects Taught" subtitle="UG/PG level courses you have taught. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-4">
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-48">Level <span className="text-red-500">*</span></th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Subject Name <span className="text-red-500">*</span></th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((sub, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                  <td className="p-3">
                    <select value={sub.category} onChange={e => set(i, 'category', e.target.value)} className={ic(i, 'category')}>
                      <option value="">Select Level</option>
                      {SUBJECT_LEVEL.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {errText(i, 'category')}
                  </td>
                  <td className="p-3">
                    <input value={sub.subjectName} onChange={e => set(i, 'subjectName', e.target.value)} className={ic(i, 'subjectName')} placeholder="Subject / Course Name" />
                    {errText(i, 'subjectName')}
                  </td>
                  <td className="p-3 text-center pt-5">
                    <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors" title="Remove">
                      <span className="material-symbols-outlined text-xl block">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group bg-white/50">
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span> Add Subject
        </button>
      </div>
    </SectionLayout>
  );
};

export default SubjectsTaught;
