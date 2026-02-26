import React from 'react';

const Experience = ({ onNext, onBack }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-secondary mb-6">Work Experience</h2>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
        <p className="text-sm text-blue-800">Please list your experience in reverse chronological order (most recent first).</p>
      </div>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Designation</div>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Organization</div>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">From</div>
                <input type="date" className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">To</div>
                <input type="date" className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
          </div>
        ))}
        
        <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add</span> Add More Experience
        </button>
      </div>

      <div className="flex justify-between pt-6">
        <button 
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium px-6 py-2 transition-colors"
        >
          Back
        </button>
        <button 
          onClick={onNext}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
        >
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default Experience;
