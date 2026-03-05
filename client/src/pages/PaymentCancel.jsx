import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const { id: applicationId } = useParams();
  const [retrying, setRetrying] = useState(false);

  const handleRetryPayment = async () => {
    if (!applicationId) {
      toast.error('Invalid application ID');
      return;
    }

    setRetrying(true);
    try {
      const res = await api.post('/payments/create-order', { applicationId });
      const redirectUrl = res.data?.data?.url;
      if (!redirectUrl) {
        throw new Error('Missing payment URL');
      }
      window.location.href = redirectUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restart payment');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-amber-700 text-3xl">payments</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment was cancelled</h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            No amount was charged to your account. Your application is still saved in draft mode, and
            you can retry payment anytime to complete submission.
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
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors disabled:opacity-60"
            >
              {retrying ? 'Redirecting...' : 'Retry Payment'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentCancel;
