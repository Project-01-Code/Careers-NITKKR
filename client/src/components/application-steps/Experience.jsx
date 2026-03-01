import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const Experience = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [experienceList, setExperienceList] = useState([]);

  useEffect(() => {
    if (formData?.experience && formData.experience.length > 0) {
      setExperienceList(formData.experience);
    } else {
      setExperienceList([{ designation: '', organization: '', fromDate: '', toDate: '' }]);
    }
  }, [formData?.experience]);

  const handleChange = (index, field, value) => {
    const updatedList = [...experienceList];
    updatedList[index][field] = value;
    setExperienceList(updatedList);
  };

  const addRow = () => {
    setExperienceList([...experienceList, { designation: '', organization: '', fromDate: '', toDate: '' }]);
  };

  const removeRow = (index) => {
    const updatedList = experienceList.filter((_, i) => i !== index);
    setExperienceList(updatedList);
  };

  const handleNext = () => {
    updateSection('experience', experienceList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Work Experience" 
      subtitle="Please list your experience in reverse chronological order (most recent first)."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {experienceList.map((exp, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Experience #{index + 1}
              {experienceList.length > 1 && (
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
                <div className="text-xs font-semibold text-gray-500 uppercase">Designation</div>
                <input 
                  type="text" 
                  value={exp.designation || ''}
                  onChange={(e) => handleChange(index, 'designation', e.target.value)}
                  placeholder="e.g. Assistant Professor"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Organization</div>
                <input 
                  type="text" 
                  value={exp.organization || ''}
                  onChange={(e) => handleChange(index, 'organization', e.target.value)}
                  placeholder="Institute/Company Name"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">From Date</div>
                <input 
                  type="date" 
                  value={exp.fromDate || ''}
                  onChange={(e) => handleChange(index, 'fromDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">To Date (Leave blank if current)</div>
                <input 
                  type="date" 
                  value={exp.toDate || ''}
                  onChange={(e) => handleChange(index, 'toDate', e.target.value)}
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
          <span className="material-symbols-outlined">add_circle</span> Add Another Experience
        </button>
      </div>
    </SectionLayout>
  );
};

export default Experience;
