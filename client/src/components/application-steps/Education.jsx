import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const Education = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [educationList, setEducationList] = useState([]);

  useEffect(() => {
    if (formData?.education && formData.education.length > 0) {
      setEducationList(formData.education);
    } else {
      // Initialize with one empty row if none exists
      setEducationList([{ degree: '', university: '', year: '', cgpa: '' }]);
    }
  }, [formData?.education]);

  const handleChange = (index, field, value) => {
    const updatedList = [...educationList];
    updatedList[index][field] = value;
    setEducationList(updatedList);
  };

  const addRow = () => {
    setEducationList([...educationList, { degree: '', university: '', year: '', cgpa: '' }]);
  };

  const removeRow = (index) => {
    const updatedList = educationList.filter((_, i) => i !== index);
    setEducationList(updatedList);
  };

  const handleNext = () => {
    updateSection('education', educationList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Educational Qualifications" 
      subtitle="Start from your highest degree (PhD) down to Bachelors."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {educationList.map((edu, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Degree #{index + 1}
              {educationList.length > 1 && (
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
                <label className="text-xs font-medium text-gray-500 uppercase">Degree/Level</label>
                <input 
                  type="text" 
                  value={edu.degree}
                  onChange={(e) => handleChange(index, 'degree', e.target.value)}
                  placeholder="e.g. PhD, M.Tech, B.Tech" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">University/Institute</label>
                <input 
                  type="text" 
                  value={edu.university}
                  onChange={(e) => handleChange(index, 'university', e.target.value)}
                  placeholder="University Name" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Year of Completion</label>
                <input 
                  type="text" 
                  value={edu.year}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                  placeholder="YYYY" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">CGPA / Percentage</label>
                <input 
                  type="text" 
                  value={edu.cgpa}
                  onChange={(e) => handleChange(index, 'cgpa', e.target.value)}
                  placeholder="e.g. 8.5 or 85%" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" 
                />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Another Degree
        </button>
      </div>
    </SectionLayout>
  );
};

export default Education;
