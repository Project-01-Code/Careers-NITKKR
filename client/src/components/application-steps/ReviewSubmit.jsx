import React from 'react';
import { Link } from 'react-router-dom';

const ReviewSubmit = ({ onBack }) => {
  return (
    <div className="space-y-8 animate-fade-in text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-secondary mb-2">Application Reviewed</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Please verify all the details before final submission. Once submitted, you cannot edit the application.
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl text-left max-w-xl mx-auto border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" id="declaration" className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" />
          <label htmlFor="declaration" className="text-sm text-gray-700">
            I hereby declare that the information provided is true to the best of my knowledge.
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center max-w-xl mx-auto pt-4">
        <button 
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium px-6 py-2 transition-colors"
        >
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-secondary text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Preview PDF
          </button>
          <Link 
            to="/"
            className="bg-primary hover:bg-primary-dark text-white px-8 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
            onClick={() => alert('Application Submitted Successfully!')}
          >
             Submit Application
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmit;
