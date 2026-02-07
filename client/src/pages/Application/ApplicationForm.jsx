import React from 'react';

const ApplicationForm = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 pb-4 border-b">Personal Information</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-[#c21717]" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input type="email" className="w-full border-gray-300 rounded-lg p-2.5" placeholder="john@example.com" />
          </div>
          <button type="button" className="col-span-full bg-[#c21717] text-white py-3 rounded-lg font-bold">
            Save & Next
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;