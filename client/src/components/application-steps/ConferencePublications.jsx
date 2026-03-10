import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const CONFERENCE_TYPES = [
  'SCI Indexed Conference',
  'Scopus Indexed Conference',
  'Web of Science Conference',
  'Internationally Renowned Conference',
];

const EMPTY_ROW = { 
  conferenceType: '', 
  paperTitle: '', 
  authors: '', 
  isFirstAuthor: false, 
  coAuthorCount: 0, 
  conferenceName: '', 
  organizer: '', 
  year: '', 
  pages: '' 
};

const ConferencePublications = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

  useEffect(() => {
    const saved = formData?.conferencePublications;
    if (saved && Array.isArray(saved) && saved.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setList(saved);
    } else {
      setList([{ ...EMPTY_ROW }]);
    }
  }, [formData?.conferencePublications]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    // Filter out rows that are completely empty
    const filled = list.filter(e => e.paperTitle?.trim() || e.conferenceName?.trim());
    
    // Check if any partially filled row is missing required fields
    const bad = filled.some(e => 
      !e.conferenceType || 
      !e.paperTitle?.trim() || 
      !e.authors?.trim() || 
      !e.conferenceName?.trim() || 
      !e.year?.trim()
    );

    if (bad) { 
      toast.error('Please complete all required fields for started publications'); 
      return; 
    }

    if (filled.some(e => !/^\d{4}$/.test(e.year))) { 
      toast.error('Year must be YYYY'); 
      return; 
    }

    const saved = await updateSection('conferencePublications', filled);
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout 
      title="Conference Publications" 
      subtitle="Details of conference publications. Leave empty if none." 
      onNext={handleNext} 
      onBack={onBack}
    >
      <div className="space-y-6">
        {list.map((pub, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                Conference Paper #{i + 1}
              </h3>
              <button 
                onClick={() => removeRow(i)} 
                className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition-all border border-transparent hover:border-red-100 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Conference Type <span className="text-red-500">*</span></label>
                <select value={pub.conferenceType} onChange={e => set(i, 'conferenceType', e.target.value)} className={ic}>
                  <option value="">Select Category</option>
                  {CONFERENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={pub.isFirstAuthor} 
                    onChange={e => set(i, 'isFirstAuthor', e.target.checked)} 
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
                  />
                  First / Corresponding Author
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Paper Title <span className="text-red-500">*</span></label>
              <input value={pub.paperTitle} onChange={e => set(i, 'paperTitle', e.target.value)} className={ic} placeholder="Full title of the research paper" />
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
                <label className="text-xs font-semibold text-gray-500 uppercase">Conference Name <span className="text-red-500">*</span></label>
                <input value={pub.conferenceName} onChange={e => set(i, 'conferenceName', e.target.value)} className={ic} placeholder="Full name of the conference" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Organizer</label>
                <input value={pub.organizer} onChange={e => set(i, 'organizer', e.target.value)} className={ic} placeholder="e.g. IEEE, ACM" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Year <span className="text-red-500">*</span></label>
                <input value={pub.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic} maxLength={4} placeholder="YYYY" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Pages</label>
                <input value={pub.pages} onChange={e => set(i, 'pages', e.target.value)} className={ic} placeholder="e.g. 1-15 or NA" />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addRow} 
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 group bg-white/50"
        >
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span> 
          Add Another Conference Paper
        </button>
      </div>
    </SectionLayout>
  );
};

export default ConferencePublications;
