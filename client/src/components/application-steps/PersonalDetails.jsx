import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const PersonalDetails = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [localData, setLocalData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    phone: '',
    address: ''
  });

  // Sync with global state on mount
  useEffect(() => {
    if (formData?.personalDetails) {
      setLocalData(prev => ({ ...prev, ...formData.personalDetails }));
    }
  }, [formData?.personalDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    updateSection('personalDetails', localData);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Personal Details" 
      subtitle="Please provide your basic contact information."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input 
            type="text" 
            name="fullName"
            value={localData.fullName || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
            placeholder="Dr. John Doe" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email Address</label>
          <input 
            type="email" 
            name="email"
            value={localData.email || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
            placeholder="john.doe@example.com" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date of Birth</label>
          <input 
            type="date" 
            name="dateOfBirth"
            value={localData.dateOfBirth || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <input 
            type="tel" 
            name="phone"
            value={localData.phone || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
            placeholder="+91 98765 43210" 
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700">Address</label>
          <textarea 
            name="address"
            value={localData.address || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-24" 
            placeholder="Permanent Address"
          ></textarea>
        </div>
      </div>
    </SectionLayout>
  );
};

export default PersonalDetails;
