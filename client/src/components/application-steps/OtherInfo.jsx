import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const OtherInfo = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [info, setInfo] = useState({
    awards: '',
    professionalBodies: '',
    administrativeRoles: '',
    statementOfPurpose: ''
  });

  useEffect(() => {
    if (formData?.otherInfo) {
      setInfo(prev => ({ ...prev, ...formData.otherInfo }));
    }
  }, [formData?.otherInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    updateSection('otherInfo', info);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Other Information" 
      subtitle="Provide details on awards, memberships, and a brief SOP."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">social_leaderboard</span>
                Awards, Honors & Fellowships
              </label>
              <textarea 
                name="awards"
                value={info.awards || ''}
                onChange={handleChange}
                placeholder="List major awards received, year, and awarding body..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-28"
              />
              <p className="text-xs text-gray-500">Provide a bulleted list or concise paragraph.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
                Membership of Professional Bodies
              </label>
              <textarea 
                name="professionalBodies"
                value={info.professionalBodies || ''}
                onChange={handleChange}
                placeholder="e.g. Senior Member IEEE, Member ACM..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-28"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
                Administrative Responsibilities Shared
              </label>
              <textarea 
                name="administrativeRoles"
                value={info.administrativeRoles || ''}
                onChange={handleChange}
                placeholder="e.g. Head of Department, Warden, Committee Chair..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-28"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">history_edu</span>
                Statement of Purpose / Vision Statement
              </label>
              <textarea 
                name="statementOfPurpose"
                value={info.statementOfPurpose || ''}
                onChange={handleChange}
                placeholder="Briefly describe your research vision and how you plan to contribute to the institute..."
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-40"
              />
              <p className="text-xs text-gray-500 flex justify-between">
                <span>Max 500 words recommended.</span>
                <span className={`${info.statementOfPurpose?.split(/\s+/).filter(w => w.length > 0).length > 500 ? 'text-red-500' : 'text-primary'}`}>
                  Words: {info.statementOfPurpose?.split(/\s+/).filter(w => w.length > 0).length || 0}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};

export default OtherInfo;
