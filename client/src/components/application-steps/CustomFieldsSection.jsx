import React, { useState, useEffect, useMemo } from "react";
import SectionLayout from '../SectionLayout';
import { useApplication } from "../../hooks/useApplication";

const CustomFieldsSection = ({ customFields, onNext, onBack, isReadOnly }) => {
  const { formData, saveSection } = useApplication();
  const [localData, setLocalData] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Memoize fields to stabilize the useEffect dependency
  const fields = useMemo(() => customFields || [], [customFields]);

  useEffect(() => {
    const existingData = formData.custom || {};
    // Initialize localData with existing data or defaults
    const initial = {};
    fields.forEach(field => {
      initial[field.fieldName] = existingData[field.fieldName] ?? '';
    });
    setLocalData(initial);
  }, [formData.custom, fields]);

  const validate = () => {
    const newErrors = {};
    customFields.forEach(field => {
      if (field.isMandatory && !localData[field.fieldName]) {
        newErrors[field.fieldName] = `${field.fieldName} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (isNext = false) => {
    if (isReadOnly) {
       if (isNext && onNext) onNext();
       return;
    }
    if (!validate()) return;
    setSaving(true);
    try {
      await saveSection('custom', localData);
      if (isNext) onNext();
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    const { fieldName, fieldType, options, isMandatory } = field;
    const value = localData[fieldName] || '';

    const label = (
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
        {fieldName} {isMandatory && <span className="text-red-500">*</span>}
      </label>
    );

    const inputClass = `w-full border-2 rounded-xl px-4 py-3 text-secondary font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-slate-300 ${errors[fieldName] ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200/60 bg-white'} ${isReadOnly ? 'bg-gray-100/50 cursor-not-allowed text-gray-400' : ''}`;

    switch (fieldType) {
      case 'text':
      case 'number':
        return (
          <div key={fieldName} className="space-y-1">
            {label}
            <input
              type={fieldType}
              value={value}
              onChange={(e) => !isReadOnly && setLocalData({ ...localData, [fieldName]: e.target.value })}
              className={inputClass}
              disabled={isReadOnly}
            />
            {errors[fieldName] && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors[fieldName]}</p>}
          </div>
        );
      case 'dropdown':
        return (
          <div key={fieldName} className="space-y-1">
            {label}
            <select
              value={value}
              onChange={(e) => !isReadOnly && setLocalData({ ...localData, [fieldName]: e.target.value })}
              className={inputClass}
              disabled={isReadOnly}
            >
              <option value="">Select Option</option>
              {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {errors[fieldName] && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors[fieldName]}</p>}
          </div>
        );
      case 'textarea':
        return (
          <div key={fieldName} className="space-y-1">
            {label}
            <textarea
              value={value}
              onChange={(e) => !isReadOnly && setLocalData({ ...localData, [fieldName]: e.target.value })}
              className={`${inputClass} min-h-[100px]`}
              disabled={isReadOnly}
            />
            {errors[fieldName] && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors[fieldName]}</p>}
          </div>
        );
      case 'checkbox':
        return (
            <div key={fieldName} className={`flex items-center gap-3 p-4 border-2 rounded-2xl ${isReadOnly ? 'bg-gray-50 border-slate-100' : 'bg-white border-slate-200/60'}`}>
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => !isReadOnly && setLocalData({ ...localData, [fieldName]: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-slate-300 text-primary focus:ring-primary"
                disabled={isReadOnly}
              />
              <span className={`text-sm font-semibold ${isReadOnly ? 'text-gray-400' : 'text-secondary'}`}>{fieldName} {isMandatory && <span className="text-red-500">*</span>}</span>
            </div>
          );
      default:
        return null;
    }
  };

  return (
    <SectionLayout
      title="Custom Information"
      subtitle="Please provide additional details specific to this position"
      onNext={() => handleSave(true)}
      onBack={onBack}
      isSaving={saving}
      hideNext={isReadOnly}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customFields.map(field => renderField(field))}
      </div>
    </SectionLayout>
  );
};

export default CustomFieldsSection;
