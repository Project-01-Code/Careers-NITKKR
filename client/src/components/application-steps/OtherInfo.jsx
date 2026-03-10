import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';

const OtherInfo = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [info, setInfo] = useState({
    strength: '',
    weakness: '',
    visionForHigherEd: '',
    topThreePriorities: '',
    preferredSubjects: [],
    labInnovations: [],
    otherInfo: '',
  });

  useEffect(() => {
    if (formData?.otherInfo && typeof formData.otherInfo === 'object') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInfo(prev => ({ ...prev, ...formData.otherInfo }));
    }
  }, [formData?.otherInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayField = (field, idx, val) => {
    const arr = [...(info[field] || [])];
    arr[idx] = val;
    setInfo(prev => ({ ...prev, [field]: arr }));
  };

  const addArrayItem = (field) => {
    const max = field === 'preferredSubjects' ? 5 : 2;
    if ((info[field] || []).length < max) {
      setInfo(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
    }
  };

  const handleNext = async () => {
    // Clean empty strings from arrays
    // eslint-disable-next-line no-unused-vars
    const clean = {
      ...info,
      preferredSubjects: (info.preferredSubjects || []).filter(s => s.trim()),
      labInnovations: (info.labInnovations || []).filter(s => s.trim()),
    };
    const saved = await updateSection();
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

  return (
    <SectionLayout title="Other Information" subtitle="All fields are optional." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">thumb_up</span>
              Strengths
            </label>
            <textarea name="strength" value={info.strength || ''} onChange={handleChange} placeholder="Describe your key strengths..." className={`${ic} h-24`} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">thumb_down</span>
              Weaknesses
            </label>
            <textarea name="weakness" value={info.weakness || ''} onChange={handleChange} placeholder="Describe areas for improvement..." className={`${ic} h-24`} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">visibility</span>
              Vision for Higher Education
            </label>
            <textarea name="visionForHigherEd" value={info.visionForHigherEd || ''} onChange={handleChange} placeholder="Your vision..." className={`${ic} h-28`} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">priority_high</span>
              Top 3 Priorities if Selected
            </label>
            <textarea name="topThreePriorities" value={info.topThreePriorities || ''} onChange={handleChange} placeholder="List your top 3 priorities..." className={`${ic} h-24`} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Preferred Subjects to Teach (max 5)</label>
            {(info.preferredSubjects || []).map((s, i) => (
              <input key={i} value={s} onChange={e => handleArrayField('preferredSubjects', i, e.target.value)} className={ic} placeholder={`Subject ${i + 1}`} />
            ))}
            {(info.preferredSubjects || []).length < 5 && (
              <button type="button" onClick={() => addArrayItem('preferredSubjects')} className="text-primary text-sm hover:underline">+ Add Subject</button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Lab Innovations (max 2)</label>
            {(info.labInnovations || []).map((s, i) => (
              <input key={i} value={s} onChange={e => handleArrayField('labInnovations', i, e.target.value)} className={ic} placeholder={`Innovation ${i + 1}`} />
            ))}
            {(info.labInnovations || []).length < 2 && (
              <button type="button" onClick={() => addArrayItem('labInnovations')} className="text-primary text-sm hover:underline">+ Add Innovation</button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">info</span>
              Any Other Information
            </label>
            <textarea name="otherInfo" value={info.otherInfo || ''} onChange={handleChange} placeholder="Any additional information..." className={`${ic} h-24`} />
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};

export default OtherInfo;
