import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

/**
 * PaymentCancel — shown when the user cancels the Stripe Checkout session and is redirected back.
 *
 * With the Stripe Checkout flow, cancellation redirects here via the cancel_url.
 * No payment was processed — the user can safely retry from their application.
 */
const PaymentCancel = () => {
  const navigate = useNavigate();
  const { id: applicationId } = useParams();

  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-amber-700 text-3xl">payments</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Completed</h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            No amount was charged to your account. Your application is still saved in draft mode.
            Return to your application and click <strong>Pay & Submit</strong> to complete payment.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-gray-700">
              If the issue persists, contact support at{' '}
              <a
                href="mailto:careers@nitkkr.ac.in"
                className="text-primary font-semibold hover:underline"
              >
                careers@nitkkr.ac.in
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/profile', { state: { refresh: true } })}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Go to Profile
            </button>
            {/* Navigate back to the application form so the user can retry via the modal */}
            {applicationId && (
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors"
              >
                Back to Application
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentCancel;
