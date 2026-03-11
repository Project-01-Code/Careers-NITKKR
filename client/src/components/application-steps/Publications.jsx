import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const JOURNAL_TYPE = ['SCI / Scopus Journals', 'Non-SCI / Non-Scopus Journals'];

const EMPTY_ROW = { journalType: '', paperTitle: '', authors: '', isFirstAuthor: false, coAuthorCount: 0, journalName: '', isPaidJournal: false, volume: '', year: '', pages: '' };

const Publications = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.publications;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.publications]);

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

    // A row is active if any of the main descriptive strings are filled.
    // If a user added a row but left it entirely blank, it will be skipped and stripped out before saving.
    const activeRows = list.map((e, index) => ({ e, index }))
      .filter(({ e }) => e.journalType || e.paperTitle?.trim() || e.journalName?.trim() || e.authors?.trim());

    activeRows.forEach(({ e, index }) => {
      if (!e.journalType) { newErrors[index].journalType = 'Required'; hasError = true; }
      if (!e.paperTitle?.trim() || e.paperTitle.trim().length < 5) { newErrors[index].paperTitle = 'Required (Min 5 chars)'; hasError = true; }
      if (!e.authors?.trim() || e.authors.trim().length < 2) { newErrors[index].authors = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.journalName?.trim() || e.journalName.trim().length < 2) { newErrors[index].journalName = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.volume?.trim()) { newErrors[index].volume = 'Required'; hasError = true; }

      if (!e.year?.trim()) {
        newErrors[index].year = 'Required'; hasError = true;
      } else if (!/^\d{4}$/.test(e.year)) {
        newErrors[index].year = 'Must be YYYY'; hasError = true;
      }

      if (!e.pages?.trim()) { newErrors[index].pages = 'Required'; hasError = true; }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    const filled = list.filter(e => e.journalType || e.paperTitle?.trim() || e.journalName?.trim() || e.authors?.trim());

    try {
      const saved = await updateSection('publications', { items: filled });
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
    <SectionLayout title="Publications (Journals)" subtitle="Details of journal publications. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((pub, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                Publication
              </h3>
              <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span>Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.journalType ? 'text-red-500' : 'text-gray-500'}`}>Journal Type <span className="text-red-500">*</span></label>
                <select value={pub.journalType} onChange={e => set(i, 'journalType', e.target.value)} className={ic(i, 'journalType')}>
                  <option value="">Select</option>
                  {JOURNAL_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errText(i, 'journalType')}
              </div>
              <div className="flex items-end gap-6 pb-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 text-sm">
                  <input type="checkbox" checked={pub.isFirstAuthor} onChange={e => set(i, 'isFirstAuthor', e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-gray-700 font-medium whitespace-nowrap">First / Corresponding</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 text-sm">
                  <input type="checkbox" checked={pub.isPaidJournal} onChange={e => set(i, 'isPaidJournal', e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-gray-700 font-medium whitespace-nowrap">Paid Journal</span>
                </label>
              </div>
            </div>
            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.paperTitle ? 'text-red-500' : 'text-gray-500'}`}>Paper Title <span className="text-red-500">*</span></label>
              <input value={pub.paperTitle} onChange={e => set(i, 'paperTitle', e.target.value)} className={ic(i, 'paperTitle')} />
              {errText(i, 'paperTitle')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.authors ? 'text-red-500' : 'text-gray-500'}`}>Authors <span className="text-red-500">*</span></label>
                <input value={pub.authors} onChange={e => set(i, 'authors', e.target.value)} className={ic(i, 'authors')} placeholder="All authors, comma separated" />
                {errText(i, 'authors')}
              </div>
              <div className="space-y-1 block">
                <label className="text-xs font-semibold text-gray-500 uppercase">Co-Author Count</label>
                <input type="number" min={0} value={pub.coAuthorCount} onChange={e => set(i, 'coAuthorCount', parseInt(e.target.value) || 0)} className={ic(i, 'coAuthorCount')} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.journalName ? 'text-red-500' : 'text-gray-500'}`}>Journal Name <span className="text-red-500">*</span></label>
                <input value={pub.journalName} onChange={e => set(i, 'journalName', e.target.value)} className={ic(i, 'journalName')} />
                {errText(i, 'journalName')}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 block">
                  <label className={`text-xs font-semibold uppercase ${errors[i]?.volume ? 'text-red-500' : 'text-gray-500'}`}>Volume <span className="text-red-500">*</span></label>
                  <input value={pub.volume} onChange={e => set(i, 'volume', e.target.value)} className={ic(i, 'volume')} />
                  {errText(i, 'volume')}
                </div>
                <div className="space-y-1 block">
                  <label className={`text-xs font-semibold uppercase ${errors[i]?.year ? 'text-red-500' : 'text-gray-500'}`}>Year <span className="text-red-500">*</span></label>
                  <input value={pub.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic(i, 'year')} maxLength={4} />
                  {errText(i, 'year')}
                </div>
                <div className="space-y-1 block">
                  <label className={`text-xs font-semibold uppercase ${errors[i]?.pages ? 'text-red-500' : 'text-gray-500'}`}>Pages <span className="text-red-500">*</span></label>
                  <input value={pub.pages} onChange={e => set(i, 'pages', e.target.value)} className={ic(i, 'pages')} placeholder="e.g. 1-15" />
                  {errText(i, 'pages')}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Add Publication
        </button>
      </div>
    </SectionLayout>
  );
};

export default Publications;
