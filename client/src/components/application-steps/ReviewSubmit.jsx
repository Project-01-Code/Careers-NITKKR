import React, { useState, useCallback } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Human-readable labels for server section types
const SECTION_LABELS = {
  personal: 'Personal Details',
  education: 'Education',
  experience: 'Experience',
  referees: 'Referees',
  publications_journal: 'Journal Publications',
  publications_conference: 'Conference Publications',
  publications_books: 'Books & Chapters',
  patents: 'Patents',
  sponsored_projects: 'Sponsored Projects',
  consultancy_projects: 'Consultancy Projects',
  phd_supervision: 'PhD Supervision',
  subjects_taught: 'Subjects Taught',
  organized_programs: 'Organized Programs',
  credit_points: 'Credit Points',
  other_info: 'Other Information',
  photo: 'Photograph',
  signature: 'Signature',
  final_documents: 'Final Documents (PDF)',
  declaration: 'Declaration',
};

const SECTION_ICONS = {
  personal: 'person',
  education: 'school',
  experience: 'work',
  referees: 'group',
  publications_journal: 'article',
  publications_conference: 'campaign',
  publications_books: 'menu_book',
  patents: 'workspace_premium',
  sponsored_projects: 'science',
  consultancy_projects: 'handshake',
  phd_supervision: 'supervisor_account',
  subjects_taught: 'class',
  organized_programs: 'event',
  credit_points: 'stars',
  other_info: 'info',
  photo: 'photo_camera',
  signature: 'draw',
  final_documents: 'description',
  declaration: 'verified',
};

