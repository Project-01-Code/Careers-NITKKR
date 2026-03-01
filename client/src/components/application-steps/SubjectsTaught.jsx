import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const SubjectsTaught = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [subjectsList, setSubjectsList] = useState([]);

  useEffect(() => {
    if (formData?.subjectsTaught && formData.subjectsTaught.length > 0) {
      setSubjectsList(formData.subjectsTaught);
    } else {
      setSubjectsList([{ courseName: '', level: 'UG', institute: '', years: '' }]);
    }
  }, [formData?.subjectsTaught]);

  const handleChange = (index, field, value) => {
    const updatedList = [...subjectsList];
    updatedList[index][field] = value;
    setSubjectsList(updatedList);
  };

  const addRow = () => {
    setSubjectsList([...subjectsList, { courseName: '', level: 'UG', institute: '', years: '' }]);
  };

  const removeRow = (index) => {
    const updatedList = subjectsList.filter((_, i) => i !== index);
    setSubjectsList(updatedList);
  };

  const handleNext = () => {
    updateSection('subjectsTaught', subjectsList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Subjects Taught" 
      subtitle="Details of UG/PG level courses taught."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Subject / Course Name</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-32">Level</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Institute</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-32">No. of Years</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {subjectsList.map((sub, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={sub.courseName || ''}
                      onChange={(e) => handleChange(index, 'courseName', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-gray-200 focus:border-primary outline-none" 
                      placeholder="Course Name"
                    />
                  </td>
                  <td className="p-3">
                    <select 
                      value={sub.level || 'UG'}
                      onChange={(e) => handleChange(index, 'level', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-gray-200 focus:border-primary outline-none" 
                    >
                      <option value="UG">UG</option>
                      <option value="PG">PG</option>
                      <option value="Both">Both</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={sub.institute || ''}
                      onChange={(e) => handleChange(index, 'institute', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-gray-200 focus:border-primary outline-none" 
                      placeholder="Institute"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="number" 
                      value={sub.years || ''}
                      onChange={(e) => handleChange(index, 'years', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-gray-200 focus:border-primary outline-none" 
                      placeholder="Years"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => removeRow(index)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button 
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add</span> Add Subject
        </button>
      </div>
    </SectionLayout>
  );
};

export default SubjectsTaught;
