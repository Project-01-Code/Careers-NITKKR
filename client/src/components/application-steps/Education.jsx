import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../hooks/useApplication';
import toast from 'react-hot-toast';

const EXAM_TYPE = ['Post-Doctoral', 'PhD', 'M.Tech/ME/M.Sc', 'B.Tech/BE/B.Sc', 'Intermediate/12th', 'Matriculation/10th'];
const NIRF_RANK_RANGES = ['1-10', '11-25', '26-50', '51-100', '101-150', '151-200', '201+', 'Not Ranked'];

const EMPTY_ROW = { examPassed: '', discipline: '', boardUniversity: '', marks: '', classDivision: '', yearOfPassing: '', nirfRanking: { rank: '', rankingYear: '' }, _value: '', _system: 'CGPA (10pt)' };

const Education = ({ onNext, onBack, isReadOnly }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([]);
  const [errors, setErrors] = useState([]);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const saved = formData?.education;
    let data = [];
    if (saved?.items?.length) data = saved.items;
    else if (Array.isArray(saved) && saved.length) data = saved;

    if (data.length) {
      const parsed = data.map(item => {
        let m = item.marks || '';
        let system = 'CGPA (10pt)';
        let val = m;

        if (m.includes('%')) {
          system = 'Percentage (%)';
          val = m.replace('%', '').trim();
        } else if (m.includes('/')) {
          const parts = m.split('/');
          system = parts[1].trim() === '4' ? 'CGPA (4pt)' : 'CGPA (10pt)';
          val = parts[0].trim();
        } else if (parseFloat(m) > 10) {
          system = 'Percentage (%)';
        }
        
        return { ...item, _value: val, _system: system };
      });
      
      setTimeout(() => {
        setList(parsed);
        setInitialized(true);
      }, 0);
    } else if (list.length === 0) {
      setTimeout(() => {
        setList([{ ...EMPTY_ROW }]);
        setInitialized(true);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.education, initialized]);

  const set = (i, field, val) => {
    if (isReadOnly) return;
    setList(prev => {
      const upd = [...prev];
      upd[i] = { ...upd[i], [field]: val };
      return upd;
    });

    // Clear error for this field
    if (errors[i] && errors[i][field]) {
      setErrors(prev => {
        const newErrors = [...prev];
        if (newErrors[i]) {
          newErrors[i] = { ...newErrors[i], [field]: '' };
        }
        return newErrors;
      });
    }
  };

  const setNirf = (i, field, val) => {
    if (isReadOnly) return;
    setList(prev => {
      const upd = [...prev];
      upd[i] = { ...upd[i], nirfRanking: { ...(upd[i].nirfRanking || {}), [field]: val } };
      return upd;
    });

    // Clear error for ranking year
    if (errors[i] && errors[i][field]) {
      setErrors(prev => {
        const newErrors = [...prev];
        if (newErrors[i]) {
          newErrors[i] = { ...newErrors[i], [field]: '' };
        }
        return newErrors;
      });
    }
  };

  const addRow = () => {
    setList([...list, { ...EMPTY_ROW }]);
    setErrors([...errors, {}]);
  };

  const removeRow = (i) => {
    setList(list.filter((_, idx) => idx !== i));
    setErrors(errors.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const newErrors = list.map(() => ({}));
    let hasError = false;

    // Filter out completely empty rows (unless it's the only row and we require at least one)
    const activeRows = list.map((e, index) => ({ e, index }))
      .filter(({ e }) => e.examPassed || e.discipline?.trim() || e.boardUniversity?.trim() || e.marks?.trim() || e.yearOfPassing?.trim());

    if (activeRows.length === 0) {
      toast.error('At least one education entry is required');
      hasError = true;
    }

    // Always validate all rows that have at least one field filled
    activeRows.forEach(({ e, index }) => {
      if (!e.examPassed) { newErrors[index].examPassed = 'Required'; hasError = true; }
      if (!e.discipline?.trim()) { newErrors[index].discipline = 'Required'; hasError = true; }
      if (!e.boardUniversity?.trim()) { newErrors[index].boardUniversity = 'Required'; hasError = true; }
      if (!e._value?.trim()) { newErrors[index]._value = 'Required'; hasError = true; }
      if (!e.classDivision?.trim()) { newErrors[index].classDivision = 'Required'; hasError = true; }
      if (!e.yearOfPassing?.trim()) {
        newErrors[index].yearOfPassing = 'Required'; hasError = true;
      } else if (!/^\d{4}$/.test(e.yearOfPassing)) {
        newErrors[index].yearOfPassing = 'Must be YYYY'; hasError = true;
      }

      const rankYear = e.nirfRanking?.rankingYear;
      if (rankYear && !/^\d{4}$/.test(rankYear)) {
        newErrors[index].rankingYear = 'Must be YYYY'; hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    const filled = list.filter(e => e.examPassed || e.discipline?.trim() || e.boardUniversity?.trim()).map(e => {
      const { _value, _system, ...rest } = e;
      let marks = _value;
      if (_system === 'Percentage (%)') marks = `${_value}%`;
      else if (_system === 'CGPA (4pt)') marks = `${_value}/4`;
      else if (_system === 'CGPA (10pt)') marks = `${_value}/10`;
      
      return { ...rest, marks };
    });

    try {
      const saved = await updateSection('education', { items: filled });
      if (saved && onNext) onNext();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (Array.isArray(errs) && errs.length > 0 && errs[0].message) {
        toast.error(errs[0].message);
      } else {
        toast.error(err.response?.data?.message || 'Validation failed. Please check your inputs.');
      }
    }
  };

  const ic = (i, field) => `w-full px-3 py-2 rounded-lg border ${errors[i]?.[field] ? 'border-red-400 bg-red-50/30 text-red-900 placeholder-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white text-gray-900'} focus:ring-2 outline-none text-sm transition-all ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`;
  const errText = (i, field) => errors[i]?.[field] ? <p className="text-xs text-red-500 mt-1 font-medium">{errors[i][field]}</p> : null;

  return (
    <SectionLayout title="Educational Qualifications" subtitle="Start from your highest degree (Post-Doctoral/PhD) down." onNext={handleNext} onBack={onBack} hideNext={isReadOnly}>
      <div className="space-y-6">
        {list.map((edu, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                Qualification
              </h3>
              {list.length > 1 && !isReadOnly && <button onClick={() => removeRow(i)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span>Remove</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.examPassed ? 'text-red-500' : 'text-gray-500'}`}>Exam Passed <span className="text-red-500">*</span></label>
                <select value={edu.examPassed} onChange={e => set(i, 'examPassed', e.target.value)} className={ic(i, 'examPassed')} disabled={isReadOnly}>
                  <option value="">Select</option>
                  {EXAM_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errText(i, 'examPassed')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.discipline ? 'text-red-500' : 'text-gray-500'}`}>Discipline / Subject <span className="text-red-500">*</span></label>
                <input value={edu.discipline} onChange={e => set(i, 'discipline', e.target.value)} className={ic(i, 'discipline')} placeholder="e.g. Computer Science" disabled={isReadOnly} />
                {errText(i, 'discipline')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.boardUniversity ? 'text-red-500' : 'text-gray-500'}`}>Board / University <span className="text-red-500">*</span></label>
                <input value={edu.boardUniversity} onChange={e => set(i, 'boardUniversity', e.target.value)} className={ic(i, 'boardUniversity')} placeholder="Institute name" disabled={isReadOnly} />
                {errText(i, 'boardUniversity')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?._value ? 'text-red-500' : 'text-gray-500'}`}>Grading System & Value <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select 
                    value={edu._system} 
                    onChange={e => set(i, '_system', e.target.value)} 
                    className={`${ic(i, '_system').replace('w-full', '')} w-[110px] px-1 text-[11px] font-bold`}
                    disabled={isReadOnly}
                  >
                    <option value="CGPA (10pt)">CGPA /10</option>
                    <option value="Percentage (%)">% Marks</option>
                    <option value="CGPA (4pt)">CGPA /4</option>
                  </select>
                  <input 
                    value={edu._value} 
                    onChange={e => set(i, '_value', e.target.value)} 
                    className={`${ic(i, '_value').replace('w-full', '')} flex-1 min-w-0`} 
                    placeholder={edu._system === 'Percentage (%)' ? 'e.g. 85.5' : 'e.g. 8.5'}
                    disabled={isReadOnly}
                  />
                </div>
                {errText(i, '_value')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.classDivision ? 'text-red-500' : 'text-gray-500'}`}>Class / Division <span className="text-red-500">*</span></label>
                <input value={edu.classDivision} onChange={e => set(i, 'classDivision', e.target.value)} className={ic(i, 'classDivision')} placeholder="e.g. First with Distinction" disabled={isReadOnly} />
                {errText(i, 'classDivision')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.yearOfPassing ? 'text-red-500' : 'text-gray-500'}`}>Year of Passing <span className="text-red-500">*</span></label>
                <input value={edu.yearOfPassing} onChange={e => set(i, 'yearOfPassing', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic(i, 'yearOfPassing')} placeholder="YYYY" maxLength={4} disabled={isReadOnly} />
                {errText(i, 'yearOfPassing')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className="text-xs font-semibold text-gray-500 uppercase">NIRF Rank Range (of Institute)</label>
                <select value={edu.nirfRanking?.rank || ''} onChange={e => setNirf(i, 'rank', e.target.value)} className={ic(i, 'rank')} disabled={isReadOnly}>
                  <option value="">N/A</option>
                  {NIRF_RANK_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.rankingYear ? 'text-red-500' : 'text-gray-500'}`}>NIRF Ranking Year</label>
                <input value={edu.nirfRanking?.rankingYear || ''} onChange={e => setNirf(i, 'rankingYear', e.target.value.replace(/\D/g, '').slice(0, 4))} className={ic(i, 'rankingYear')} placeholder="YYYY" maxLength={4} disabled={isReadOnly} />
                {errText(i, 'rankingYear')}
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={addRow} 
          disabled={isReadOnly}
          className={`w-full py-3 border-2 border-dashed rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${isReadOnly ? 'border-gray-100 text-gray-300 cursor-not-allowed hidden' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}
        >
          <span className="material-symbols-outlined">add_circle</span> Add Qualification
        </button>
      </div>
    </SectionLayout>
  );
};

export default Education;
