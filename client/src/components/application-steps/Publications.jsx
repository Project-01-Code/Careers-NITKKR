import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const Publications = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [publicationList, setPublicationList] = useState([]);

  useEffect(() => {
    if (formData?.publications && formData.publications.length > 0) {
      setPublicationList(formData.publications);
    } else {
      setPublicationList([{ type: 'Journal', title: '', publisher: '', year: '', role: 'Author', link: '' }]);
    }
  }, [formData?.publications]);

  const handleChange = (index, field, value) => {
    const updatedList = [...publicationList];
    updatedList[index][field] = value;
    setPublicationList(updatedList);
  };

  const addRow = () => {
    setPublicationList([...publicationList, { type: 'Journal', title: '', publisher: '', year: '', role: 'Author', link: '' }]);
  };

  const removeRow = (index) => {
    const updatedList = publicationList.filter((_, i) => i !== index);
    setPublicationList(updatedList);
  };

  const handleNext = () => {
    updateSection('publications', publicationList);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Publications" 
      subtitle="Enter details of your published Journals, Books, or Conference Proceedings."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        {publicationList.map((pub, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative group">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              Publication #{index + 1}
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
                <div className="text-xs font-semibold text-gray-500 uppercase">Type</div>
                <select 
                  value={pub.type || 'Journal'}
                  onChange={(e) => handleChange(index, 'type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="Journal">Journal Article</option>
                  <option value="Conference">Conference Paper</option>
                  <option value="Book">Book</option>
                  <option value="Book Chapter">Book Chapter</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Role</div>
                <select 
                  value={pub.role || 'Author'}
                  onChange={(e) => handleChange(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                >
                  <option value="First Author">First Author</option>
                  <option value="Corresponding Author">Corresponding Author</option>
                  <option value="Co-Author">Co-Author</option>
                  <option value="Editor">Editor</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Title of Publication</div>
                <input 
                  type="text" 
                  value={pub.title || ''}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Publisher / Journal Name</div>
                <input 
                  type="text" 
                  value={pub.publisher || ''}
                  onChange={(e) => handleChange(index, 'publisher', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Year</div>
                <input 
                  type="text" 
                  value={pub.year || ''}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                  placeholder="YYYY"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">DOI / Link (Optional)</div>
                <input 
                  type="url" 
                  value={pub.link || ''}
                  onChange={(e) => handleChange(index, 'link', e.target.value)}
                  placeholder="https://doi.org/..."
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
          <span className="material-symbols-outlined">add_circle</span> Add Another Publication
        </button>
      </div>
    </SectionLayout>
  );
};

export default Publications;
