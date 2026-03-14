import React from 'react';
import SectionLayout from '../SectionLayout';
import { useApplication } from '../../context/ApplicationContext';
import ImageUpload from '../ImageUpload';
import PdfUpload from '../PdfUpload';
import toast from 'react-hot-toast';

const DocumentUpload = ({ onNext, onBack }) => {
  const { formData, applicationId, updateLocalSection, setSectionStatus, jobSnapshot } =
    useApplication();

  // Derive values directly from formData (source of truth)
  const photoUrl = formData?.photo?.imageUrl || '';
  const signatureUrl = formData?.signature?.imageUrl || '';
  const finalDocUrl = formData?.documents?.pdfUrl
    ? {
        url: formData.documents.pdfUrl,
        name: 'Final Documents.pdf',
        size: 0,
      }
    : null;

  const requiredSections = jobSnapshot?.requiredSections || [];
  const isPhotoRequired = requiredSections.some(
    (s) => s.sectionType === 'photo'
  );
  const isSignatureRequired = requiredSections.some(
    (s) => s.sectionType === 'signature'
  );
  const isFinalDocRequired = requiredSections.some(
    (s) => s.sectionType === 'final_documents'
  );

  const handleNext = async () => {
    // Validate only if required for this job
    if (isPhotoRequired && !photoUrl) {
      toast.error(
        'Please upload your passport-size photograph before proceeding.'
      );
      return;
    }
    if (isSignatureRequired && !signatureUrl) {
      toast.error('Please upload your scanned signature before proceeding.');
      return;
    }
    // Final documents are validated at submission, not here — user can skip for now
    if (onNext) onNext();
  };

  return (
    <SectionLayout
      title="Upload Documents"
      subtitle="Please upload clear, legible copies of the required documents."
      onNext={handleNext}
      onBack={onBack}
    >
      <div className="space-y-8 animate-fade-in">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 mt-0.5">
            info
          </span>
          <div className="text-sm text-blue-900 leading-relaxed">
            <p>
              <strong>Upload Guidelines:</strong>
            </p>
            <ul className="list-disc ml-4 mt-1 space-y-1 text-blue-800">
              {isPhotoRequired && (
                <li>
                  <strong>Photograph:</strong> Recent passport-size color photo.
                  JPG/PNG, max <strong>200KB</strong>.
                </li>
              )}
              {isSignatureRequired && (
                <li>
                  <strong>Signature:</strong> Sign on white paper with
                  black/blue ink. JPG/PNG, max <strong>200KB</strong>.
                </li>
              )}
              {isFinalDocRequired && (
                <li>
                  <strong>Final Documents:</strong> A single merged PDF
                  containing all certificates (Aadhar/PAN, UG &amp; PG Degrees,
                  PhD Certificate, Category Certificate, NOC, Experience
                  Letters). Max <strong>10MB</strong>.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Images – Photo & Signature */}
        {(isPhotoRequired || isSignatureRequired) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Photo Container */}
            {isPhotoRequired && (
              <div
                className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                  photoUrl
                    ? 'border-green-500 bg-green-50/30'
                    : 'border-red-200 hover:border-red-300'
                }`}
              >
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      person
                    </span>
                    Photograph
                  </span>
                  {photoUrl ? (
                    <span className="material-symbols-outlined text-green-500">
                      check_circle
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </h3>
                <ImageUpload
                  label="Passport Size Photograph"
                  value={photoUrl}
                  onChange={(url) => {
                    updateLocalSection('photo', { imageUrl: url });
                    setSectionStatus('photo', !!url);
                  }}
                  placeholder="Recent color photo. JPG/PNG, max 200KB."
                  applicationId={applicationId}
                  maxSizeKB={200}
                  sectionType="photo"
                />
              </div>
            )}

            {/* Signature Container */}
            {isSignatureRequired && (
              <div
                className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                  signatureUrl
                    ? 'border-green-500 bg-green-50/30'
                    : 'border-red-200 hover:border-red-300'
                }`}
              >
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      draw
                    </span>
                    Signature
                  </span>
                  {signatureUrl ? (
                    <span className="material-symbols-outlined text-green-500">
                      check_circle
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </h3>
                <ImageUpload
                  label="Scanned Signature"
                  value={signatureUrl}
                  onChange={(url) => {
                    updateLocalSection('signature', { imageUrl: url });
                    setSectionStatus('signature', !!url);
                  }}
                  placeholder="Sign on white paper. JPG/PNG, max 200KB."
                  applicationId={applicationId}
                  maxSizeKB={200}
                  sectionType="signature"
                />
              </div>
            )}
          </div>
        )}

        {/* Final Documents — Single Merged PDF */}
        {isFinalDocRequired && (
          <div
            className={`rounded-xl p-6 shadow-sm space-y-4 border-2 transition-all ${
              finalDocUrl?.url
                ? 'border-green-500 bg-green-50/30'
                : 'bg-white border-red-200 hover:border-red-300'
            }`}
          >
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">
                  description
                </span>
                Final Documents (Merged PDF)
              </span>
              {finalDocUrl?.url ? (
                <span className="material-symbols-outlined text-green-500">
                  check_circle
                </span>
              ) : (
                <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                  Required
                </span>
              )}
            </h3>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">
                warning
              </span>
              <div className="text-sm text-amber-900 leading-relaxed">
                <strong>Important:</strong> Merge all of the following documents
                into <strong>one single PDF</strong> before uploading:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>
                    Government ID Proof (Aadhar / PAN / Passport / Voter ID)
                  </li>
                  <li>UG &amp; PG Degree Certificates</li>
                  <li>PhD Degree Certificate (Final or Provisional)</li>
                  <li>Category Certificate (if applicable — OBC/SC/ST/EWS)</li>
                  <li>
                    Experience Certificates (all claimed experience letters)
                  </li>
                  <li>
                    No Objection Certificate (NOC) — if currently employed in
                    Govt/Semi-Govt bodies
                  </li>
                </ul>
                <p className="mt-2 font-medium">
                  Maximum file size: <strong>10MB</strong>. Only PDF format is
                  accepted.
                </p>
              </div>
            </div>

            <PdfUpload
              label="Upload Merged Documents PDF"
              description="All certificates combined into one PDF. Max 10MB."
              value={finalDocUrl}
              onChange={(fileObj) => {
                updateLocalSection('documents', {
                  pdfUrl: fileObj?.url || null,
                });
                setSectionStatus('documents', !!fileObj?.url);
              }}
              applicationId={applicationId}
              sectionType="final_documents"
              maxSizeMB={10}
            />
          </div>
        )}
      </div>
    </SectionLayout>
  );
};

export default DocumentUpload;
