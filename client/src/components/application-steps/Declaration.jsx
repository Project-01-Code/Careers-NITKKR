import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../hooks/useApplication';
import toast from 'react-hot-toast';

const Declaration = ({ onNext, onBack, isReadOnly }) => {
  const { formData, updateSection } = useApplication();
  const [d, setD] = useState({
    declareInfoTrue: false,
    agreeToTerms: false,
    photoUploaded: false,
    detailsVerified: false,
  });

  useEffect(() => {
    if (formData?.declaration && typeof formData.declaration === 'object') {
      setTimeout(() => {
        setD(prev => ({ ...prev, ...formData.declaration }));
      }, 0);
    }
  }, [formData?.declaration]);

  const toggle = (field) => {
    if (isReadOnly) return;
    setD(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleNext = async () => {
    if (isReadOnly) {
       if (onNext) onNext();
       return;
    }
    if (!d.declareInfoTrue) { toast.error('You must declare that the information is true'); return; }
    if (!d.agreeToTerms) { toast.error('You must agree to the terms and conditions'); return; }
    if (!d.photoUploaded) { toast.error('Please confirm that you have uploaded your photograph'); return; }
    if (!d.detailsVerified) { toast.error('Please verify all details before proceeding'); return; }

    try {
      const saved = await updateSection('declaration', d);
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

  const checkItem = (field, label) => (
    <div className={`border rounded-lg p-4 flex items-start gap-3 transition-colors ${isReadOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50 cursor-pointer'}`} onClick={() => toggle(field)}>
      <input
        type="checkbox"
        checked={d[field]}
        onChange={() => toggle(field)}
        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
        disabled={isReadOnly}
      />
      <span className={`text-sm font-medium leading-relaxed select-none ${isReadOnly ? 'text-gray-400 cursor-not-allowed' : 'text-blue-900 cursor-pointer'}`}>{label}</span>
    </div>
  );

  return (
    <SectionLayout title="Declaration" subtitle="Read carefully and confirm all checkboxes before final review." onNext={handleNext} onBack={onBack} hideNext={isReadOnly}>
      <div className="space-y-6">
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
              I also declare that I have not concealed any material information which may debar my candidature for the post applied for. In the event of suppression or distortion of any fact including category, age or educational qualification, etc. made in my application form, I understand that I will be denied any employment in the Institute and if already employed, my services will be terminated forthwith.
            </p>
          </div>

          <div className="space-y-3">
            {checkItem('declareInfoTrue', 'I declare that all the information provided in this application is true, complete, and correct to the best of my knowledge.')}
            {checkItem('agreeToTerms', 'I agree to the terms and conditions of NIT Kurukshetra recruitment process.')}
            {checkItem('photoUploaded', 'I confirm that I have uploaded my passport-size photograph as required.')}
            {checkItem('detailsVerified', 'I have verified all the details entered in this application and they are final.')}
          </div>

          {!isReadOnly && (!d.declareInfoTrue || !d.agreeToTerms || !d.photoUploaded || !d.detailsVerified) && (
            <p className="text-center text-sm text-amber-600 font-medium mt-6">
              ⚠ All 4 checkboxes must be checked to proceed.
            </p>
          )}
        </div>
      </div>
    </SectionLayout>
  );
};

export default Declaration;
