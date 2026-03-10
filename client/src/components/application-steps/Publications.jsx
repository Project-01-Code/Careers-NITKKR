import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const JOURNAL_TYPE = ['SCI / Scopus Journals', 'Non-SCI / Non-Scopus Journals'];

const EMPTY_ROW = { journalType: '', paperTitle: '', authors: '', isFirstAuthor: false, coAuthorCount: 0, journalName: '', isPaidJournal: false, volume: '', year: '', pages: '' };

const Publications = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

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
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.paperTitle?.trim() || e.journalName?.trim());
    const bad = filled.some(e => !e.journalType || !e.paperTitle?.trim() || !e.authors?.trim() || !e.journalName?.trim() || !e.volume?.trim() || !e.year?.trim() || !e.pages?.trim());
    if (bad) { toast.error('Please complete all required fields for started publications'); return; }
    if (filled.some(e => !/^\d{4}$/.test(e.year))) { toast.error('Year must be YYYY'); return; }
    const saved = await updateSection('publications', { items: filled });
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Publications (Journals)" subtitle="Details of journal publications. Leave empty if none." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((pub, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Publication #{i + 1}</h3>
              <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Journal Type <span className="text-red-500">*</span></label>
                <select value={pub.journalType} onChange={e => set(i, 'journalType', e.target.value)} className={ic}>
                  <option value="">Select</option>
                  {JOURNAL_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-6 pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={pub.isFirstAuthor} onChange={e => set(i, 'isFirstAuthor', e.target.checked)} className="w-4 h-4 rounded" />
                  First / Corresponding Author
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={pub.isPaidJournal} onChange={e => set(i, 'isPaidJournal', e.target.checked)} className="w-4 h-4 rounded" />
                  Paid Journal
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Paper Title <span className="text-red-500">*</span></label>
              <input value={pub.paperTitle} onChange={e => set(i, 'paperTitle', e.target.value)} className={ic} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Authors <span className="text-red-500">*</span></label>
                <input value={pub.authors} onChange={e => set(i, 'authors', e.target.value)} className={ic} placeholder="All authors, comma separated" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Co-Author Count</label>
                <input type="number" min={0} value={pub.coAuthorCount} onChange={e => set(i, 'coAuthorCount', parseInt(e.target.value) || 0)} className={ic} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Journal Name <span className="text-red-500">*</span></label>
                <input value={pub.journalName} onChange={e => set(i, 'journalName', e.target.value)} className={ic} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Volume <span className="text-red-500">*</span></label>
                  <input value={pub.volume} onChange={e => set(i, 'volume', e.target.value)} className={ic} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Year <span className="text-red-500">*</span></label>
                  <input value={pub.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic} maxLength={4} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Pages <span className="text-red-500">*</span></label>
                  <input value={pub.pages} onChange={e => set(i, 'pages', e.target.value)} className={ic} placeholder="e.g. 1-15" />
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
