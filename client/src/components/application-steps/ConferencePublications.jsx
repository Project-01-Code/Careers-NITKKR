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
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.conferencePublications;
    setTimeout(() => {
      if (saved && Array.isArray(saved) && saved.length) {
        setList(saved);
      } else if (list.length === 0) {
        setList([{ ...EMPTY_ROW }]);
      }
    }, 0);
  }, [formData?.conferencePublications, list.length]);

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
      .filter(({ e }) => e.conferenceType || e.paperTitle?.trim() || e.conferenceName?.trim() || e.authors?.trim() || e.organizer?.trim());

    activeRows.forEach(({ e, index }) => {
      if (!e.conferenceType) { newErrors[index].conferenceType = 'Required'; hasError = true; }
      if (!e.paperTitle?.trim() || e.paperTitle.trim().length < 5) { newErrors[index].paperTitle = 'Required (Min 5 chars)'; hasError = true; }
      if (!e.authors?.trim() || e.authors.trim().length < 2) { newErrors[index].authors = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.conferenceName?.trim() || e.conferenceName.trim().length < 2) { newErrors[index].conferenceName = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.organizer?.trim()) { newErrors[index].organizer = 'Required'; hasError = true; }

      if (!e.year?.trim()) {
        newErrors[index].year = 'Required'; hasError = true;
      } else if (!/^\d{4}$/.test(e.year)) {
        newErrors[index].year = 'Must be YYYY'; hasError = true;
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

    const filled = list.filter(e => e.conferenceType || e.paperTitle?.trim() || e.conferenceName?.trim() || e.authors?.trim() || e.organizer?.trim());

    try {
      const saved = await updateSection('conferencePublications', filled);
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
                Conference Paper
              </h3>
              <button
                onClick={() => removeRow(i)}
                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-red-100 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.conferenceType ? 'text-red-500' : 'text-gray-500'}`}>Conference Type <span className="text-red-500">*</span></label>
                <select value={pub.conferenceType} onChange={e => set(i, 'conferenceType', e.target.value)} className={ic(i, 'conferenceType')}>
                  <option value="">Select Category</option>
                  {CONFERENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errText(i, 'conferenceType')}
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 text-sm">
                  <input
                    type="checkbox"
                    checked={pub.isFirstAuthor}
                    onChange={e => set(i, 'isFirstAuthor', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700 font-medium whitespace-nowrap">First / Corresponding Author</span>
                </label>
              </div>
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.paperTitle ? 'text-red-500' : 'text-gray-500'}`}>Paper Title <span className="text-red-500">*</span></label>
              <input value={pub.paperTitle} onChange={e => set(i, 'paperTitle', e.target.value)} className={ic(i, 'paperTitle')} placeholder="Full title of the research paper" />
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
                <label className={`text-xs font-semibold uppercase ${errors[i]?.conferenceName ? 'text-red-500' : 'text-gray-500'}`}>Conference Name <span className="text-red-500">*</span></label>
                <input value={pub.conferenceName} onChange={e => set(i, 'conferenceName', e.target.value)} className={ic(i, 'conferenceName')} placeholder="Full name of the conference" />
                {errText(i, 'conferenceName')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.organizer ? 'text-red-500' : 'text-gray-500'}`}>Organizer <span className="text-red-500">*</span></label>
                <input value={pub.organizer} onChange={e => set(i, 'organizer', e.target.value)} className={ic(i, 'organizer')} placeholder="e.g. IEEE, ACM" />
                {errText(i, 'organizer')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.year ? 'text-red-500' : 'text-gray-500'}`}>Year <span className="text-red-500">*</span></label>
                <input value={pub.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic(i, 'year')} maxLength={4} placeholder="YYYY" />
                {errText(i, 'year')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.pages ? 'text-red-500' : 'text-gray-500'}`}>Pages</label>
                <input value={pub.pages} onChange={e => set(i, 'pages', e.target.value)} className={ic(i, 'pages')} placeholder="e.g. 1-15 or NA" />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addRow}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 group bg-white/50"
        >
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
          Add Another Conference Paper
        </button>
      </div>
    </SectionLayout>
  );
};

export default ConferencePublications;
