import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const Referees = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [refereeList, setRefereeList] = useState([]);

  useEffect(() => {
    if (formData?.referees && formData.referees.length > 0) {
      setRefereeList(formData.referees);
    } else {
      setRefereeList([{ name: '', designation: '', organization: '', email: '', phone: '' }]);
    }
  }, [formData?.referees]);

  const handleChange = (index, field, value) => {
    const updatedList = [...refereeList];
    updatedList[index][field] = value;
    setRefereeList(updatedList);
  };

  const addRow = () => {
    setRefereeList([...refereeList, { name: '', designation: '', organization: '', email: '', phone: '' }]);
  };

  const removeRow = (index) => {
    const updatedList = refereeList.filter((_, i) => i !== index);
    setRefereeList(updatedList);
  };

  const handleNext = () => {
    updateSection('referees', refereeList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Referees" 
      subtitle="Provide details of at least two referees who are familiar with your academic and professional work."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {refereeList.map((ref, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Referee #{index + 1}
              {refereeList.length > 1 && (
                <button 
                  onClick={() => removeRow(index)}
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Remove
                </button>
              )}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Full Name</div>
                <input 
                  type="text" 
                  value={ref.name || ''}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  placeholder="e.g. Dr. Reviewer Name"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Designation</div>
                <input 
                  type="text" 
                  value={ref.designation || ''}
                  onChange={(e) => handleChange(index, 'designation', e.target.value)}
                  placeholder="e.g. Professor"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Organization</div>
                <input 
                  type="text" 
                  value={ref.organization || ''}
                  onChange={(e) => handleChange(index, 'organization', e.target.value)}
                  placeholder="Institute/Company Name"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Email Address</div>
                <input 
                  type="email" 
                  value={ref.email || ''}
                  onChange={(e) => handleChange(index, 'email', e.target.value)}
                  placeholder="referee@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Phone Number</div>
                <input 
                  type="tel" 
                  value={ref.phone || ''}
                  onChange={(e) => handleChange(index, 'phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">person_add</span> Add Another Referee
        </button>
      </div>
    </SectionLayout>
  );
};

export default Referees;
