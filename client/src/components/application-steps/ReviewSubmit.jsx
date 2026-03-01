import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const ReviewSubmit = ({ onBack }) => {
  const { formData, submitApplication } = useApplication();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Validation Logic (Task A7)
  const validateApplication = () => {
    const errors = [];

    // Core validation
    if (!formData?.personal?.firstName || !formData?.personal?.dob || !formData?.personal?.category) {
      errors.push("Personal Details: Missing required fields (Name, DOB, Category).");
    }
    if (!formData?.education || formData.education.length === 0 || !formData.education[0].degree) {
      errors.push("Education: At least one degree must be filled.");
    }
    if (!formData?.referees || formData.referees.length < 2 || !formData.referees[0].name || !formData.referees[1].name) {
      errors.push("Referees: At least two referees must be provided.");
    }

    // Documents validation
    if (!formData?.documents?.photo || !formData?.documents?.signature) {
      errors.push("Documents: Passport Photo and Signature are mandatory.");
    }
    if (!formData?.documents?.idProof || !formData?.documents?.pgDegree || !formData?.documents?.phdDegree) {
      errors.push("Documents: ID Proof, PG Degree, and PhD Degree PDFs are mandatory.");
    }

    // Declaration validation
    if (!formData?.declaration?.agreed) {
      errors.push("Declaration: You must agree to the declaration in the previous step.");
    }

    return errors;
  };

  const handleProceedToPayment = () => {
    const errors = validateApplication();
    if (errors.length > 0) {
      // Show first 3 errors in toast to avoid clutter
      errors.slice(0, 3).forEach(err => toast.error(err, { duration: 4000 }));
      if (errors.length > 3) {
        toast.error(`...and ${errors.length - 3} more errors. Please check all sections.`, { duration: 5000 });
      }
      return;
    }
    setShowPayment(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading('Processing mock payment and submitting application...');
    
    try {
      const result = await submitApplication();
      if (result.success) {
        toast.success('Application Submitted Successfully!', { id: toastId });
        navigate('/profile', { state: { refresh: true } }); // Go to profile to see My Applications
      } else {
        toast.error(result.message || 'Submission failed.', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during submission.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If showing payment mock screen
  if (showPayment) {
    return (
      <div className="space-y-8 animate-fade-in py-8">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-blue-600 text-4xl">payments</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Fee Payment</h2>
          <p className="text-gray-500 mb-8">
            Please pay the application fee of <strong className="text-gray-800">₹1000</strong> to complete your submission.
          </p>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-8 text-sm text-blue-800">
            <strong>Mock Gateway:</strong> Clicking 'Pay Now' will immediately simulate a successful payment and submit your application.
          </div>

          <div className="flex gap-4">
             <button 
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
             >
                Cancel
             </button>
             <button 
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-colors disabled:opacity-50 flex justify-center items-center"
             >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : 'Pay Now'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  // Review Screen
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary mb-2">Review Application</h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Please verify your details below. If anything is incorrect, use the stepper or "Back" button to return and edit.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Personal Details Summary */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
            Personal Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Full Name</p>
              <p className="font-semibold text-gray-800">{formData?.personal?.firstName} {formData?.personal?.lastName || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Email</p>
              <p className="font-semibold text-gray-800">{formData?.personal?.email || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Category</p>
              <p className="font-semibold text-gray-800">{formData?.personal?.category || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">DOB</p>
              <p className="font-semibold text-gray-800">{formData?.personal?.dob || '-'}</p>
            </div>
          </div>
        </div>

        {/* Counts Summary */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
            Data Summary
          </h3>
          <div className="flex flex-wrap gap-4">
             <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-3">
               <span className="material-symbols-outlined text-gray-400">school</span>
               <div><p className="text-xs text-gray-500">Degrees</p><p className="font-bold">{formData?.education?.length || 0}</p></div>
             </div>
             <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-3">
               <span className="material-symbols-outlined text-gray-400">work</span>
               <div><p className="text-xs text-gray-500">Experiences</p><p className="font-bold">{formData?.experience?.length || 0}</p></div>
             </div>
             <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-3">
               <span className="material-symbols-outlined text-gray-400">menu_book</span>
               <div><p className="text-xs text-gray-500">Publications</p><p className="font-bold">{formData?.publications?.length || 0}</p></div>
             </div>
             <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-3">
               <span className="material-symbols-outlined text-gray-400">stars</span>
               <div><p className="text-xs text-gray-500">Total Credits</p><p className="font-bold text-primary">{formData?.creditPoints?.total || 0}</p></div>
             </div>
          </div>
        </div>
        
        {/* Declaration Status */}
        <div className="p-6">
           <div className={`p-4 rounded-xl border flex items-start gap-3 ${formData?.declaration?.agreed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <span className="material-symbols-outlined">{formData?.declaration?.agreed ? 'check_circle' : 'cancel'}</span>
              <div>
                <p className="font-medium">{formData?.declaration?.agreed ? 'Declaration Agreed' : 'Declaration Missing'}</p>
                <p className="text-sm opacity-80">
                  {formData?.declaration?.agreed ? `Signed at ${formData?.declaration?.place || 'Unknown'} on ${formData?.declaration?.date || 'Unknown'}` : 'You must go back and agree to the declaration.'}
                </p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200 mt-8">
        <button 
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium px-6 py-3 transition-colors w-full sm:w-auto text-center"
        >
          Back to Edit
        </button>
        <button 
          onClick={handleProceedToPayment}
          className="bg-primary hover:bg-primary-dark text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          Proceed to Payment
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewSubmit;
