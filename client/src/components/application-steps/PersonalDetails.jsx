import React from 'react';

const PersonalDetails = ({ onNext }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-secondary mb-6">Personal Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Dr. John Doe" />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email Address</label>
          <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="john.doe@example.com" />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date of Birth</label>
          <input type="date" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="+91 98765 43210" />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700">Address</label>
          <textarea className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-24" placeholder="Permanent Address"></textarea>
        </div>
      </div>

      <div className="flex justify-end pt-6">
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

export default PersonalDetails;
