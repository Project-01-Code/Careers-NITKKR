import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../../context/ApplicationContext';
import toast from 'react-hot-toast';

const ReviewSubmit = ({ onBack }) => {
  const { formData, applicationId, validateAll, createPaymentOrder, submitApplication, paymentStatus } = useApplication();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleProceedToPayment = async () => {
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Step 1: Validate all sections
      const validation = await validateAll();

      if (!validation.canSubmit) {
        const errors = validation.errors || [];
        setValidationErrors(errors);
        errors.slice(0, 3).forEach(err => {
          const msg = typeof err === 'string' ? err : `${err.section}: ${err.message}`;
          toast.error(msg, { duration: 4000 });
        });
        if (errors.length > 3) {
          toast.error(`...and ${errors.length - 3} more errors. Please check all sections.`, { duration: 5000 });
        }
        return;
      }

      // Step 2: Check payment status
      if (paymentStatus === 'paid' || paymentStatus === 'exempted') {
        // Payment already done — submit directly
        const result = await submitApplication();
        if (result.success) {
          navigate('/profile', { state: { refresh: true } });
        }
        return;
      }

      // Step 3: Create Stripe payment session
      const paymentData = await createPaymentOrder();

      if (paymentData?.url) {
        // Redirect to Stripe Checkout
        window.location.href = paymentData.url;
      } else {
        toast.error('Failed to create payment session. Please try again.');
      }
    } catch (error) {
      console.error('Payment/submission error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If payment already done, allow direct submission
  const handleDirectSubmit = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading('Submitting application...');

    try {
      const result = await submitApplication();
      if (result.success) {
        toast.success('Application Submitted Successfully!', { id: toastId });
        navigate('/profile', { state: { refresh: true } });
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

  const isPaid = paymentStatus === 'paid' || paymentStatus === 'exempted';

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
              <p className="font-semibold text-gray-800">{formData?.personalDetails?.fullName || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Email</p>
              <p className="font-semibold text-gray-800">{formData?.personalDetails?.email || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Phone</p>
              <p className="font-semibold text-gray-800">{formData?.personalDetails?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">DOB</p>
              <p className="font-semibold text-gray-800">{formData?.personalDetails?.dateOfBirth || '-'}</p>
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

        {/* Payment Status */}
        <div className="p-6 border-b border-gray-100">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${isPaid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <span className="material-symbols-outlined">{isPaid ? 'check_circle' : 'payments'}</span>
            <div>
              <p className="font-medium">{isPaid ? 'Payment Complete' : 'Payment Pending'}</p>
              <p className="text-sm opacity-80">
                {isPaid
                  ? 'Application fee has been paid. You can submit your application.'
                  : 'Application fee of ₹1000 will be processed via Stripe secure checkout.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Declaration Status */}
        <div className="p-6">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${formData?.declaration ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <span className="material-symbols-outlined">{formData?.declaration ? 'check_circle' : 'cancel'}</span>
            <div>
              <p className="font-medium">{formData?.declaration ? 'Declaration Agreed' : 'Declaration Missing'}</p>
              <p className="text-sm opacity-80">
                {formData?.declaration
                  ? 'You have agreed to the declaration.'
                  : 'You must go back and agree to the declaration.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            Validation Errors
          </h4>
          <ul className="space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                {typeof err === 'string' ? err : `${err.section}: ${err.message}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200 mt-8">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium px-6 py-3 transition-colors w-full sm:w-auto text-center"
        >
          Back to Edit
        </button>

        {isPaid ? (
          <button
            onClick={handleDirectSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Submit Application
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleProceedToPayment}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-dark text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Proceed to Payment
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmit;
