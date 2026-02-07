import React from 'react';
import { Link } from 'react-router-dom';

const JobListings = () => {
  const jobs = [
    { id: '1', title: 'Assistant Professor Grade-II', dept: 'Computer Science', deadline: 'Oct 15' },
    // You can add more job objects here later
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-8">Current Vacancies</h2>
      <div className="grid gap-6">
        {jobs.map(job => (
          <div key={job.id} className="p-6 border border-gray-200 rounded-xl flex justify-between items-center bg-white shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
              <p className="text-gray-500">{job.dept}</p>
            </div>
            <Link to={`/jobs/${job.id}`} className="text-[#c21717] font-bold hover:underline">
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobListings;