import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const BOOK_TYPES = ['Book', 'Monograph', 'Book Chapter'];

const EMPTY_ROW = {
  type: '',
  title: '',
  authors: '',
  year: '',
  publisher: ''
};

const BooksPublications = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const saved = formData?.booksPublications;
    setTimeout(() => {
      if (saved && Array.isArray(saved) && saved.length) {
        setList(saved);
      } else if (list.length === 0) {
        setList([{ ...EMPTY_ROW }]);
      }
    }, 0);
  }, [formData?.booksPublications, list.length]);

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

    const activeRows = list.map((e, index) => ({ e, index }))
      .filter(({ e }) => e.type || e.title?.trim() || e.publisher?.trim() || e.authors?.trim());

    activeRows.forEach(({ e, index }) => {
      if (!e.type) { newErrors[index].type = 'Required'; hasError = true; }
      if (!e.title?.trim() || e.title.trim().length < 3) { newErrors[index].title = 'Required (Min 3 chars)'; hasError = true; }
      if (!e.authors?.trim() || e.authors.trim().length < 2) { newErrors[index].authors = 'Required (Min 2 chars)'; hasError = true; }
      if (!e.publisher?.trim() || e.publisher.trim().length < 2) { newErrors[index].publisher = 'Required (Min 2 chars)'; hasError = true; }

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

    const filled = list.filter(e => e.type || e.title?.trim() || e.publisher?.trim() || e.authors?.trim());

    try {
      const saved = await updateSection('booksPublications', filled);
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

  const ic = (i, field) => `w-full px-3 py-2.5 rounded-xl border ${errors[i]?.[field] ? 'border-red-400 bg-red-50/30 text-red-900 placeholder-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/5 focus:border-primary bg-white text-gray-900'} focus:ring-4 outline-none text-sm transition-all`;
  const errText = (i, field) => errors[i]?.[field] ? <p className="text-xs text-red-500 mt-1 font-bold tracking-wide">{errors[i][field]}</p> : null;

  return (
    <SectionLayout
      title="Books & Monographs"
      subtitle="Details of Books, Monographs, and Book Chapters published. Leave empty if none."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-8">
        {list.map((book, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-in space-y-5">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                Book Entry
              </h3>
              <button
                onClick={() => removeRow(i)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1 md:col-span-2 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.type ? 'text-red-500' : 'text-gray-400'}`}>Type <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {BOOK_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        set(i, 'type', t);
                        const newErrors = [...errors];
                        if (newErrors[i]) {
                          newErrors[i].type = '';
                          setErrors(newErrors);
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${book.type === t
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : (errors[i]?.type ? 'bg-red-50 text-red-600 border-red-300 hover:border-red-400' : 'bg-white text-gray-500 border-gray-100 hover:border-primary/30')
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {errText(i, 'type')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.year ? 'text-red-500' : 'text-gray-400'}`}>Year <span className="text-red-500">*</span></label>
                <input value={book.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic(i, 'year')} maxLength={4} placeholder="YYYY" />
                {errText(i, 'year')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.publisher ? 'text-red-500' : 'text-gray-400'}`}>Publisher <span className="text-red-500">*</span></label>
                <input value={book.publisher} onChange={e => set(i, 'publisher', e.target.value)} className={ic(i, 'publisher')} placeholder="Name of publisher" />
                {errText(i, 'publisher')}
              </div>
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.title ? 'text-red-500' : 'text-gray-400'}`}>Title <span className="text-red-500">*</span></label>
              <input value={book.title} onChange={e => set(i, 'title', e.target.value)} className={ic(i, 'title')} placeholder="Full title of the publication" />
              {errText(i, 'title')}
            </div>

            <div className="space-y-1 block">
              <label className={`text-xs font-bold uppercase tracking-widest ${errors[i]?.authors ? 'text-red-500' : 'text-gray-400'}`}>Authors <span className="text-red-500">*</span></label>
              <input value={book.authors} onChange={e => set(i, 'authors', e.target.value)} className={ic(i, 'authors')} placeholder="All authors as listed in the publication" />
              {errText(i, 'authors')}
            </div>
          </div>
        ))}

        <button
          onClick={addRow}
          className="w-full py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 bg-gray-50/30 hover:bg-primary/5 group"
        >
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
          Add Another Book or Monograph
        </button>
      </div>
    </SectionLayout>
  );
};

export default BooksPublications;
