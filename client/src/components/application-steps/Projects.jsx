import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const Projects = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [projectList, setProjectList] = useState([]);

  useEffect(() => {
    if (formData?.projects && formData.projects.length > 0) {
      setProjectList(formData.projects);
    } else {
      setProjectList([{ title: '', agency: '', amount: '', status: 'Completed', role: 'PI' }]);
    }
  }, [formData?.projects]);

  const handleChange = (index, field, value) => {
    const updatedList = [...projectList];
    updatedList[index][field] = value;
    setProjectList(updatedList);
  };

  const addRow = () => {
    setProjectList([...projectList, { title: '', agency: '', amount: '', status: 'Completed', role: 'PI' }]);
  };

  const removeRow = (index) => {
    const updatedList = projectList.filter((_, i) => i !== index);
    setProjectList(updatedList);
  };

  const handleNext = () => {
    updateSection('projects', projectList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Sponsored Projects / Consultancy" 
      subtitle="Details of externally funded projects or consultancy work."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {projectList.map((proj, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Project #{index + 1}
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
                <div className="text-xs font-semibold text-gray-500 uppercase">Project Title</div>
                <input 
                  type="text" 
                  value={proj.title || ''}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Funding Agency</div>
                <input 
                  type="text" 
                  value={proj.agency || ''}
                  onChange={(e) => handleChange(index, 'agency', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Amount (in Lakhs)</div>
                <input 
                  type="number" 
                  value={proj.amount || ''}
                  onChange={(e) => handleChange(index, 'amount', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="e.g. 15.5"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Status</div>
                <select 
                  value={proj.status || 'Completed'}
                  onChange={(e) => handleChange(index, 'status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="Completed">Completed</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Role</div>
                <select 
                  value={proj.role || 'PI'}
                  onChange={(e) => handleChange(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="PI">Principal Investigator (PI)</option>
                  <option value="Co-PI">Co-PI</option>
                  <option value="Consultant">Consultant</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> Add Another Project
        </button>
      </div>
    </SectionLayout>
  );
};

export default Projects;
