import React, { useState } from 'react';

const PdfUpload = ({ label, description, value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate returned URL
      const fakeUrl = URL.createObjectURL(file);
      onChange({ url: fakeUrl, name: file.name, size: file.size });
    } catch (err) {
      setError('Upload failed. Try again.');
    } finally {
      setLoading(false);
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
                 <button 
                   onClick={() => onChange(null)}
                   className="text-green-600 hover:text-red-500 bg-white p-1 rounded transition-colors"
                   title="Remove"
                 >
                   <span className="material-symbols-outlined text-sm block">delete</span>
                 </button>
              </div>
              {value.url && value.url.startsWith('blob:') && (
                <a href={value.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 mr-1">
                  Preview Document
                </a>
              )}
            </div>
          ) : (
            <label className="flex items-center gap-2 px-6 py-2 bg-gray-50 border border-gray-200 text-gray-600 font-medium rounded-lg cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all w-full justify-center">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Upload PDF
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={loading}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;
