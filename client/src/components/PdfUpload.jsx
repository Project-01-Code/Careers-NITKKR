import React, { useState } from 'react';
import api from '../services/api';

const PdfUpload = ({ label, description, value, onChange, applicationId, sectionType, maxSizeMB = 5, disabled }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    // Validate size using the configurable maxSizeMB prop
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (applicationId && sectionType) {
        // Real upload to server
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await api.post(
          `/applications/${applicationId}/sections/${sectionType}/pdf`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        onChange({
          url: res.data.data.pdfUrl,
          name: file.name,
          size: file.size,
        });
      } else {
        // Fallback: local preview
        const localUrl = URL.createObjectURL(file);
        onChange({ url: localUrl, name: file.name, size: file.size });
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
          `/applications/${applicationId}/sections/${sectionType}/pdf`
        );
      }
      onChange(null);
    } catch (err) {
      console.error('Failed to delete PDF:', err);
      onChange(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl transition-all hover:border-primary/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
            {label}
          </h4>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div className="flex items-center gap-3 md:w-64 justify-end">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          ) : value?.url ? (
            <div className="flex flex-col items-end group w-full">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 w-full justify-between pr-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="text-sm font-medium truncate max-w-[120px]">{value.name || 'Uploaded Document'}</span>
                </div>
                {!disabled && (
                  <button
                    onClick={handleRemove}
                    className="text-green-600 hover:text-red-500 bg-white p-1 rounded transition-colors"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-sm block">delete</span>
                  </button>
                )}
              </div>
              {value.url && !value.url.startsWith('blob:') && (
                <a href={value.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 mr-1">
                  View Document
                </a>
              )}
            </div>
          ) : (
            <label className={`flex items-center gap-2 px-6 py-2 font-medium rounded-lg transition-all w-full justify-center border ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:text-primary'}`}>
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Upload PDF
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading || disabled}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;
