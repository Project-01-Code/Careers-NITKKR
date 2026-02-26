import React from 'react';

const Education = ({ onNext, onBack }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-secondary mb-6">Educational Qualifications</h2>
      
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-4">PhD Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="University/Institute" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 outline-none" />
          <input type="text" placeholder="Year of Completion" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 outline-none" />
          <input type="text" placeholder="Specialization" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 outline-none md:col-span-2" />
        </div>
      </div>

       <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-4">Masters (M.Tech/M.Sc)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="University/Institute" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 outline-none" />
          <input type="text" placeholder="CGPA / Percentage" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
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

export default Education;
