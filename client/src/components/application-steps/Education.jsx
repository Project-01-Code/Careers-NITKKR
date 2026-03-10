import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const EXAM_TYPE = ['Post-Doctoral', 'PhD', 'M.Tech/ME/M.Sc', 'B.Tech/BE/B.Sc', 'Intermediate/12th', 'Matriculation/10th'];
const NIRF_RANK_RANGES = ['1-10', '11-25', '26-50', '51-100', '101-150', '151-200', '201+', 'Not Ranked'];

const EMPTY_ROW = { examPassed: '', discipline: '', boardUniversity: '', marks: '', classDivision: '', yearOfPassing: '', nirfRanking: { rank: '', rankingYear: '' } };

const Education = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);

  useEffect(() => {
    const saved = formData?.education;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.items?.length) setList(saved.items);
    else if (Array.isArray(saved) && saved.length) setList(saved);
    else setList([{ ...EMPTY_ROW }]);
  }, [formData?.education]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const setNirf = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], nirfRanking: { ...(upd[i].nirfRanking || {}), [field]: val } };
    setList(upd);
  };

  const addRow = () => setList([...list, { ...EMPTY_ROW }]);
  const removeRow = (i) => setList(list.filter((_, idx) => idx !== i));

  const handleNext = async () => {
    const filled = list.filter(e => e.examPassed || e.discipline?.trim() || e.boardUniversity?.trim());
    if (!filled.length) { toast.error('At least one education entry is required'); return; }
    const bad = filled.some(e => !e.examPassed || !e.discipline?.trim() || !e.boardUniversity?.trim() || !e.marks?.trim() || !e.classDivision?.trim() || !e.yearOfPassing?.trim());
    if (bad) { toast.error('Please complete all required fields in each entry'); return; }
    if (filled.some(e => !/^\d{4}$/.test(e.yearOfPassing))) { toast.error('Year must be in YYYY format'); return; }
    const saved = await updateSection('education', { items: filled });
    if (saved && onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Educational Qualifications" subtitle="Start from your highest degree (Post-Doctoral/PhD) down." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((edu, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Qualification #{i + 1}</h3>
              {list.length > 1 && <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded text-sm flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Remove</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Exam Passed <span className="text-red-500">*</span></label>
                <select value={edu.examPassed} onChange={e => set(i, 'examPassed', e.target.value)} className={ic}>
                  <option value="">Select</option>
                  {EXAM_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Discipline / Subject <span className="text-red-500">*</span></label>
                <input value={edu.discipline} onChange={e => set(i, 'discipline', e.target.value)} className={ic} placeholder="e.g. Computer Science" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Board / University <span className="text-red-500">*</span></label>
                <input value={edu.boardUniversity} onChange={e => set(i, 'boardUniversity', e.target.value)} className={ic} placeholder="Institute name" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">CGPA / % <span className="text-red-500">*</span></label>
                <input value={edu.marks} onChange={e => set(i, 'marks', e.target.value)} className={ic} placeholder="e.g. 8.5 or 85%" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Class / Division <span className="text-red-500">*</span></label>
                <input value={edu.classDivision} onChange={e => set(i, 'classDivision', e.target.value)} className={ic} placeholder="e.g. First with Distinction" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Year of Passing <span className="text-red-500">*</span></label>
                <input value={edu.yearOfPassing} onChange={e => set(i, 'yearOfPassing', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic} placeholder="YYYY" maxLength={4} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">NIRF Rank Range (of Institute)</label>
                <select value={edu.nirfRanking?.rank || ''} onChange={e => setNirf(i, 'rank', e.target.value)} className={ic}>
                  <option value="">N/A</option>
                  {NIRF_RANK_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">NIRF Ranking Year</label>
                <input value={edu.nirfRanking?.rankingYear || ''} onChange={e => setNirf(i, 'rankingYear', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic} placeholder="YYYY" maxLength={4} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Add Qualification
        </button>
      </div>
    </SectionLayout>
  );
};

export default Education;
