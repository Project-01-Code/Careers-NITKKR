import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const PhdSupervision = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [phdList, setPhdList] = useState([]);

  useEffect(() => {
    if (formData?.phdSupervision && formData.phdSupervision.length > 0) {
      setPhdList(formData.phdSupervision);
    } else {
      setPhdList([{ studentName: '', thesisTitle: '', year: '', status: 'Awarded', role: 'Main Supervisor' }]);
    }
  }, [formData?.phdSupervision]);

  const handleChange = (index, field, value) => {
    const updatedList = [...phdList];
    updatedList[index][field] = value;
    setPhdList(updatedList);
  };

  const addRow = () => {
    setPhdList([...phdList, { studentName: '', thesisTitle: '', year: '', status: 'Awarded', role: 'Main Supervisor' }]);
  };

  const removeRow = (index) => {
    const updatedList = phdList.filter((_, i) => i !== index);
    setPhdList(updatedList);
  };

  const handleNext = () => {
    updateSection('phdSupervision', phdList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="PhD Supervision" 
      subtitle="Details of PhD students supervised."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {phdList.map((phd, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Student #{index + 1}
              <button 
                onClick={() => removeRow(index)}
                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Remove
              </button>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Student Name</div>
                <input 
                  type="text" 
                  value={phd.studentName || ''}
                  onChange={(e) => handleChange(index, 'studentName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Thesis Title</div>
                <input 
                  type="text" 
                  value={phd.thesisTitle || ''}
                  onChange={(e) => handleChange(index, 'thesisTitle', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Registration / Award Year</div>
                <input 
                  type="text" 
                  value={phd.year || ''}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="YYYY"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Status</div>
                <select 
                  value={phd.status || 'Awarded'}
                  onChange={(e) => handleChange(index, 'status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="Awarded">Awarded</option>
                  <option value="Thesis Submitted">Thesis Submitted</option>
                  <option value="Ongoing">Ongoing</option>
                </select>
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Role</div>
                <select 
                  value={phd.role || 'Main Supervisor'}
                  onChange={(e) => handleChange(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="Main Supervisor">Main Supervisor</option>
                  <option value="Co-Supervisor">Co-Supervisor</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> Add Another Student
        </button>
      </div>
    </SectionLayout>
  );
};

export default PhdSupervision;
