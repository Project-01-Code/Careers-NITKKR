import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const CreditPoints = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [credits, setCredits] = useState({
    researchPublications: 0,
    projects: 0,
    patents: 0,
    phdGuidance: 0,
    books: 0,
    outreach: 0
  });

  useEffect(() => {
    if (formData?.creditPoints) {
      setCredits(prev => ({ ...prev, ...formData.creditPoints }));
    }
  }, [formData?.creditPoints]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow empty string for clearing input, otherwise parse float
    const numValue = value === '' ? '' : parseFloat(value) || 0;
    setCredits(prev => ({ ...prev, [name]: numValue }));
  };

  const calculateTotal = () => {
    return Object.values(credits).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  const handleNext = () => {
    updateSection('creditPoints', { ...credits, total: calculateTotal() });
    if (onNext) onNext();
  };

  const fields = [
    { name: 'researchPublications', label: 'Research Publications (Journals/Conferences)', hint: 'Refer to Annexure for calculation details' },
    { name: 'projects', label: 'Sponsored Projects / Consultancy', hint: 'Points per Lakh or per project' },
    { name: 'patents', label: 'Patents Granted / Published', hint: '' },
    { name: 'phdGuidance', label: 'PhD / PG Guidance', hint: 'Points per candidate awarded/submitted' },
    { name: 'books', label: 'Books / Book Chapters Published', hint: 'Authored/Edited' },
    { name: 'outreach', label: 'Outreach & Misc. Activities', hint: 'Workshops organized, FDPs, administrative roles' },
  ];

  return (
    <SectionLayout 
      title="Credit Point Calculation" 
      subtitle="Self-assessment of credit points as per NIT statutes matrix."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Important:</strong> Please ensure your calculation strictly adheres to the scoring matrix provided in the official advertisement. You will be required to upload proof for every claimed point in the documents section.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {fields.map((field, idx) => (
            <div key={field.name} className={`flex flex-col md:flex-row md:items-center p-5 ${idx !== fields.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex-grow mb-3 md:mb-0 md:pr-6">
                <h4 className="font-semibold text-gray-800">{field.label}</h4>
                {field.hint && <p className="text-xs text-gray-500 mt-1.5">{field.hint}</p>}
              </div>
              <div className="w-full md:w-32 flex-shrink-0 relative">
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  name={field.name}
                  value={credits[field.name]}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-right font-medium text-lg text-secondary placeholder:text-gray-300 transition-all"
                  placeholder="0.0"
                />
              </div>
            </div>
          ))}

          {/* Total Row */}
          <div className="p-5 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-lg uppercase tracking-wider">Total Credit Points</h4>
              <p className="text-xs text-gray-500 mt-1">Sum of all categories above</p>
            </div>
            <div className="mt-3 md:mt-0 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 text-white font-bold text-2xl min-w-[120px] text-center border-2 border-white/20">
              {calculateTotal().toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};

export default CreditPoints;
