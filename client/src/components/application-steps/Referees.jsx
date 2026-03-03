import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const EMPTY_ROW = { name: '', designation: '', departmentAddress: '', city: '', pincode: '', phone: '', officialEmail: '', personalEmail: '' };

const Referees = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [list, setList] = useState([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);

  useEffect(() => {
    const saved = formData?.referees;
    if (saved?.items?.length) setList(saved.items.length >= 2 ? saved.items : [...saved.items, ...Array(2 - saved.items.length).fill(null).map(() => ({ ...EMPTY_ROW }))]);
    else if (Array.isArray(saved) && saved.length) setList(saved.length >= 2 ? saved : [...saved, ...Array(2 - saved.length).fill(null).map(() => ({ ...EMPTY_ROW }))]);
    else setList([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  }, [formData?.referees]);

  const set = (i, field, val) => {
    const upd = [...list];
    upd[i] = { ...upd[i], [field]: val };
    setList(upd);
  };

  const handleNext = async () => {
    if (list.length !== 2) { toast.error('Exactly 2 referees are required'); return; }
    const bad = list.some(r =>
      !r.name?.trim() || r.name.trim().length < 2 ||
      !r.designation?.trim() || r.designation.trim().length < 2 ||
      !r.departmentAddress?.trim() || r.departmentAddress.trim().length < 5 ||
      !r.city?.trim() || !/^\d{6}$/.test(r.pincode) ||
      !r.phone?.trim() || r.phone.trim().length < 5 ||
      !r.officialEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.officialEmail) ||
      !r.personalEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.personalEmail)
    );
    if (bad) { toast.error('Please complete all fields for both referees'); return; }
    await updateSection('referees', { items: list });
    if (onNext) onNext();
  };

  const ic = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm';

  return (
    <SectionLayout title="Referees" subtitle="Provide details of exactly 2 referees." onNext={handleNext} onBack={onBack}>
      <div className="space-y-6">
        {list.map((ref, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
            <h3 className="font-semibold text-gray-800">Referee #{i + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Name <span className="text-red-500">*</span></label>
                <input value={ref.name} onChange={e => set(i, 'name', e.target.value)} className={ic} placeholder="Full Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Designation <span className="text-red-500">*</span></label>
                <input value={ref.designation} onChange={e => set(i, 'designation', e.target.value)} className={ic} placeholder="Professor / HOD etc." />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Department & Address <span className="text-red-500">*</span></label>
              <textarea value={ref.departmentAddress} onChange={e => set(i, 'departmentAddress', e.target.value)} className={`${ic} h-16`} placeholder="Department, Institute, Address..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">City <span className="text-red-500">*</span></label>
                <input value={ref.city} onChange={e => set(i, 'city', e.target.value)} className={ic} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Pincode <span className="text-red-500">*</span></label>
                <input value={ref.pincode} onChange={e => set(i, 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={ic} maxLength={6} placeholder="6 digits" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Phone / Fax <span className="text-red-500">*</span></label>
                <input value={ref.phone} onChange={e => set(i, 'phone', e.target.value)} className={ic} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Official Email <span className="text-red-500">*</span></label>
                <input type="email" value={ref.officialEmail} onChange={e => set(i, 'officialEmail', e.target.value)} className={ic} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Personal Email <span className="text-red-500">*</span></label>
                <input type="email" value={ref.personalEmail} onChange={e => set(i, 'personalEmail', e.target.value)} className={ic} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
};

export default Referees;
