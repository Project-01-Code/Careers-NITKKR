import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line no-unused-vars
const ReviewSubmit = ({ onBack, onGoToStep, onGoToSection }) => {
  const { formData, jobSnapshot, applicationId, applicationNumber } = useApplication();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const sections = jobSnapshot?.requiredSections || [];

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      if (jobSnapshot?.applicationFee?.isRequired && !formData.payment?.transactionId) {
        const res = await api.post('/payments/create-order', { applicationId });
        if (res.data.data?.url) {
          window.location.href = res.data.data.url;
          return;
        }
      }

      await api.post(`/applications/${applicationId}/submit`);
      toast.success('Application submitted successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const SummarySection = ({ title, sectionKey, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 shadow-sm">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-secondary">{title}</h3>
        <button 
          onClick={() => onGoToSection(sectionKey)}
          className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span> Edit
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  const DataRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0 mb-3 last:mb-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 col-span-2 text-wrap break-all">{value || 'Not provided'}</span>
    </div>
  );

  const isRequired = (type) => sections.some(s => s.sectionType === type);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-secondary mb-2">Review Your Application</h1>
        <p className="text-gray-500">Please verify all information before final submission. Click "Edit" to make changes.</p>
        <div className="mt-4 inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
          App No: {applicationNumber || 'Draft'}
        </div>
      </header>

      {/* Personal Details */}
      <SummarySection title="Personal Details" sectionKey="personal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          <DataRow label="Full Name" value={formData.personalDetails?.name} />
          <DataRow label="Date of Birth" value={formData.personalDetails?.dob} />
          <DataRow label="Gender" value={formData.personalDetails?.gender} />
          <DataRow label="Category" value={formData.personalDetails?.category} />
          <DataRow label="Mobile" value={formData.personalDetails?.mobile} />
          <DataRow label="Nationality" value={formData.personalDetails?.nationality} />
        </div>
      </SummarySection>

      {/* Education */}
      {isRequired('education') && (
        <SummarySection title="Education" sectionKey="education">
           <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Exam</th>
                  <th className="pb-2 font-medium">Subject</th>
                  <th className="pb-2 font-medium">Board/Uni</th>
                  <th className="pb-2 font-medium">Marks</th>
                  <th className="pb-2 font-medium text-right">Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(Array.isArray(formData.education) ? formData.education : []).map((item, i) => (
                  <tr key={i} className="text-gray-900">
                    <td className="py-3 font-medium">{item.examPassed}</td>
                    <td className="py-3">{item.discipline}</td>
                    <td className="py-3">{item.boardUniversity}</td>
                    <td className="py-3">{item.marks}</td>
                    <td className="py-3 text-right">{item.yearOfPassing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SummarySection>
      )}

      {/* Experience */}
      {isRequired('experience') && (
        <SummarySection title="Experience" sectionKey="experience">
          <div className="space-y-4">
            {(Array.isArray(formData.experience) ? formData.experience : []).map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl">
                 <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900">{item.designation}</h4>
                    <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 uppercase font-bold text-gray-400">
                      {item.appointmentType}
                    </span>
                 </div>
                 <p className="text-sm text-gray-600">{item.employerNameAddress}</p>
                 <p className="text-xs text-secondary font-medium mt-1">{item.fromDate} — {item.isPresentEmployer ? 'Present' : item.toDate}</p>
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {/* Referees */}
      {isRequired('referees') && (
         <SummarySection title="Referees" sectionKey="referees">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {(Array.isArray(formData.referees) ? formData.referees : []).map((ref, i) => (
               <div key={i} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                  <h4 className="font-bold text-secondary mb-3">Referee {i+1}</h4>
                  <DataRow label="Name" value={ref.name} />
                  <DataRow label="Designation" value={ref.designation} />
                  <DataRow label="Email" value={ref.officialEmail} />
               </div>
             ))}
           </div>
         </SummarySection>
      )}

      {/* Documents */}
      <SummarySection title="Supporting Documents" sectionKey="final_documents">
        <div className="flex flex-wrap gap-3">
          {Object.entries(formData.documents || {}).map(([key]) => (
            <div key={key} className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-100">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
          ))}
          {(!formData.documents || Object.keys(formData.documents).length === 0) && (
            <p className="text-sm text-gray-400 italic">No documents uploaded yet.</p>
          )}
        </div>
      </SummarySection>

      {/* Final Action */}
      <div className="mt-12 p-8 bg-secondary rounded-3xl text-white text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4">Ready to Submit?</h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Once submitted, you cannot edit your application. {jobSnapshot?.applicationFee?.isRequired ? 'You will be redirected to the payment gateway.' : 'This is a free application.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/20"
            >
              Go Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="px-10 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-extrabold transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  {jobSnapshot?.applicationFee?.isRequired ? 'Proceed to Payment' : 'Submit Application'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmit;
