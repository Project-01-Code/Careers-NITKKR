import React from 'react';
import { motion } from 'framer-motion';

const SectionLayout = ({ 
  title, 
  subtitle, 
  children, 
  onNext, 
  onBack, 
  isNextDisabled = false,
  nextLabel = "Save & Next",
  isSubmit = false
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full"
    >
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-secondary">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>

      <div className="flex-grow">
        {children}
      </div>

      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
        <button
          onClick={onBack}
          disabled={!onBack}
          className={`px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            onBack 
              ? 'text-gray-600 hover:bg-gray-100' 
              : 'text-gray-300 cursor-not-allowed invisible'
          }`}
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>

        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className={`px-8 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg ${
            isNextDisabled
              ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'
              : isSubmit
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5'
                : 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'
          }`}
        >
          {nextLabel}
          {!isSubmit && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default SectionLayout;
