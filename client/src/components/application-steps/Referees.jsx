import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const EMPTY_ROW = { name: '', designation: '', departmentAddress: '', city: '', pincode: '', phone: '', officialEmail: '', personalEmail: '' };

const Referees = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [errors, setErrors] = useState([{}, {}]);

  useEffect(() => {
    const saved = formData?.referees;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.items?.length) {
      setList(saved.items.length >= 2 ? saved.items : [...saved.items, ...Array(2 - saved.items.length).fill(null).map(() => ({ ...EMPTY_ROW }))]);
    } else if (Array.isArray(saved) && saved.length) {
      setList(saved.length >= 2 ? saved : [...saved, ...Array(2 - saved.length).fill(null).map(() => ({ ...EMPTY_ROW }))]);
    } else {
      setList([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
    }
  }, [formData?.referees]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);

    const newErrors = [...errors];
    if (newErrors[i] && newErrors[i][field]) {
      newErrors[i][field] = '';
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors = [{}, {}];
    let hasError = false;

    list.forEach((r, index) => {
      if (!r.name?.trim() || r.name.trim().length < 2) { newErrors[index].name = 'Required (Min 2 chars)'; hasError = true; }
      if (!r.designation?.trim() || r.designation.trim().length < 2) { newErrors[index].designation = 'Required (Min 2 chars)'; hasError = true; }
      if (!r.departmentAddress?.trim() || r.departmentAddress.trim().length < 5) { newErrors[index].departmentAddress = 'Required (Min 5 chars)'; hasError = true; }
      if (!r.city?.trim()) { newErrors[index].city = 'Required'; hasError = true; }
      if (!/^\d{6}$/.test(r.pincode)) { newErrors[index].pincode = 'Must be exactly 6 digits'; hasError = true; }
      if (!r.phone?.trim() || r.phone.trim().length < 5) { newErrors[index].phone = 'Required (Min 5 chars)'; hasError = true; }
      if (!r.officialEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.officialEmail)) { newErrors[index].officialEmail = 'Invalid email address'; hasError = true; }
      if (!r.personalEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.personalEmail)) { newErrors[index].personalEmail = 'Invalid email address'; hasError = true; }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleNext = async () => {
    if (list.length !== 2) { toast.error('Exactly 2 referees are required'); return; }

    if (!validate()) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    try {
      const saved = await updateSection('referees', { items: list });
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

  const ic = (i, field) => `w-full px-3 py-2 rounded-lg border ${errors[i]?.[field] ? 'border-red-400 bg-red-50/30 text-red-900 placeholder-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white text-gray-900'} focus:ring-2 outline-none text-sm transition-all`;
  const errText = (i, field) => errors[i]?.[field] ? <p className="text-xs text-red-500 mt-1 font-medium">{errors[i][field]}</p> : null;

  return (
    <SectionLayout title="Referees" subtitle="Provide details of exactly 2 referees." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((ref, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="bg-white border shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
              Referee
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.name ? 'text-red-500' : 'text-gray-500'}`}>Name <span className="text-red-500">*</span></label>
                <input value={ref.name} onChange={e => set(i, 'name', e.target.value)} className={ic(i, 'name')} placeholder="Full Name" />
                {errText(i, 'name')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.designation ? 'text-red-500' : 'text-gray-500'}`}>Designation <span className="text-red-500">*</span></label>
                <input value={ref.designation} onChange={e => set(i, 'designation', e.target.value)} className={ic(i, 'designation')} placeholder="Professor / HOD etc." />
                {errText(i, 'designation')}
              </div>
            </div>
            <div className="space-y-1 block">
              <label className={`text-xs font-semibold uppercase ${errors[i]?.departmentAddress ? 'text-red-500' : 'text-gray-500'}`}>Department & Address <span className="text-red-500">*</span></label>
              <textarea value={ref.departmentAddress} onChange={e => set(i, 'departmentAddress', e.target.value)} className={`${ic(i, 'departmentAddress')} h-16`} placeholder="Department, Institute, Address..." />
              {errText(i, 'departmentAddress')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.city ? 'text-red-500' : 'text-gray-500'}`}>City <span className="text-red-500">*</span></label>
                <input value={ref.city} onChange={e => set(i, 'city', e.target.value)} className={ic(i, 'city')} />
                {errText(i, 'city')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.pincode ? 'text-red-500' : 'text-gray-500'}`}>Pincode <span className="text-red-500">*</span></label>
                <input value={ref.pincode} onChange={e => set(i, 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={ic(i, 'pincode')} maxLength={6} placeholder="6 digits" />
                {errText(i, 'pincode')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.phone ? 'text-red-500' : 'text-gray-500'}`}>Phone / Fax <span className="text-red-500">*</span></label>
                <input value={ref.phone} onChange={e => set(i, 'phone', e.target.value)} className={ic(i, 'phone')} />
                {errText(i, 'phone')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.officialEmail ? 'text-red-500' : 'text-gray-500'}`}>Official Email <span className="text-red-500">*</span></label>
                <input type="email" value={ref.officialEmail} onChange={e => set(i, 'officialEmail', e.target.value)} className={ic(i, 'officialEmail')} />
                {errText(i, 'officialEmail')}
              </div>
              <div className="space-y-1 block">
                <label className={`text-xs font-semibold uppercase ${errors[i]?.personalEmail ? 'text-red-500' : 'text-gray-500'}`}>Personal Email <span className="text-red-500">*</span></label>
                <input type="email" value={ref.personalEmail} onChange={e => set(i, 'personalEmail', e.target.value)} className={ic(i, 'personalEmail')} />
                {errText(i, 'personalEmail')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
};

export default Referees;
