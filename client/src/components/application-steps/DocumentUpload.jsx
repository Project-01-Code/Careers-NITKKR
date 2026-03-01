import React, { useState, useEffect } from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import ImageUpload from '../ImageUpload';
import PdfUpload from '../PdfUpload';

const DocumentUpload = ({ onNext, onBack }) => {
  const { formData, updateSection } = useApplication();
  const [docs, setDocs] = useState({
    photo: '',
    signature: '',
    idProof: null,
    categoryCert: null,
    ugDegree: null,
    pgDegree: null,
    phdDegree: null,
    experienceCerts: null,
    noc: null,
  });

  useEffect(() => {
    if (formData?.documents) {
      setDocs(prev => ({ ...prev, ...formData.documents }));
    }
  }, [formData?.documents]);

  const handleChange = (field, value) => {
    setDocs(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    updateSection('documents', docs);
    if (onNext) onNext();
  };

  return (
    <SectionLayout 
      title="Upload Documents" 
      subtitle="Please upload clear, legible copies of the requested documents."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-8 animate-fade-in">
        
        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">photo_camera</span>
            Photograph & Signature
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ImageUpload 
              label="Passport Size Photograph" 
              value={docs.photo} 
              onChange={(url) => handleChange('photo', url)} 
              placeholder="Recent color photo. Max 2MB (JPG/PNG)"
            />
            <ImageUpload 
              label="Scanned Signature" 
              value={docs.signature} 
              onChange={(url) => handleChange('signature', url)} 
              placeholder="Sign on white paper with black/blue ink. Max 2MB"
            />
          </div>
        </div>

        {/* Mandatory PDFs */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">article</span>
            Mandatory Documents
          </h3>
          
          <PdfUpload 
            label="Government ID Proof" 
            description="Aadhar, PAN, Passport, or Voter ID. Max 5MB."
            value={docs.idProof}
            onChange={(fileObj) => handleChange('idProof', fileObj)}
          />
          
          <PdfUpload 
            label="PhD Degree Certificate" 
            description="Final degree or provisional certificate. Max 5MB."
            value={docs.phdDegree}
            onChange={(fileObj) => handleChange('phdDegree', fileObj)}
          />

          <PdfUpload 
            label="UG & PG Degree Certificates" 
            description="Merged PDF containing Bachelors and Masters degrees. Max 5MB."
            value={docs.pgDegree}
            onChange={(fileObj) => handleChange('pgDegree', fileObj)}
          />
          
          <PdfUpload 
            label="Category Certificate" 
            description="Required if applying under OBC/SC/ST/EWS. Must be recent. Max 5MB."
            value={docs.categoryCert}
            onChange={(fileObj) => handleChange('categoryCert', fileObj)}
          />
        </div>

        {/* Optional/Conditional PDFs */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-500">folder_open</span>
            Experience & Additional Documents
          </h3>
          
          <PdfUpload 
            label="Experience Certificates" 
            description="Merged PDF of all experience letters claimed. Max 5MB."
            value={docs.experienceCerts}
            onChange={(fileObj) => handleChange('experienceCerts', fileObj)}
          />

          <PdfUpload 
            label="No Objection Certificate (NOC)" 
            description="Required if currently employed in Govt/Semi-Govt/Autonomous bodies. Max 5MB."
            value={docs.noc}
            onChange={(fileObj) => handleChange('noc', fileObj)}
          />
        </div>

      </div>
    </SectionLayout>
  );
};

export default DocumentUpload;