const ReviewSubmit = ({ onBack, onGoToSection }) => {
  const { formData, jobSnapshot, applicationId, applicationNumber, validateAll, paymentStatus } = useApplication();
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationRun, setValidationRun] = useState(false);
  const navigate = useNavigate();

  const sections = jobSnapshot?.requiredSections || [];
  const feeConfig = jobSnapshot?.applicationFee;
  const feeRequired = feeConfig?.isRequired;

  // Compute the user's fee from category-based fee structure
  const getUserFee = () => {
    if (!feeConfig) return 0;
    const category = formData.personalDetails?.category;
    const categoryFeeMap = {
      GEN: feeConfig.general,
      OBC: feeConfig.obc,
      'OBC-NCL': feeConfig.obc,
      SC: feeConfig.sc_st,
      ST: feeConfig.sc_st,
      EWS: feeConfig.ews,
      PwD: feeConfig.pwd,
    };
    const isPwd = formData.personalDetails?.disability;
    const baseFee = isPwd ? feeConfig.pwd : (categoryFeeMap[category] ?? feeConfig.general ?? 0);
    return baseFee > 0 ? baseFee + 50 : 0; // Add 50 INR transaction fee if base > 0
  };
  const feeAmount = getUserFee();

  // Check if a section has data
  const hasSectionData = useCallback((sectionType) => {
    const sectionMap = {
      personal: () => formData.personalDetails && Object.keys(formData.personalDetails).length > 0 && formData.personalDetails?.name,
      education: () => Array.isArray(formData.education) && formData.education.length > 0,
      experience: () => Array.isArray(formData.experience) && formData.experience.length > 0,
      referees: () => Array.isArray(formData.referees) && formData.referees.length > 0,
      publications_journal: () => Array.isArray(formData.publications) && formData.publications.length > 0,
      publications_conference: () => Array.isArray(formData.conferencePublications) && formData.conferencePublications.length > 0,
      publications_books: () => Array.isArray(formData.booksPublications) && formData.booksPublications.length > 0,
      patents: () => Array.isArray(formData.patents) && formData.patents.length > 0,
      sponsored_projects: () => Array.isArray(formData.projects) && formData.projects.length > 0,
      consultancy_projects: () => Array.isArray(formData.consultancyProjects) && formData.consultancyProjects.length > 0,
      phd_supervision: () => Array.isArray(formData.phdSupervision) && formData.phdSupervision.length > 0,
      subjects_taught: () => Array.isArray(formData.subjectsTaught) && formData.subjectsTaught.length > 0,
      organized_programs: () => Array.isArray(formData.organizedPrograms) && formData.organizedPrograms.length > 0,
      credit_points: () => formData.creditPoints && Object.keys(formData.creditPoints).length > 0,
      other_info: () => formData.otherInfo && Object.keys(formData.otherInfo).length > 0,
      photo: () => !!formData.photo?.imageUrl,
      signature: () => !!formData.signature?.imageUrl,
      final_documents: () => !!formData.documents?.pdfUrl,
      declaration: () => formData.declaration && Object.keys(formData.declaration).length > 0,
    };
    return sectionMap[sectionType]?.() || false;
  }, [formData]);

  // Combine job-specific requirements
  const allTrackedSections = [...sections];

  const knownSections = allTrackedSections.filter(s => SECTION_LABELS[s.sectionType]);
  const mandatorySections = knownSections.filter(s => s.isMandatory);
  const completedCount = mandatorySections.filter(s => hasSectionData(s.sectionType)).length;
  const totalMandatory = mandatorySections.length;
  const progressPercent = totalMandatory > 0 ? Math.round((completedCount / totalMandatory) * 100) : 0;

  // Run validation check
  const handleValidateAll = async () => {
    setValidating(true);
    setValidationErrors([]);
    try {
      const result = await validateAll();
      setValidationRun(true);
      
      const nonPaymentErrors = (result.errors || []).filter(e => e.field !== 'payment' && e.section !== 'payment');
      
      if (nonPaymentErrors.length > 0) {
        setValidationErrors(result.errors || []);
      } else if (!result.canSubmit) {
        // This means canSubmit is false ONLY because of payment
        setValidationErrors(result.errors || []);
        toast.success('All sections verified! Only payment is pending.');
      } else {
        toast.success('All validations passed! You are ready to submit.');
      }
    } catch {
      toast.error('Validation check failed. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  // Final submit / payment handler
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setValidationErrors([]);
    try {
      // Step 1: Validate all
      const validation = await validateAll();
      setValidationRun(true);
      
      // Filter out payment error for the initial check - we'll handle payment in Step 2
      const nonPaymentErrors = (validation.errors || []).filter(e => e.field !== 'payment' && e.section !== 'payment');
      const hasRealErrors = nonPaymentErrors.length > 0;

      if (hasRealErrors) {
        setValidationErrors(validation.errors || []);
        toast.error('Please fix the issues listed below before submitting.');
        setSubmitting(false);
        return;
      }

      // Step 2: If fee required, redirect to Stripe payment
      if (feeRequired && paymentStatus !== 'paid' && paymentStatus !== 'exempted') {
        const res = await api.post('/payments/create-order', { applicationId });
        const paymentData = res.data.data;

        if (paymentData?.url) {
          window.location.href = paymentData.url;
          return;
        } else if (paymentData?.bypassed || paymentData?.exempted) {
          toast.success('Application fee exempted. Submitted successfully!');
          navigate('/profile');
          return;
        } else if (paymentData?.alreadyPending) {
          toast.error('A payment is already pending for this application.');
          return;
        } else {
          toast.error('Failed to initiate payment. Please try again.');
          return;
        }
      }

      // Step 3: Submit directly (free apps or already paid)
      await api.post(`/applications/${applicationId}/submit`);
      toast.success('Application submitted successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const DataRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0 mb-3 last:mb-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 col-span-2 text-wrap break-all">{value || <span className="text-gray-300 italic">Not provided</span>}</span>
    </div>
  );

  const SummarySection = ({ title, icon, sectionKey, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
          {title}
        </h3>
        {sectionKey && (
          <button
            onClick={() => onGoToSection(sectionKey)}
            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit
          </button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const isRequired = (type) => sections.some(s => s.sectionType === type);

  return (
    <div className="max-w-4xl mx-auto py-8">

      {/* Header */}
      <header className="mb-10 text-center animate-fade-in">
        <h1 className="text-3xl font-extrabold text-secondary mb-2">Review Your Application</h1>
        <p className="text-gray-500">Please verify all information before final submission.</p>
        <div className="mt-4 inline-flex items-center gap-3">
          <span className="px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
            App No: {applicationNumber || 'Draft'}
          </span>
          {(paymentStatus === 'paid' || paymentStatus === 'exempted') && (
            <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span> 
              {paymentStatus === 'exempted' ? 'Fee Exempted' : 'Payment Complete'}
            </span>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════ */}
      {/* Section Completion Checklist        */}
      {/* ═══════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">checklist</span>
            Section Completion
          </h2>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${progressPercent === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {completedCount}/{totalMandatory} Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressPercent === 100 ? 'bg-green-500' : progressPercent > 50 ? 'bg-primary' : 'bg-amber-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Section Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {knownSections.map((sec) => {
            const done = hasSectionData(sec.sectionType);
            const label = SECTION_LABELS[sec.sectionType] || sec.sectionType;
            const icon = SECTION_ICONS[sec.sectionType] || 'check_box_outline_blank';
            return (
              <div
                key={sec.sectionType}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${done
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : sec.isMandatory
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
              >
                <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${done ? 'text-green-500' : sec.isMandatory ? 'text-red-400' : 'text-gray-400'}`}>
                  {done ? 'check_circle' : sec.isMandatory ? 'error' : icon}
                </span>
                <span className="font-medium flex-1 truncate">{label}</span>
                {!sec.isMandatory && <span className="text-[10px] uppercase text-gray-400 font-bold">Optional</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════ */}
      {/* Data Summary Sections               */}
      {/* ═══════════════════════════════════ */}

      {/* Personal Details */}
      {isRequired('personal') && (
        <SummarySection title="Personal Details" icon="person" sectionKey="personalDetails">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <DataRow label="Full Name" value={formData.personalDetails?.name} />
            <DataRow label="Date of Birth" value={formData.personalDetails?.dob} />
            <DataRow label="Gender" value={formData.personalDetails?.gender} />
            <DataRow label="Category" value={formData.personalDetails?.category} />
            <DataRow label="Mobile" value={formData.personalDetails?.mobile} />
            <DataRow label="Nationality" value={formData.personalDetails?.nationality} />
            <DataRow label="Aadhar No." value={formData.personalDetails?.aadhar} />
            <DataRow label="Marital Status" value={formData.personalDetails?.maritalStatus} />
          </div>
        </SummarySection>
      )}

      {/* Education */}
      {isRequired('education') && (
        <SummarySection title="Education" icon="school" sectionKey="education">
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
            {(!formData.education || formData.education.length === 0) && (
              <p className="text-sm text-gray-400 italic py-4">No education records added.</p>
            )}
          </div>
        </SummarySection>
      )}

      {/* Experience */}
      {isRequired('experience') && (
        <SummarySection title="Experience" icon="work" sectionKey="experience">
          <div className="space-y-3">
            {(Array.isArray(formData.experience) ? formData.experience : []).map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
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
            {(!formData.experience || formData.experience.length === 0) && (
              <p className="text-sm text-gray-400 italic">No experience records added.</p>
            )}
          </div>
        </SummarySection>
      )}

      {/* Referees */}
      {isRequired('referees') && (
        <SummarySection title="Referees" icon="group" sectionKey="referees">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Array.isArray(formData.referees) ? formData.referees : []).map((ref, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                <h4 className="font-bold text-secondary mb-3">Referee {i + 1}</h4>
                <DataRow label="Name" value={ref.name} />
                <DataRow label="Designation" value={ref.designation} />
                <DataRow label="Email" value={ref.officialEmail} />
              </div>
            ))}
            {(!formData.referees || formData.referees.length === 0) && (
              <p className="text-sm text-gray-400 italic">No referee records added.</p>
            )}
          </div>
        </SummarySection>
      )}

      {/* Documents & Uploads */}
      {(isRequired('final_documents') || isRequired('photo') || isRequired('signature')) && (
        <SummarySection title="Uploads" icon="cloud_upload" sectionKey="documents">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Photo */}
            {isRequired('photo') && (
              <div className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 ${formData.photo?.imageUrl ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                {formData.photo?.imageUrl ? (
                  <img src={formData.photo.imageUrl} alt="Photo" className="w-20 h-20 rounded-full object-cover border-2 border-green-300" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-gray-400">person</span>
                  </div>
                )}
                <span className="text-xs font-bold flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[14px] ${formData.photo?.imageUrl ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.photo?.imageUrl ? 'check_circle' : 'error'}
                  </span>
                  Photograph
                </span>
              </div>
            )}

            {/* Signature */}
            {isRequired('signature') && (
              <div className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 ${formData.signature?.imageUrl ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                {formData.signature?.imageUrl ? (
                  <img src={formData.signature.imageUrl} alt="Signature" className="w-20 h-16 object-contain border-2 border-green-300 rounded bg-white p-1" />
                ) : (
                  <div className="w-20 h-16 bg-gray-200 flex items-center justify-center rounded">
                    <span className="material-symbols-outlined text-3xl text-gray-400">draw</span>
                  </div>
                )}
                <span className="text-xs font-bold flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[14px] ${formData.signature?.imageUrl ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.signature?.imageUrl ? 'check_circle' : 'error'}
                  </span>
                  Signature
                </span>
              </div>
            )}

            {/* Final PDF */}
            {isRequired('final_documents') && (
              <div className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 ${formData.documents?.pdfUrl ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${formData.documents?.pdfUrl ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <span className={`material-symbols-outlined text-3xl ${formData.documents?.pdfUrl ? 'text-green-600' : 'text-gray-400'}`}>
                    picture_as_pdf
                  </span>
                </div>
                <span className="text-xs font-bold flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[14px] ${formData.documents?.pdfUrl ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.documents?.pdfUrl ? 'check_circle' : 'error'}
                  </span>
                  Merged PDF
                </span>
                {formData.documents?.pdfUrl && (
                  <a href={formData.documents.pdfUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline">
                    View Document
                  </a>
                )}
              </div>
            )}
          </div>
        </SummarySection>
      )}

      {/* Credit Points */}
      {isRequired('credit_points') && (
        <SummarySection title="Credit Point Calculation" icon="calculate" sectionKey="credit_points">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-xs text-primary font-bold uppercase mb-1">Total Credits Claimed</p>
                <p className="text-2xl font-black text-primary">{formData.credit_points?.totalCreditsClaimed || '0.0'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Manual Activities</p>
                <p className="text-2xl font-black text-gray-700">{formData.credit_points?.manualActivities?.length || 0} Entries</p>
              </div>
            </div>

            {formData.credit_points?.manualActivities?.length > 0 && (
              <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Activity</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {formData.credit_points.manualActivities.map((act, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-800">Activity {act.activityId}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{act.description}</p>
                        </td>
                        <td className="px-4 py-2 font-bold text-primary">{act.claimedPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SummarySection>
      )}

      {/* Declaration */}
      {isRequired('declaration') && (
        <SummarySection title="Declaration" icon="gavel" sectionKey="declaration">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <span className={`material-symbols-outlined ${formData.declaration?.declareInfoTrue && formData.declaration?.agreeToTerms && formData.declaration?.photoUploaded && formData.declaration?.detailsVerified ? 'text-green-500' : 'text-amber-500'}`}>
                {formData.declaration?.declareInfoTrue && formData.declaration?.agreeToTerms && formData.declaration?.photoUploaded && formData.declaration?.detailsVerified ? 'verified' : 'pending_actions'}
              </span>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "I hereby declare that all statements made and information furnished in this application are true and complete..."
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'declareInfoTrue', label: 'Info is True' },
                    { key: 'agreeToTerms', label: 'Agree to Terms' },
                    { key: 'photoUploaded', label: 'Photo Confirmed' },
                    { key: 'detailsVerified', label: 'Details Verified' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-gray-100">
                      <span className={`material-symbols-outlined text-[16px] ${formData.declaration?.[item.key] ? 'text-green-500' : 'text-gray-300'}`}>
                        {formData.declaration?.[item.key] ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span className={formData.declaration?.[item.key] ? 'text-green-700' : 'text-gray-400'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SummarySection>
      )}

      {/* ═══════════════════════════════════ */}
      {/* Validate All Button                 */}
      {/* ═══════════════════════════════════ */}
      <div className="mb-6">
        <button
          onClick={handleValidateAll}
          disabled={validating}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 hover:border-primary/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {validating ? (
            <>
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Running Validation...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">fact_check</span>
              {validationRun ? 'Re-run Validation Check' : 'Run Pre-Submission Validation Check'}
            </>
          )}
        </button>

        {/* Validation passed indicator */}
        {validationRun && validationErrors.length === 0 && (
          <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-green-600 text-2xl">verified</span>
            </div>
            <div>
              <h4 className="font-bold text-green-800">All Validations Passed!</h4>
              <p className="text-sm text-green-700">Your application is complete and ready for {feeRequired ? 'payment and ' : ''}submission.</p>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              {validationErrors.length} Issue{validationErrors.length > 1 ? 's' : ''} Found — Please Fix Before Submitting
            </h3>
            <ul className="space-y-2">
              {validationErrors.map((err, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-red-700 bg-red-100/50 px-4 py-2.5 rounded-xl">
                  <span className="material-symbols-outlined text-red-400 text-[16px] mt-0.5 flex-shrink-0">close</span>
                  <span>
                    <strong className="capitalize">
                      {SECTION_LABELS[err.section] || err.section || err.field}:
                    </strong>{' '}
                    {err.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════ */}
      {/* Payment Info Card                   */}
      {/* ═══════════════════════════════════ */}
      {feeRequired && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-indigo-600 text-2xl">payments</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 text-lg">Application Fee</h3>
              <p className="text-sm text-indigo-700 mt-1">
                This position requires an application fee. You will be securely redirected to Stripe for payment.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="px-6 py-2 bg-white rounded-xl border border-indigo-200 shadow-sm">
                  <span className="text-2xl font-extrabold text-indigo-900">₹{feeAmount.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-indigo-500 ml-1">INR</span>
                  <span className="text-[10px] text-indigo-400 block mt-1">
                    {formData.personalDetails?.category ? `for ${formData.personalDetails.category}` : 'Base Fee'} {formData.personalDetails?.disability ? '+ PwD' : ''} {feeAmount > 0 ? '+ ₹50 txn fee' : ''}
                  </span>
                </div>
                {paymentStatus === 'paid' || paymentStatus === 'exempted' ? (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {paymentStatus === 'exempted' ? 'Fee Exempted' : 'Paid Successfully'}
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Payment Pending
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Secured by Stripe. Your payment details are never stored on our servers.
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* Final Submit Action                 */}
      {/* ═══════════════════════════════════ */}
      <div className="p-8 bg-secondary rounded-3xl text-white text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Ready to Submit?</h2>
          <p className="text-white/60 mb-2 max-w-lg mx-auto text-sm">
            Once submitted, you cannot edit your application.
          </p>
          {feeRequired && paymentStatus !== 'paid' && paymentStatus !== 'exempted' && (
            <p className="text-amber-300 mb-6 text-sm font-medium flex items-center gap-1 justify-center">
              <span className="material-symbols-outlined text-[16px]">info</span>
              You will be redirected to Stripe to complete payment.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button
              onClick={onBack}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/20"
            >
              <span className="flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Go Back
              </span>
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="px-10 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-extrabold transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">
                    {feeRequired && paymentStatus !== 'paid' && paymentStatus !== 'exempted' ? 'payments' : 'send'}
                  </span>
                  {feeRequired && paymentStatus !== 'paid' && paymentStatus !== 'exempted'
                    ? `Pay ₹${feeAmount.toLocaleString('en-IN')} & Submit`
                    : 'Submit Application'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Application No. {applicationNumber || 'Draft'} • NIT Kurukshetra Careers Portal
      </p>
    </div>
  );
};

export default ReviewSubmit;
