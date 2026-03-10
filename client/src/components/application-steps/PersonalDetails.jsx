import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Enum values that must match server/src/constants.js exactly        */
/* ------------------------------------------------------------------ */
const GENDER = ['Male', 'Female', 'Transgender'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const JOB_CATEGORY = ['GEN', 'SC', 'ST', 'OBC', 'EWS', 'PwD'];
const DEGREE_FROM_TOP_INSTITUTE = ['UG Degree', 'PG Degree', 'PhD Degree'];
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

/* ------------------------------------------------------------------ */
/*  Default state matching personalSchema in sections.validator.js     */
/* ------------------------------------------------------------------ */
const DEFAULTS = {
  postAppliedFor: '',
  departmentDiscipline: '',
  category: '',
  disability: false,
  name: '',
  dob: '',
  fatherName: '',
  nationality: 'Indian',
  gender: '',
  maritalStatus: '',
  aadhar: '',

  // Correspondence address
  corrAddress: '',
  corrCity: '',
  corrDistrict: '',
  corrState: '',
  corrPincode: '',
  mobile: '',
  phone: '',

  // Permanent address
  sameAsCorrespondence: false,
  permAddress: '',
  permCity: '',
  permDistrict: '',
  permState: '',
  permPincode: '',
  permPhone: '',

  // Academic
  specialization: [''],
  phdTitle: '',
  phdUniversity: '',
  phdDate: '',
  degreeFromTopInstitute: [],

  // Optional
  scopusId: '',
  lastPromotionDate: '',
  lastPromotionDesignation: '',
  lastPromotionPayScale: '',
  lastPromotionDepartment: '',
};

const PersonalDetails = ({ onNext, onBack }) => {
  const { formData, updateSection, jobSnapshot } = useApplication();
  const [d, setD] = useState({ ...DEFAULTS });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (formData?.personalDetails && Object.keys(formData.personalDetails).length) {
      setD(prev => ({ ...prev, ...formData.personalDetails }));
    }
  }, [formData?.personalDetails]);

  // Auto-fill postAppliedFor and departmentDiscipline from job
  useEffect(() => {
    if (jobSnapshot) {
      setD(prev => ({
        ...prev,
        postAppliedFor: prev.postAppliedFor || jobSnapshot.designation || jobSnapshot.title || '',
        departmentDiscipline: prev.departmentDiscipline || jobSnapshot.department || '',
      }));
    }
  }, [jobSnapshot]);

  const set = (field, value) => {
    setD(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSpecialization = (idx, val) => {
    const newSpec = [...(d.specialization || [''])];
    newSpec[idx] = val;
    setD(prev => ({ ...prev, specialization: newSpec }));
  };

  const toggleDegreeTop = (val) => {
    const arr = [...(d.degreeFromTopInstitute || [])];
    if (arr.includes(val)) setD(prev => ({ ...prev, degreeFromTopInstitute: arr.filter(v => v !== val) }));
    else setD(prev => ({ ...prev, degreeFromTopInstitute: [...arr, val] }));
  };

  const copyAddress = () => {
    if (d.sameAsCorrespondence) {
      setD(prev => ({ ...prev, sameAsCorrespondence: false }));
    } else {
      setD(prev => ({
        ...prev,
        sameAsCorrespondence: true,
        permAddress: prev.corrAddress,
        permCity: prev.corrCity,
        permDistrict: prev.corrDistrict,
        permState: prev.corrState,
        permPincode: prev.corrPincode,
        permPhone: prev.phone,
      }));
    }
  };

  const validate = () => {
    const e = {};
    if (!d.postAppliedFor?.trim()) e.postAppliedFor = 'Required';
    if (!d.departmentDiscipline?.trim()) e.departmentDiscipline = 'Required';
    if (!d.category) e.category = 'Required';
    if (!d.name?.trim() || d.name.trim().length < 2) e.name = 'Min 2 characters';
    if (!d.dob) e.dob = 'Required';
    if (!d.fatherName?.trim() || d.fatherName.trim().length < 2) e.fatherName = 'Required';
    if (!d.nationality?.trim()) e.nationality = 'Required';
    if (!d.gender) e.gender = 'Required';
    if (!d.maritalStatus) e.maritalStatus = 'Required';

    // Correspondence address
    if (!d.corrAddress?.trim() || d.corrAddress.trim().length < 5) e.corrAddress = 'Min 5 characters';
    if (!d.corrCity?.trim()) e.corrCity = 'Required';
    if (!d.corrDistrict?.trim()) e.corrDistrict = 'Required';
    if (!d.corrState) e.corrState = 'Required';
    if (!/^\d{6}$/.test(d.corrPincode)) e.corrPincode = '6-digit pincode';
    if (!/^[6-9]\d{9}$/.test(d.mobile)) e.mobile = '10-digit mobile (starts 6-9)';

    // Permanent address
    if (!d.permAddress?.trim() || d.permAddress.trim().length < 5) e.permAddress = 'Min 5 characters';
    if (!d.permCity?.trim()) e.permCity = 'Required';
    if (!d.permDistrict?.trim()) e.permDistrict = 'Required';
    if (!d.permState) e.permState = 'Required';
    if (!/^\d{6}$/.test(d.permPincode)) e.permPincode = '6-digit pincode';

    // Academic
    if (!d.specialization?.length || !d.specialization[0]?.trim()) e.specialization = 'At least one required';
    if (!d.phdTitle?.trim() || d.phdTitle.trim().length < 5) e.phdTitle = 'Min 5 characters';
    if (!d.phdUniversity?.trim()) e.phdUniversity = 'Required';
    if (!d.phdDate) e.phdDate = 'Required';
    if (!d.degreeFromTopInstitute?.length) e.degreeFromTopInstitute = 'Select at least one';

    return e;
  };

  const handleNext = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error(`Please fix ${Object.keys(e).length} error(s) before proceeding`);
      return;
    }
    // Clean specialization (remove empty strings)
    const cleanData = {
      ...d,
      specialization: d.specialization.filter(s => s.trim()),
    };
    const saved = await updateSection('personalDetails', cleanData);
    if (saved && onNext) onNext();
  };

  const ic = (f) => `w-full px-3 py-2.5 rounded-lg border ${errors[f] ? 'border-red-400 bg-red-50/30' : 'border-gray-300'} focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`;
  const sc = (f) => `${ic(f)} bg-white`;
  const label = (text, required) => (
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );
  const err = (f) => errors[f] ? <p className="text-xs text-red-500 mt-0.5">{errors[f]}</p> : null;

  return (
    <SectionLayout title="Personal Details" subtitle="Please provide your complete personal, contact, and academic information." onNext={handleNext} onBack={onBack}>
      <div className="space-y-8">

        {/* ---- Post & Department ---- */}
        <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
          <legend className="text-sm font-bold text-primary px-2">Position Information</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              {label('Post Applied For', true)}
              <input value={d.postAppliedFor} disabled className={`${ic('postAppliedFor')} bg-gray-100 cursor-not-allowed`} placeholder="e.g. Assistant Professor Grade-II" />
              {err('postAppliedFor')}
            </div>
            <div className="space-y-1">
              {label('Department / Discipline', true)}
              <input value={d.departmentDiscipline} disabled className={`${ic('departmentDiscipline')} bg-gray-100 cursor-not-allowed`} placeholder="e.g. Computer Science" />
              {err('departmentDiscipline')}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              {label('Category', true)}
              <select value={d.category} onChange={e => set('category', e.target.value)} className={sc('category')}>
                <option value="">Select</option>
                {JOB_CATEGORY.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {err('category')}
            </div>
            <div className="space-y-1 flex items-end gap-3 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={d.disability} onChange={e => set('disability', e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700">Person with Disability (PwD)</span>
              </label>
            </div>
          </div>
        </fieldset>

        {/* ---- Basic Info ---- */}
        <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
          <legend className="text-sm font-bold text-primary px-2">Personal Information</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              {label('Full Name', true)}
              <input value={d.name} onChange={e => set('name', e.target.value)} className={ic('name')} placeholder="Dr. Full Name" />
              {err('name')}
            </div>
            <div className="space-y-1">
              {label("Father's Name", true)}
              <input value={d.fatherName} onChange={e => set('fatherName', e.target.value)} className={ic('fatherName')} placeholder="Father's full name" />
              {err('fatherName')}
            </div>
            <div className="space-y-1">
              {label('Nationality', true)}
              <input value={d.nationality} onChange={e => set('nationality', e.target.value)} className={ic('nationality')} />
              {err('nationality')}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              {label('Date of Birth', true)}
              <input type="date" value={d.dob} onChange={e => set('dob', e.target.value)} className={ic('dob')} />
              {err('dob')}
            </div>
            <div className="space-y-1">
              {label('Gender', true)}
              <select value={d.gender} onChange={e => set('gender', e.target.value)} className={sc('gender')}>
                <option value="">Select</option>
                {GENDER.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {err('gender')}
            </div>
            <div className="space-y-1">
              {label('Marital Status', true)}
              <select value={d.maritalStatus} onChange={e => set('maritalStatus', e.target.value)} className={sc('maritalStatus')}>
                <option value="">Select</option>
                {MARITAL_STATUS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {err('maritalStatus')}
            </div>
            <div className="space-y-1">
              {label('Aadhar No.', false)}
              <input value={d.aadhar} onChange={e => set('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))} className={ic('aadhar')} placeholder="12 digits" maxLength={12} />
            </div>
          </div>
        </fieldset>

        {/* ---- Correspondence Address ---- */}
        <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
          <legend className="text-sm font-bold text-primary px-2">Correspondence Address</legend>
          <div className="space-y-1">
            {label('Address', true)}
            <textarea value={d.corrAddress} onChange={e => set('corrAddress', e.target.value)} className={`${ic('corrAddress')} h-20`} placeholder="Street, Locality..." />
            {err('corrAddress')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              {label('City', true)}
              <input value={d.corrCity} onChange={e => set('corrCity', e.target.value)} className={ic('corrCity')} />
              {err('corrCity')}
            </div>
            <div className="space-y-1">
              {label('District', true)}
              <input value={d.corrDistrict} onChange={e => set('corrDistrict', e.target.value)} className={ic('corrDistrict')} />
              {err('corrDistrict')}
            </div>
            <div className="space-y-1">
              {label('State', true)}
              <select value={d.corrState} onChange={e => set('corrState', e.target.value)} className={sc('corrState')}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {err('corrState')}
            </div>
            <div className="space-y-1">
              {label('Pincode', true)}
              <input value={d.corrPincode} onChange={e => set('corrPincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={ic('corrPincode')} maxLength={6} placeholder="6 digits" />
              {err('corrPincode')}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              {label('Mobile (10 digits)', true)}
              <input value={d.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} className={ic('mobile')} maxLength={10} placeholder="9876543210" />
              {err('mobile')}
            </div>
            <div className="space-y-1">
              {label('Phone / Landline', false)}
              <input value={d.phone} onChange={e => set('phone', e.target.value)} className={ic('phone')} placeholder="Optional" />
            </div>
          </div>
        </fieldset>

        {/* ---- Permanent Address ---- */}
        <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
          <legend className="text-sm font-bold text-primary px-2">Permanent Address</legend>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" checked={d.sameAsCorrespondence} onChange={copyAddress} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-600">Same as Correspondence Address</span>
          </label>
          <div className="space-y-1">
            {label('Address', true)}
            <textarea value={d.permAddress} onChange={e => set('permAddress', e.target.value)} className={`${ic('permAddress')} h-20`} readOnly={d.sameAsCorrespondence} />
            {err('permAddress')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              {label('City', true)}
              <input value={d.permCity} onChange={e => set('permCity', e.target.value)} className={ic('permCity')} readOnly={d.sameAsCorrespondence} />
              {err('permCity')}
            </div>
            <div className="space-y-1">
              {label('District', true)}
              <input value={d.permDistrict} onChange={e => set('permDistrict', e.target.value)} className={ic('permDistrict')} readOnly={d.sameAsCorrespondence} />
              {err('permDistrict')}
            </div>
            <div className="space-y-1">
              {label('State', true)}
              <select value={d.permState} onChange={e => set('permState', e.target.value)} className={sc('permState')} disabled={d.sameAsCorrespondence}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {err('permState')}
            </div>
            <div className="space-y-1">
              {label('Pincode', true)}
              <input value={d.permPincode} onChange={e => set('permPincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={ic('permPincode')} maxLength={6} readOnly={d.sameAsCorrespondence} />
              {err('permPincode')}
            </div>
          </div>
          <div className="space-y-1 md:w-1/2">
            {label('Phone (Permanent)', false)}
            <input value={d.permPhone} onChange={e => set('permPhone', e.target.value)} className={ic('permPhone')} readOnly={d.sameAsCorrespondence} />
          </div>
        </fieldset>

        {/* ---- Academic / PhD Details ---- */}
        <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
          <legend className="text-sm font-bold text-primary px-2">Academic / PhD Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              {label('Specialization(s)', true)}
              {(d.specialization || ['']).map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input value={s} onChange={e => handleSpecialization(i, e.target.value)} className={ic('specialization')} placeholder={`Specialization ${i + 1}`} />
                  {i === 0 && (d.specialization || ['']).length < 2 && (
                    <button type="button" onClick={() => setD(prev => ({ ...prev, specialization: [...(prev.specialization || ['']), ''] }))} className="text-primary hover:bg-primary/5 px-2 rounded text-xl">+</button>
                  )}
                </div>
              ))}
              {err('specialization')}
            </div>
            <div className="space-y-1">
              {label('Scopus ID', false)}
              <input value={d.scopusId} onChange={e => set('scopusId', e.target.value)} className={ic('scopusId')} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-1">
            {label('PhD Thesis Title', true)}
            <input value={d.phdTitle} onChange={e => set('phdTitle', e.target.value)} className={ic('phdTitle')} placeholder="Full title of PhD thesis" />
            {err('phdTitle')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              {label('PhD University / Institution', true)}
              <input value={d.phdUniversity} onChange={e => set('phdUniversity', e.target.value)} className={ic('phdUniversity')} />
              {err('phdUniversity')}
            </div>
            <div className="space-y-1">
              {label('PhD Award Date', true)}
              <input type="date" value={d.phdDate} onChange={e => set('phdDate', e.target.value)} className={ic('phdDate')} />
              {err('phdDate')}
            </div>
          </div>
          <div className="space-y-2">
            {label('Degree(s) from Top Institute (IIT/IISc/NIT/IIIT/Central Univ)', true)}
            <div className="flex flex-wrap gap-3">
              {DEGREE_FROM_TOP_INSTITUTE.map(deg => (
                <label key={deg} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={(d.degreeFromTopInstitute || []).includes(deg)}
                    onChange={() => toggleDegreeTop(deg)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">{deg}</span>
                </label>
              ))}
            </div>
            {err('degreeFromTopInstitute')}
          </div>
        </fieldset>

        {/* ---- Last Promotion (Optional) ---- */}
        <fieldset className="border border-gray-100 rounded-xl p-5 space-y-4 bg-gray-50/50">
          <legend className="text-sm font-medium text-gray-500 px-2">Last Promotion Details (Optional)</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              {label('Promotion Date', false)}
              <input type="date" value={d.lastPromotionDate} onChange={e => set('lastPromotionDate', e.target.value)} className={ic('lastPromotionDate')} />
            </div>
            <div className="space-y-1">
              {label('Designation', false)}
              <input value={d.lastPromotionDesignation} onChange={e => set('lastPromotionDesignation', e.target.value)} className={ic('lastPromotionDesignation')} />
            </div>
            <div className="space-y-1">
              {label('Pay Scale', false)}
              <input value={d.lastPromotionPayScale} onChange={e => set('lastPromotionPayScale', e.target.value)} className={ic('lastPromotionPayScale')} />
            </div>
            <div className="space-y-1">
              {label('Department', false)}
              <input value={d.lastPromotionDepartment} onChange={e => set('lastPromotionDepartment', e.target.value)} className={ic('lastPromotionDepartment')} />
            </div>
          </div>
        </fieldset>

      </div>
    </SectionLayout>
  );
};

export default PersonalDetails;
