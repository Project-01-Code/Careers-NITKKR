import React from 'react';
import { Link } from 'react-router-dom';

const JobDetails = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="text-[#c21717] font-bold text-sm tracking-widest uppercase">Department of CSE</span>
        <h1 className="text-4xl font-bold mt-2">Assistant Professor Grade-II</h1>
      </div>
      
      <div className="prose max-w-none mb-10 text-gray-600">
        <h3 className="text-xl font-bold text-black">Essential Qualifications</h3>
        <p>Ph.D. in Computer Science & Engineering or equivalent discipline with a very good academic record.</p>
      </div>

      <Link to="/apply" className="bg-[#c21717] text-white px-10 py-4 rounded-lg font-bold shadow-lg inline-block">
        Apply for this Position
      </Link>
    </div>
  );
};

export default JobDetails;