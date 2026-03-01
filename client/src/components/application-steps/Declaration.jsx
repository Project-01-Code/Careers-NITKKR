import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const Declaration = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [agreed, setAgreed] = useState(false);
  const [place, setPlace] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (formData?.declaration) {
      setAgreed(formData.declaration.agreed || false);
      setPlace(formData.declaration.place || '');
      // Keep today's date if not set previously
    }
  }, [formData?.declaration]);

  const handleNext = () => {
    if (!agreed) return; // Prevent next if not agreed (can also be handled via validation)
    updateSection('declaration', { agreed, place, date });
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Declaration" 
      subtitle="Please read the declaration carefully before proceeding to final review."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
            Applicant's Declaration
          </h3>
          
          <div className="prose prose-sm text-gray-600 space-y-4 mb-8">
            <p className="leading-relaxed">
              I hereby declare that I have carefully read and fully understood all the instructions and details pertaining to the post being applied by me and all statements made and information furnished in this application are true and complete to the best of my knowledge and belief.
            </p>
            <p className="leading-relaxed">
              I also declare that I have not concealed any material information which may debar my candidature for the post applied for. In the event of suppression or distortion of any fact including category, age or educational qualification, etc. made in my application form, I understand that I will be denied any employment in the Institute and if already employed on any of the posts in the Institute, my services will be terminated forthwith.
            </p>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5 flex items-start gap-4 hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => setAgreed(!agreed)}>
            <div className="pt-1">
              <input 
                type="checkbox" 
                id="agree" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </div>
            <label htmlFor="agree" className="text-sm font-medium text-blue-900 cursor-pointer select-none leading-relaxed">
              I agree to the declaration stated above and confirm that all uploaded documents are authentic and final.
            </label>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Place</label>
              <input 
                type="text" 
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="City Name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Date</label>
              <input 
                type="date" 
                value={date}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed outline-none" 
              />
            </div>
          </div>
        </div>

        {!agreed && (
          <p className="text-center text-sm text-red-500 font-medium animate-pulse">
            You must agree to the declaration to proceed.
          </p>
        )}
      </div>
    </SectionLayout>
  );
};

export default Declaration;
