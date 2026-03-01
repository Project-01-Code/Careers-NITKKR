import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const Patents = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [patentList, setPatentList] = useState([]);

  useEffect(() => {
    if (formData?.patents && formData.patents.length > 0) {
      setPatentList(formData.patents);
    } else {
      setPatentList([{ title: '', status: 'Granted', year: '', applicationNo: '' }]);
    }
  }, [formData?.patents]);

  const handleChange = (index, field, value) => {
    const updatedList = [...patentList];
    updatedList[index][field] = value;
    setPatentList(updatedList);
  };

  const addRow = () => {
    setPatentList([...patentList, { title: '', status: 'Granted', year: '', applicationNo: '' }]);
  };

  const removeRow = (index) => {
    const updatedList = patentList.filter((_, i) => i !== index);
    setPatentList(updatedList);
  };

  const handleNext = () => {
    updateSection('patents', patentList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Patents" 
      subtitle="Details of patents granted or published."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {patentList.map((pat, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Patent #{index + 1}
              <button 
                onClick={() => removeRow(index)}
                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Remove
              </button>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Title of Patent</div>
                <input 
                  type="text" 
                  value={pat.title || ''}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="Patent Title"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Status</div>
                <select 
                  value={pat.status || 'Granted'}
                  onChange={(e) => handleChange(index, 'status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="Granted">Granted</option>
                  <option value="Published">Published</option>
                  <option value="Filed">Filed</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Application / Patent No.</div>
                <input 
                  type="text" 
                  value={pat.applicationNo || ''}
                  onChange={(e) => handleChange(index, 'applicationNo', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Year</div>
                <input 
                  type="text" 
                  value={pat.year || ''}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                  placeholder="YYYY"
                  className="w-full md:w-1/2 px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> Add Another Patent
        </button>
      </div>
    </SectionLayout>
  );
};

export default Patents;
