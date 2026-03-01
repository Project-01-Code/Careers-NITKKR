import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const OrganizedPrograms = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [programList, setProgramList] = useState([]);

  useEffect(() => {
    if (formData?.organizedPrograms && formData.organizedPrograms.length > 0) {
      setProgramList(formData.organizedPrograms);
    } else {
      setProgramList([{ title: '', type: 'Workshop', role: 'Coordinator', durationDays: '', sponsor: '' }]);
    }
  }, [formData?.organizedPrograms]);

  const handleChange = (index, field, value) => {
    const updatedList = [...programList];
    updatedList[index][field] = value;
    setProgramList(updatedList);
  };

  const addRow = () => {
    setProgramList([...programList, { title: '', type: 'Workshop', role: 'Coordinator', durationDays: '', sponsor: '' }]);
  };

  const removeRow = (index) => {
    const updatedList = programList.filter((_, i) => i !== index);
    setProgramList(updatedList);
  };

  const handleNext = () => {
    updateSection('organizedPrograms', programList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Organized Programs" 
      subtitle="Details of Workshops, Seminars, or Conferences organized."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {programList.map((prog, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Program #{index + 1}
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
                <div className="text-xs font-semibold text-gray-500 uppercase">Title of Program</div>
                <input 
                  type="text" 
                  value={prog.title || ''}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Type of Program</div>
                <select 
                  value={prog.type || 'Workshop'}
                  onChange={(e) => handleChange(index, 'type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Seminar">Seminar</option>
                  <option value="FDP">Faculty Development Program (FDP)</option>
                  <option value="Symposium">Symposium</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Role</div>
                <select 
                  value={prog.role || 'Coordinator'}
                  onChange={(e) => handleChange(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="Coordinator">Coordinator</option>
                  <option value="Convener">Convener</option>
                  <option value="Organizing Secretary">Organizing Secretary</option>
                  <option value="Member">Organizing Committee Member</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Duration (Days)</div>
                <input 
                  type="number" 
                  value={prog.durationDays || ''}
                  onChange={(e) => handleChange(index, 'durationDays', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="e.g. 5"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Sponsor / Funding Agency</div>
                <input 
                  type="text" 
                  value={prog.sponsor || ''}
                  onChange={(e) => handleChange(index, 'sponsor', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="Leave empty if self-sponsored"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> Add Another Program
        </button>
      </div>
    </SectionLayout>
  );
};

export default OrganizedPrograms;
