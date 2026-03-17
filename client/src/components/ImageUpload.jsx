import React, { useState } from 'react';
import api from '../services/api';

const ImageUpload = ({ label, value, onChange, placeholder, applicationId, sectionType, maxSizeKB = 200, disabled }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Please upload a valid JPG/PNG image.');
      return;
    }

    // Validate size using the configurable maxSizeKB prop
    if (file.size > maxSizeKB * 1024) {
      setError(`File size must be less than ${maxSizeKB}KB.`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (applicationId && sectionType) {
        // Real upload to server
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post(
          `/applications/${applicationId}/sections/${sectionType}/image`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        onChange(res.data.data.imageUrl);
      } else {
        // Fallback: local preview (no server)
        const localUrl = URL.createObjectURL(file);
        onChange(localUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      if (applicationId && sectionType) {
        await api.delete(
          `/applications/${applicationId}/sections/${sectionType}/image`
        );
      }
      onChange('');
    } catch (err) {
      console.error('Failed to delete image:', err);
      // Still remove locally
      onChange('');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">{label}</h4>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Preview Area */}
        <div className={`w-32 h-32 rounded-xl flex items-center justify-center border-2 border-dashed overflow-hidden relative ${value ? 'border-primary/50' : 'border-gray-300 bg-gray-50'}`}>
          {loading ? (
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          ) : value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove Image"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </>
          ) : (
            <span className="material-symbols-outlined text-4xl text-gray-300">image</span>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <label className={`inline-flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'}`}>
            <span className="material-symbols-outlined text-xl">upload</span>
            Select Image
            <input
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading || disabled}
            />
          </label>
          <p className="text-xs text-gray-500">{placeholder || 'JPG or PNG. Max size 2MB.'}</p>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
