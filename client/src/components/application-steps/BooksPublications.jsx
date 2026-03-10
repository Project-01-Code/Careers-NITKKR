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

  useEffect(() => {
    const saved = formData?.booksPublications;
    if (saved && Array.isArray(saved) && saved.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setList(saved);
    } else {
      setList([{ ...EMPTY_ROW }]);
    }
  }, [formData?.booksPublications]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.title?.trim() || e.publisher?.trim());
    
    const bad = filled.some(e => 
      !e.type || 
      !e.title?.trim() || 
      !e.authors?.trim() || 
      !e.year?.trim() || 
      !e.publisher?.trim()
    );

    if (bad) { 
      toast.error('Please complete all required fields for started book entries'); 
      return; 
    }

    if (filled.some(e => !/^\d{4}$/.test(e.year))) { 
      toast.error('Year must be YYYY'); 
      return; 
    }

    const saved = await updateSection('booksPublications', filled);
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none bg-white text-sm transition-all';

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
                Book Entry #{i + 1}
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
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {BOOK_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set(i, 'type', t)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        book.type === t 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                        : 'bg-white text-gray-500 border-gray-100 hover:border-primary/30'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Year <span className="text-red-500">*</span></label>
                <input value={book.year} onChange={e => set(i, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic} maxLength={4} placeholder="YYYY" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Publisher <span className="text-red-500">*</span></label>
                <input value={book.publisher} onChange={e => set(i, 'publisher', e.target.value)} className={ic} placeholder="Name of publisher" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title <span className="text-red-500">*</span></label>
              <input value={book.title} onChange={e => set(i, 'title', e.target.value)} className={ic} placeholder="Full title of the publication" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authors <span className="text-red-500">*</span></label>
              <input value={book.authors} onChange={e => set(i, 'authors', e.target.value)} className={ic} placeholder="All authors as listed in the publication" />
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
